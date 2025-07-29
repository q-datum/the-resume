package com.muryshkin.net.backend.chat.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.muryshkin.net.backend.chat.entity.ChatMessage;
import com.muryshkin.net.backend.chat.exception.OpenAiServiceException;
import com.muryshkin.net.backend.chat.repository.ChatMessageRepository;
import com.muryshkin.net.backend.exception.BadRequestException;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Reactive service responsible for managing chat messages,
 * streaming assistant responses, and persisting chat history.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository messageRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${openai.api.key}")
    private String openAiApiKey;

    @Value("${openai.master-prompt.file}")
    private Resource masterPromptResource;

    private final WebClient webClient = WebClient.builder()
            .baseUrl("https://api.openai.com/v1")
            .build();

    private String masterPrompt;

    /**
     * Loads the master prompt from the configured resource file.
     *
     * @throws IOException if reading the master prompt fails.
     */
    @PostConstruct
    private void loadMasterPrompt() throws IOException {
        this.masterPrompt = StreamUtils.copyToString(masterPromptResource.getInputStream(), StandardCharsets.UTF_8);
        log.info("Master prompt loaded: {} characters", masterPrompt.length());
    }

    /**
     * Streams a response from the assistant, persisting both user and assistant messages.
     *
     * @param sessionId The session identifier.
     * @param message   The user message.
     * @return A Flux of tokens representing the assistant's response.
     */
    public Flux<String> streamChatResponse(String sessionId, String message) {
        if (sessionId == null || sessionId.isBlank()) {
            throw new BadRequestException("Session ID cannot be null or blank.");
        }
        if (message == null || message.isBlank()) {
            throw new BadRequestException("Message cannot be null or blank.");
        }

        log.info("Streaming chat response: sessionId={}, message={}", sessionId, message);
        AtomicReference<StringBuilder> assistantReplyBuffer = new AtomicReference<>(new StringBuilder());

        // Save user message, then stream assistant response
        return saveUserMessage(sessionId, message)
                .thenMany(fetchHistory(sessionId)
                        .collectList()
                        .flatMapMany(history -> streamAssistantResponse(history, assistantReplyBuffer)
                                .concatWith(saveAssistantMessageAsync(sessionId, assistantReplyBuffer.get().toString())
                                        .thenMany(Flux.empty()))
                        )
                )
                .doOnComplete(() -> log.info("Final assistant reply for sessionId={}: {}", sessionId, assistantReplyBuffer.get()))
                .doOnError(err -> log.error("Error during chat for sessionId={}: {}", sessionId, err.getMessage(), err));
    }

    /**
     * Retrieves the chat history for a given session.
     *
     * @param sessionId The session identifier.
     * @return Flux of ChatMessage objects.
     */
    public Flux<ChatMessage> getChatHistory(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            throw new BadRequestException("Session ID cannot be null or blank.");
        }
        log.info("Fetching chat history for sessionId={}", sessionId);
        return messageRepository.findBySessionIdOrderByIdAsc(sessionId);
    }

    // ========================== Private Helper Methods ==========================

    /**
     * Saves a user message in the database.
     *
     * @param sessionId The session ID.
     * @param message   The user message.
     * @return A Mono of ChatMessage.
     */
    private Mono<ChatMessage> saveUserMessage(String sessionId, String message) {
        ChatMessage chatMessage = ChatMessage.builder()
                .role("user")
                .content(message)
                .sessionId(sessionId)
                .build();

        log.debug("Saving user message for sessionId={}", sessionId);
        return messageRepository.save(chatMessage);
    }

    /**
     * Fetches chat history as a reactive Flux.
     *
     * @param sessionId The session identifier.
     * @return Flux of ChatMessage objects.
     */
    private Flux<ChatMessage> fetchHistory(String sessionId) {
        return messageRepository.findBySessionIdOrderByIdAsc(sessionId);
    }

    /**
     * Streams the assistant's response from the OpenAI API.
     *
     * @param history The chat history.
     * @param buffer  The buffer to accumulate the assistant's response.
     * @return A Flux of response tokens.
     */
    Flux<String> streamAssistantResponse(List<ChatMessage> history,
                                         AtomicReference<StringBuilder> buffer) {
        String body = buildRequestBody(history);
        log.debug("Sending request to OpenAI API with {} messages.", history.size());

        return webClient.post()
                .uri("/chat/completions")
                .header("Authorization", "Bearer " + openAiApiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToFlux(String.class)
                .onErrorMap(ex -> {
                    log.error("Error from OpenAI API: {}", ex.getMessage(), ex);
                    return new OpenAiServiceException("OpenAI API call failed: " + ex.getMessage());
                })
                .map(this::extractToken)
                .filter(token -> !token.isEmpty())
                .doOnNext(token -> buffer.get().append(token));
    }

    /**
     * Saves the assistant's final response asynchronously.
     *
     * @param sessionId The session identifier.
     * @param fullReply The assistant's full response.
     * @return A Mono signaling completion.
     */
    Mono<Void> saveAssistantMessageAsync(String sessionId, String fullReply) {
        if (fullReply == null || fullReply.isEmpty()) return Mono.empty();

        ChatMessage assistantMessage = ChatMessage.builder()
                .role("assistant")
                .content(fullReply)
                .sessionId(sessionId)
                .build();

        log.debug("Saving assistant response for sessionId={}", sessionId);
        return messageRepository.save(assistantMessage).then();
    }

    /**
     * Builds the JSON message array for OpenAI, including the master prompt and conversation history.
     *
     * @param history The chat history.
     * @return A JSON string representing the request body.
     */
    String buildRequestBody(List<ChatMessage> history) {
        try {
            List<Map<String, String>> msgs = new ArrayList<>();
            msgs.add(Map.of("role", "system", "content", masterPrompt));
            history.forEach(m -> msgs.add(Map.of("role", m.getRole(), "content", m.getContent())));

            return objectMapper.writeValueAsString(Map.of(
                    "model", "gpt-4o-mini",
                    "stream", true,
                    "messages", msgs
            ));
        } catch (JsonProcessingException e) {
            log.error("Failed to build request body", e);
            throw new OpenAiServiceException("Failed to serialize messages for OpenAI request.");
        }
    }

    /**
     * Extracts the token (delta.content) from OpenAI's streaming response.
     *
     * @param chunk The raw response chunk.
     * @return The extracted token or an empty string.
     */
    String extractToken(String chunk) {
        try {
            String json = chunk.startsWith("data:") ? chunk.substring(5).trim() : chunk.trim();
            if ("[DONE]".equals(json)) return "";

            JsonNode node = objectMapper.readTree(json);
            JsonNode delta = node.at("/choices/0/delta/content");
            return delta.isMissingNode() ? "" : delta.asText();
        } catch (Exception e) {
            log.warn("Failed to parse chunk: {}", chunk, e);
            return "";
        }
    }
}