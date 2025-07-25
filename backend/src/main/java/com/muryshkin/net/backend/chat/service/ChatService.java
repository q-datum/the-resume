package com.muryshkin.net.backend.chat.service;

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
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
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
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${openai.api.key}")
    private String openAiApiKey;

    @Value("${openai.master-prompt.file}")
    private Resource masterPromptResource;

    private final WebClient webClient = WebClient.builder()
            .baseUrl("https://api.openai.com/v1")
            .build();

    private String masterPrompt;

    @PostConstruct
    private void loadMasterPrompt() throws IOException {
        this.masterPrompt = StreamUtils.copyToString(masterPromptResource.getInputStream(), StandardCharsets.UTF_8);
    }

    /**
     * Streams a response from the assistant, persisting both user and assistant messages.
     *
     * @param sessionId The session identifier.
     * @param message   The user message.
     * @return A Flux of tokens representing the assistant's response.
     */
    public Flux<String> streamChatResponse(String sessionId, String message) {
        log.info("Streaming response for sessionId={}, message={}", sessionId, message);
        AtomicReference<StringBuilder> assistantReplyBuffer = new AtomicReference<>(new StringBuilder());

        return getOrCreateSession(sessionId)
                .doOnSuccess(session -> log.debug("Session found/created: {}", sessionId))
                .flatMap(session -> saveUserMessage(session, message)
                        .doOnSuccess(msg -> log.debug("Saved user message: {}", msg.getContent())))
                .thenMany(fetchHistory(sessionId)
                        .collectList()
                        .flatMapMany(history -> {
                            log.debug("Chat history for {} contains {} messages", sessionId, history.size());
                            return streamAssistantResponse(history, assistantReplyBuffer)
                                    .concatWith(
                                            saveAssistantMessageAsync(sessionId, assistantReplyBuffer.get().toString())
                                                    .thenMany(Flux.empty())
                                    );
                        })
                )
                .doOnComplete(() -> log.info("Streaming completed for sessionId={}", sessionId))
                .doOnError(err -> log.error("Error during streaming for sessionId={}: {}", sessionId, err.getMessage()));
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
     */
    private Mono<ChatSession> getOrCreateSession(String sessionId) {
        return sessionRepository.findById(sessionId)
                .switchIfEmpty(sessionRepository.save(ChatSession.builder().id(sessionId).build()));
    }

    /**
     * Saves a user message in the database.
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
     */
    private Flux<ChatMessage> fetchHistory(String sessionId) {
        return messageRepository.findBySessionIdOrderByIdAsc(sessionId);
    }

    /**
     * Streams the assistant's response from the OpenAI API.
     */
    private Flux<String> streamAssistantResponse(List<ChatMessage> history,
                                                 AtomicReference<StringBuilder> buffer) {
        String openAiMessages = buildMessages(history);
        String body = """
        {
          "model": "gpt-4o-mini",
          "stream": true,
          "messages": %s
        }
        """.formatted(openAiMessages);

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
     */
    private String buildMessages(List<ChatMessage> history) {
        StringBuilder sb = new StringBuilder("[");
        sb.append(String.format("{\"role\":\"system\",\"content\":\"%s\"}", escapeJson(masterPrompt)));
        for (ChatMessage m : history) {
            sb.append(",");
            sb.append(String.format("{\"role\":\"%s\",\"content\":\"%s\"}",
                    m.getRole(), escapeJson(m.getContent())));
        }
        sb.append("]");
        return sb.toString();
    }

    /**
     * Escapes special characters for JSON.
     */
    private String escapeJson(String text) {
        return text.replace("\"", "\\\"")
                .replace("\n", "\\n");
    }

    /**
     * Extracts the token (delta.content) from OpenAI's streaming response.
     */
    private String extractToken(String chunk) {
        try {
            if (!chunk.startsWith("data:")) return "";
            String json = chunk.substring(5).trim(); // Remove "data:"
            if ("[DONE]".equals(json)) return "";
            JsonNode node = objectMapper.readTree(json);
            JsonNode delta = node.at("/choices/0/delta/content");
            return delta.isMissingNode() ? "" : delta.asText();
        } catch (Exception e) {
            return "";
        }
    }
}
