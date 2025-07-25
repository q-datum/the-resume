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

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Service layer responsible for handling chat logic.
 *
 * This service:
 * - Streams responses from the OpenAI API.
 * - Maintains conversation history per session.
 * - Persists all messages in a PostgreSQL database.
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
     * Streams the assistant response from the OpenAI API.
     * Stores both user and assistant messages in the database.
     *
     * @param sessionId user session ID.
     * @param message   user input message.
     * @return a Flux of tokens representing the assistant's streaming reply.
     */
    public Flux<String> streamChatResponse(String sessionId, String message) {
        ChatSession session = sessionRepository.findById(sessionId)
                .orElseGet(() -> sessionRepository.save(ChatSession.builder().id(sessionId).build()));

        // Save user message
        messageRepository.save(ChatMessage.builder()
                .role("user")
                .content(message)
                .session(session)
                .build());

        // Build message history for OpenAI
        List<ChatMessage> history = messageRepository.findBySessionIdOrderByIdAsc(sessionId);
        String openAiMessages = buildMessages(history);

        String body = """
        {
          "model": "gpt-4o-mini",
          "stream": true,
          "messages": %s
        }
        """.formatted(openAiMessages);

        AtomicReference<StringBuilder> assistantReplyBuffer = new AtomicReference<>(new StringBuilder());

        return webClient.post()
                .uri("/chat/completions")
                .header("Authorization", "Bearer " + openAiApiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToFlux(String.class)
                .map(this::extractToken)
                .filter(token -> !token.isEmpty())
                .doOnNext(token -> assistantReplyBuffer.get().append(token))
                .doOnComplete(() -> saveAssistantMessage(assistantReplyBuffer.get().toString(), session));
    }

    /**
     * Builds the JSON message array for the OpenAI API.
     */
    private String buildMessages(List<ChatMessage> history) {
        List<String> jsonMessages = new ArrayList<>();
        jsonMessages.add(String.format("{\"role\":\"system\",\"content\":\"%s\"}", escapeJson(masterPrompt)));
        for (ChatMessage m : history) {
            jsonMessages.add(String.format("{\"role\":\"%s\",\"content\":\"%s\"}", m.getRole(), escapeJson(m.getContent())));
        }
        return "[" + String.join(",", jsonMessages) + "]";
    }

    /**
     * Escapes quotes for JSON serialization.
     */
    private String escapeJson(String text) {
        return text.replace("\"", "\\\"").replace("\n", "\\n");
    }

    /**
     * Extracts the "delta.content" token from a streaming JSON chunk.
     */
    private String extractToken(String chunk) {
        try {
            if (!chunk.startsWith("data:")) return "";
            String json = chunk.substring(5).trim(); // Remove 'data:' prefix
            if ("[DONE]".equals(json)) return "";
            JsonNode node = objectMapper.readTree(json);
            JsonNode delta = node.at("/choices/0/delta/content");
            return delta.isMissingNode() ? "" : delta.asText();
        } catch (Exception e) {
            return "";
        }
    }

    /**
     * Saves the assistant's full response after streaming is complete.
     */
    private void saveAssistantMessage(String fullReply, ChatSession session) {
        if (fullReply.isEmpty()) return;
        messageRepository.save(ChatMessage.builder()
                .role("assistant")
                .content(fullReply)
                .session(session)
                .build());
    }

    /**
     * Retrieves chat history for a given session.
     *
     * @param sessionId session identifier.
     * @return list of ChatMessage objects in chronological order.
     */
    public List<ChatMessage> getChatHistory(String sessionId) {
        return messageRepository.findBySessionIdOrderByIdAsc(sessionId);
    }
}
