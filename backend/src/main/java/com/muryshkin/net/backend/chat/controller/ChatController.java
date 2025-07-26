package com.muryshkin.net.backend.chat.controller;

import com.muryshkin.net.backend.chat.entity.ChatMessage;
import com.muryshkin.net.backend.chat.service.ChatService;
import com.muryshkin.net.backend.chat.service.SessionService;
import com.muryshkin.net.backend.security.RateLimitService;
import com.muryshkin.net.backend.security.RecaptchaService;
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
 * SessionService, RateLimitService, and RecaptchaService.
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
    private final RecaptchaService recaptchaService;

    /**
     * Creates a new chat session and returns the session ID.
     * <p>
     * This endpoint applies rate limiting to prevent abuse
     * (maximum 5 sessions per minute per IP).
     * </p>
     * Example: POST /api/chat/session
     */
    @PostMapping("/session")
    public Mono<String> createSession(
            @RequestParam String recaptchaToken,
            HttpServletRequest request) {

        validateArgument("recaptchaToken", recaptchaToken);
        String clientIp = request.getRemoteAddr();
        rateLimitService.checkSessionLimit(clientIp);

        log.info("Creating new session for IP={}", clientIp);

        return recaptchaService.verifyToken(recaptchaToken)
                .flatMap(valid -> {
                    if (!valid) {
                        log.warn("Invalid reCAPTCHA token for IP={}", clientIp);
                        return Mono.error(new SecurityException("Invalid reCAPTCHA verification."));
                    }
                    return sessionService.createSession(clientIp);
                });
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
     * @param recaptchaToken Google reCAPTCHA token for bot protection.
     * @return a Flux emitting tokens of the assistant's response as they arrive.
     * <p></p>
     * Example: GET /api/chat/stream?sessionId=abc123&message=Hello&recaptchaToken=xyz
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamChat(
            @RequestParam String sessionId,
            @RequestParam String message,
            @RequestParam String recaptchaToken,
            HttpServletRequest request) {

        validateArgument("sessionId", sessionId);
        validateArgument("message", message);
        validateArgument("recaptchaToken", recaptchaToken);

        String clientIp = request.getRemoteAddr();
        rateLimitService.checkMessageLimit(clientIp);

        log.info("Received streaming request: sessionId={}, message={}, IP={}", sessionId, message, clientIp);

        return recaptchaService.verifyToken(recaptchaToken)
                .flatMapMany(valid -> {
                    if (!valid) {
                        log.warn("Invalid reCAPTCHA token for IP={}", clientIp);
                        return Flux.error(new SecurityException("Invalid reCAPTCHA verification."));
                    }
                    return sessionService.validateSession(sessionId, clientIp)
                            .thenMany(chatService.streamChatResponse(sessionId, message));
                });
    }

    /**
     * Retrieves the chat history for a given session.
     * <p></p>
     * Example: GET /api/chat/history?sessionId=abc123&recaptchaToken=xyz
     */
    @GetMapping("/history")
    public Flux<ChatMessage> getHistory(
            @RequestParam String sessionId,
            @RequestParam String recaptchaToken,
            HttpServletRequest request) {

        validateArgument("sessionId", sessionId);
        validateArgument("recaptchaToken", recaptchaToken);

        String clientIp = request.getRemoteAddr();
        log.info("Fetching chat history for sessionId={} from IP={}", sessionId, clientIp);

        return recaptchaService.verifyToken(recaptchaToken)
                .flatMapMany(valid -> {
                    if (!valid) {
                        log.warn("Invalid reCAPTCHA token for IP={}", clientIp);
                        return Flux.error(new SecurityException("Invalid reCAPTCHA verification."));
                    }
                    return sessionService.validateSession(sessionId, clientIp)
                            .thenMany(chatService.getChatHistory(sessionId));
                });
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
