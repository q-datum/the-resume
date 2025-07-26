package com.muryshkin.net.backend.chat.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.muryshkin.net.backend.chat.entity.ChatMessage;
import com.muryshkin.net.backend.chat.entity.ChatSession;
import com.muryshkin.net.backend.chat.exception.ChatSessionNotFoundException;
import com.muryshkin.net.backend.chat.exception.OpenAiServiceException;
import com.muryshkin.net.backend.chat.repository.ChatMessageRepository;
import com.muryshkin.net.backend.chat.repository.ChatSessionRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.r2dbc.core.DatabaseClient;
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
 * Reactive service responsible for managing chat sessions,
 * streaming assistant responses, and persisting chat history.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatSessionRepository sessionRepository;
    private final ChatMessageRepository messageRepository;
    private final DatabaseClient databaseClient;
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
        log.info("Streaming chat response: sessionId={}, message={}", sessionId, message);
        AtomicReference<StringBuilder> assistantReplyBuffer = new AtomicReference<>(new StringBuilder());

        return getOrCreateSession(sessionId)
                .flatMap(session -> saveUserMessage(session, message))
                .thenMany(fetchHistory(sessionId)
                        .collectList()
                        .flatMapMany(history -> streamAssistantResponse(history, assistantReplyBuffer)
                                .concatWith(saveAssistantMessageAsync(sessionId, assistantReplyBuffer.get().toString())
                                        .thenMany(Flux.empty()))
                        )
                )
                .doOnComplete(() -> log.info("Final assistant reply for sessionId={}: {}", sessionId, assistantReplyBuffer.get()))
                .doOnError(err -> log.error("Error during chat for sessionId={}: {}", sessionId, err.getMessage()));
    }

    /**
     * Retrieves the chat history for a given session.
     *
     * @param sessionId The session identifier.
     * @return Flux of ChatMessage objects.
     */
    public Flux<ChatMessage> getChatHistory(String sessionId) {
        return messageRepository.findBySessionIdOrderByIdAsc(sessionId);
    }

    // ========================== Private Helper Methods ==========================

    /**
     * Gets an existing session or creates a new one.
     *
     * @param sessionId The session identifier.
     * @return A Mono of ChatSession.
     */
    private Mono<ChatSession> getOrCreateSession(String sessionId) {
        return sessionRepository.findById(sessionId)
                .switchIfEmpty(insertSession(sessionId));
    }

    /**
     * Inserts a new chat session into the database.
     *
     * @param sessionId The session identifier.
     * @return A Mono of ChatSession.
     */
    private Mono<ChatSession> insertSession(String sessionId) {
        return databaseClient.sql("INSERT INTO chat_session (id) VALUES (:id)")
                .bind("id", sessionId)
                .fetch()
                .rowsUpdated()
                .thenReturn(new ChatSession(sessionId));
    }

    /**
     * Saves a user message in the database.
     *
     * @param session The ChatSession.
     * @param message The user message.
     * @return A Mono of ChatMessage.
     */
    private Mono<ChatMessage> saveUserMessage(ChatSession session, String message) {
        return messageRepository.save(ChatMessage.builder()
                .role("user")
                .content(message)
                .sessionId(session.getId())
                .build());
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
    private Flux<String> streamAssistantResponse(List<ChatMessage> history,
                                                 AtomicReference<StringBuilder> buffer) {
        String body = buildRequestBody(history);

        return webClient.post()
                .uri("/chat/completions")
                .header("Authorization", "Bearer " + openAiApiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToFlux(String.class)
                .onErrorMap(ex -> new OpenAiServiceException(ex.getMessage()))
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
    private Mono<Void> saveAssistantMessageAsync(String sessionId, String fullReply) {
        if (fullReply.isEmpty()) return Mono.empty();

        return sessionRepository.findById(sessionId)
                .switchIfEmpty(Mono.error(new ChatSessionNotFoundException(sessionId)))
                .flatMap(session ->
                        messageRepository.save(ChatMessage.builder()
                                .role("assistant")
                                .content(fullReply)
                                .sessionId(session.getId())
                                .build())
                )
                .then();
    }

    /**
     * Builds the JSON message array for OpenAI, including the master prompt and conversation history.
     *
     * @param history The chat history.
     * @return A JSON string representing the request body.
     */
    private String buildRequestBody(List<ChatMessage> history) {
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
            throw new RuntimeException("Failed to serialize messages to JSON", e);
        }
    }

    /**
     * Extracts the token (delta.content) from OpenAI's streaming response.
     *
     * @param chunk The raw response chunk.
     * @return The extracted token or an empty string.
     */
    private String extractToken(String chunk) {
        try {
            // Some APIs might include "data:" prefixes, remove if present
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
