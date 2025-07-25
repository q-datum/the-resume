package com.muryshkin.net.backend.chat.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.muryshkin.net.backend.chat.entity.ChatMessage;
import com.muryshkin.net.backend.chat.entity.ChatSession;
import com.muryshkin.net.backend.chat.repository.ChatMessageRepository;
import com.muryshkin.net.backend.chat.repository.ChatSessionRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
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
 * Reactive service for managing chat sessions and streaming responses
 * from the OpenAI API.
 */
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
        AtomicReference<StringBuilder> assistantReplyBuffer = new AtomicReference<>(new StringBuilder());

        return sessionRepository.findById(sessionId)
                .switchIfEmpty(sessionRepository.save(ChatSession.builder().id(sessionId).build()))
                .flatMapMany(session ->
                        messageRepository.save(ChatMessage.builder()
                                        .role("user")
                                        .content(message)
                                        .sessionId(session.getId())
                                        .build()
                                )
                                .then(
                                        messageRepository.findBySessionIdOrderByIdAsc(session.getId()).collectList()
                                )
                                .flatMapMany(history ->
                                        callOpenAiWithStreaming(history, assistantReplyBuffer)
                                                // Once streaming finishes, save assistant message (returns Mono<Void>)
                                                .concatWith(
                                                        saveAssistantMessageAsync(sessionId, assistantReplyBuffer.get().toString())
                                                                .thenMany(Flux.empty()) // Complete after saving
                                                )
                                )
                );
    }

    /**
     * Calls the OpenAI API in streaming mode and extracts tokens from the response.
     */
    private Flux<String> callOpenAiWithStreaming(List<ChatMessage> history,
                                                 AtomicReference<StringBuilder> assistantReplyBuffer) {
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
                .map(this::extractToken)
                .filter(token -> !token.isEmpty())
                .doOnNext(token -> assistantReplyBuffer.get().append(token));
    }

    /**
     * Builds the JSON message array to send to the OpenAI API.
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
     * Escapes JSON-sensitive characters.
     */
    private String escapeJson(String text) {
        return text.replace("\"", "\\\"")
                .replace("\n", "\\n");
    }

    /**
     * Extracts delta.content from OpenAI streaming JSON chunks.
     */
    private String extractToken(String chunk) {
        try {
            if (!chunk.startsWith("data:")) return "";
            String json = chunk.substring(5).trim(); // remove "data:"
            if ("[DONE]".equals(json)) return "";
            JsonNode node = objectMapper.readTree(json);
            JsonNode delta = node.at("/choices/0/delta/content");
            return delta.isMissingNode() ? "" : delta.asText();
        } catch (Exception e) {
            return "";
        }
    }

    /**
     * Saves the assistant's final response asynchronously.
     */
    private Mono<Void> saveAssistantMessageAsync(String sessionId, String fullReply) {
        if (fullReply.isEmpty()) return Mono.empty();

        return sessionRepository.findById(sessionId)
                .flatMap(session ->
                        messageRepository.save(ChatMessage.builder()
                                .role("assistant")
                                .content(fullReply)
                                .sessionId(session.getId())
                                .build()
                        )
                )
                .then();
    }

    /**
     * Returns the chat history for the given session as a reactive stream.
     */
    public Flux<ChatMessage> getChatHistory(String sessionId) {
        return messageRepository.findBySessionIdOrderByIdAsc(sessionId);
    }
}
