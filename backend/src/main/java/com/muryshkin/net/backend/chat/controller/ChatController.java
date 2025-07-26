package com.muryshkin.net.backend.chat.controller;

import com.muryshkin.net.backend.chat.entity.ChatMessage;
import com.muryshkin.net.backend.chat.service.ChatService;
import com.muryshkin.net.backend.chat.service.SessionService;
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
 * - Streaming chat responses from the ChatGPT API.
 * - Retrieving chat history for a given user session.
 * - Creating new chat sessions.
 * </br>
 * The controller delegates all business logic to the ChatService and SessionService.
 */
@Slf4j
@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final SessionService sessionService;

    /**
     * Creates a new chat session and returns the session ID.
     * <p></p>
     * Example: POST /api/chat/session
     */
    @PostMapping("/session")
    public Mono<String> createSession(HttpServletRequest request) {
        String clientIp = request.getRemoteAddr();
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
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamChat(
            @RequestParam String sessionId,
            @RequestParam String message,
            HttpServletRequest request) {

        String clientIp = request.getRemoteAddr();
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
        String clientIp = request.getRemoteAddr();
        log.info("Fetching chat history for sessionId={} from IP={}", sessionId, clientIp);
        return sessionService.validateSession(sessionId, clientIp)
                .thenMany(chatService.getChatHistory(sessionId));
    }
}
