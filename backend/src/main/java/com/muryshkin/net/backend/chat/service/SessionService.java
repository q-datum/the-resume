package com.muryshkin.net.backend.chat.service;

import com.muryshkin.net.backend.chat.repository.ChatSessionRepository;
import com.muryshkin.net.backend.chat.entity.ChatSession;
import com.muryshkin.net.backend.chat.exception.ChatSessionNotFoundException;
import com.muryshkin.net.backend.security.IPBlockingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Service responsible for session creation, validation,
 * and integration with IPBlockingService to prevent abuse.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SessionService {

    private final ChatSessionRepository sessionRepository;
    private final IPBlockingService ipBlockingService;

    /**
     * Creates a new session and stores it in the database.
     *
     * @param clientIp IP address of the client.
     * @return a Mono emitting the new session ID.
     */
    public Mono<String> createSession(String clientIp) {
        if (ipBlockingService.isBlocked(clientIp)) {
            return Mono.error(new RuntimeException("IP is blocked due to too many failed attempts."));
        }
        String sessionId = UUID.randomUUID().toString();
        return sessionRepository.save(new ChatSession(sessionId))
                .thenReturn(sessionId);
    }

    /**
     * Validates the sessionId. Records failed attempts for invalid sessions.
     *
     * @param sessionId The session ID to validate.
     * @param clientIp  IP address of the client.
     * @return a Mono emitting true if session exists, otherwise throws an error.
     */
    public Mono<Void> validateSession(String sessionId, String clientIp) {
        if (ipBlockingService.isBlocked(clientIp)) {
            return Mono.error(new RuntimeException("IP is blocked due to too many failed attempts."));
        }
        return sessionRepository.findById(sessionId)
                .switchIfEmpty(Mono.defer(() -> {
                    ipBlockingService.recordFailedAttempt(clientIp);
                    return Mono.error(new ChatSessionNotFoundException(sessionId));
                }))
                .then();
    }
}
