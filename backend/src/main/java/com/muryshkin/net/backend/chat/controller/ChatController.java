package com.muryshkin.net.backend.chat.controller;

import com.muryshkin.net.backend.chat.entity.ChatMessage;
import com.muryshkin.net.backend.chat.service.ChatService;
import com.muryshkin.net.backend.exception.BadRequestException;
import com.muryshkin.net.backend.exception.InvalidTokenException;
import com.muryshkin.net.backend.exception.RecaptchaVerificationException;
import com.muryshkin.net.backend.security.JwtTokenService;
import com.muryshkin.net.backend.security.RateLimitService;
import com.muryshkin.net.backend.security.RecaptchaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import org.springframework.http.server.reactive.ServerHttpRequest;
import java.util.Map;
import java.util.UUID;
import static com.muryshkin.net.backend.common.IpUtil.clientIp;

@Slf4j
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final RateLimitService rateLimitService;
    private final JwtTokenService jwtTokenService;
    private final RecaptchaService recaptchaService;

    /** Create session with reCAPTCHA verification */
    @PostMapping("/session")
    public Mono<Map<String, String>> createSession(
            @RequestParam("recaptchaToken") String recaptchaToken,
            ServerHttpRequest request) {

        if (recaptchaToken == null || recaptchaToken.isBlank()) {
            throw new BadRequestException("Missing reCAPTCHA token.");
        }

        String ip = clientIp(request);
        rateLimitService.checkSessionLimit(ip);

        return recaptchaService.verifyToken(recaptchaToken)
                .flatMap(valid -> {
                    if (!valid) return Mono.error(new RecaptchaVerificationException("reCAPTCHA verification failed."));
                    String sessionId = UUID.randomUUID().toString();
                    String jwt = jwtTokenService.generateToken(sessionId);
                    log.info("Issued new session for IP={}, sessionId={}", ip, sessionId);
                    return Mono.just(Map.of("sessionId", sessionId, "token", jwt));
                });
    }

    /** Renew token with reCAPTCHA and rate limit */
    @PostMapping("/renew")
    public Mono<Map<String, String>> renewToken(
            @RequestHeader("Authorization") String authorization,
            @RequestParam("recaptchaToken") String recaptchaToken,
            ServerHttpRequest request) {

        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new InvalidTokenException("Missing or invalid Authorization header.");
        }
        if (recaptchaToken == null || recaptchaToken.isBlank()) {
            throw new BadRequestException("Missing reCAPTCHA token.");
        }

        String token = authorization.substring(7);
        String ip = clientIp(request);
        rateLimitService.checkRenewLimit(ip);

        return recaptchaService.verifyToken(recaptchaToken)
                .flatMap(valid -> {
                    if (!valid) return Mono.error(new RecaptchaVerificationException("reCAPTCHA verification failed."));
                    String newToken = jwtTokenService.renewToken(token);
                    log.info("Token renewed for IP={}", ip);
                    return Mono.just(Map.of("token", newToken));
                });
    }

    /** Stream chat response */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamChat(
            @RequestHeader("Authorization") String authorization,
            @RequestParam String message,
            ServerHttpRequest request) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new InvalidTokenException("Missing or invalid Authorization header.");
        }
        if (message == null || message.isBlank()) {
            throw new BadRequestException("Message cannot be null or blank.");
        }

        String token = authorization.substring(7);
        String sessionId = jwtTokenService.validateAndGetSessionId(token);

        String ip = clientIp(request);
        rateLimitService.checkMessageLimit(ip);

        log.info("Streaming chat response for sessionId={}, IP={}", sessionId, ip);
        return chatService.streamChatResponse(sessionId, message);
    }

    /** Retrieve chat history */
    @GetMapping("/history")
    public Flux<ChatMessage> getHistory(
            @RequestHeader("Authorization") String authorization) {

        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new InvalidTokenException("Missing or invalid Authorization header.");
        }

        String token = authorization.substring(7);
        String sessionId = jwtTokenService.validateAndGetSessionId(token);

        log.info("Fetching chat history for sessionId={}", sessionId);
        return chatService.getChatHistory(sessionId);
    }
}
