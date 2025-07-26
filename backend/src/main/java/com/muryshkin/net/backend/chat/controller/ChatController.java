package com.muryshkin.net.backend.chat.controller;

import com.muryshkin.net.backend.chat.entity.ChatMessage;
import com.muryshkin.net.backend.chat.service.ChatService;
import com.muryshkin.net.backend.chat.service.SessionService;
import com.muryshkin.net.backend.security.RateLimitService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import jakarta.servlet.http.HttpServletRequest;

/**
 * REST controller responsible for handling chat-related requests.
 * </br>
 * This controller exposes endpoints for:
 * - Creating new chat sessions.
 * - Streaming chat responses from the ChatGPT API.
 * - Retrieving chat history for a given user session.
 * </br>
 * The controller delegates all business logic to the ChatService,
 * SessionService, and RateLimitService.
 */
@Slf4j
@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final SessionService sessionService;
    private final RateLimitService rateLimitService;

    /**
     * Creates a new chat session and returns the session ID.
     * <p>
     * This endpoint applies rate limiting to prevent abuse
     * (maximum 5 sessions per minute per IP).
     * </p>
     * Example: POST /api/chat/session
     */
    @PostMapping("/session")
    public Mono<String> createSession(HttpServletRequest request) {
        String clientIp = request.getRemoteAddr();
        rateLimitService.checkSessionLimit(clientIp);

        log.info("Creating new session for IP={}", clientIp);
        return sessionService.createSession(clientIp);
    }

    /**
     * <h3>Streams chat responses from the backend to the client in real-time.</h3>
     * <p>
     * This endpoint connects to the OpenAI API in streaming mode, returning
     * server-sent events (SSE) as tokens are generated.
     * </p>
     *
     * @param sessionId unique identifier of the user session.
     * @param message   the user's message or query.
     * @return a Flux emitting tokens of the assistant's response as they arrive.
     * <p></p>
     * Example: GET /api/chat/stream?sessionId=abc123&message=Hello
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamChat(
            @RequestParam String sessionId,
            @RequestParam String message,
            HttpServletRequest request) {

        validateArgument("sessionId", sessionId);
        validateArgument("message", message);

        String clientIp = request.getRemoteAddr();
        rateLimitService.checkMessageLimit(clientIp);

        log.info("Received streaming request: sessionId={}, message={}, IP={}", sessionId, message, clientIp);

        return sessionService.validateSession(sessionId, clientIp)
                .thenMany(chatService.streamChatResponse(sessionId, message));
    }

    /**
     * Retrieves the chat history for a given session.
     * <p></p>
     * Example: GET /api/chat/history?sessionId=abc123
     */
    @GetMapping("/history")
    public Flux<ChatMessage> getHistory(@RequestParam String sessionId, HttpServletRequest request) {
        validateArgument("sessionId", sessionId);

        String clientIp = request.getRemoteAddr();
        log.info("Fetching chat history for sessionId={} from IP={}", sessionId, clientIp);

        return sessionService.validateSession(sessionId, clientIp)
                .thenMany(chatService.getChatHistory(sessionId));
    }

    /**
     * Utility method to validate arguments for null or empty values.
     *
     * @param name  the argument name (for logging).
     * @param value the argument value to validate.
     */
    private void validateArgument(String name, String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(name + " must not be null or blank.");
        }
    }
}
