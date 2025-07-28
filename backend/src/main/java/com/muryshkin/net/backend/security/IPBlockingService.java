package com.muryshkin.net.backend.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service responsible for tracking failed validation attempts by IP
 * and blocking abusive clients temporarily.
 */
@Slf4j
@Service
public class IPBlockingService {

    private static final int MAX_FAILED_ATTEMPTS = 10;
    private static final long BLOCK_DURATION_MS = 10 * 60 * 1000; // 10 minutes

    private final Map<String, FailedAttempt> failedAttempts = new ConcurrentHashMap<>();

    /**
     * Records a failed attempt for the given IP.
     * If the IP exceeds the allowed limit, it will be blocked.
     *
     * @param ip the client's IP address
     */
    public void recordFailedAttempt(String ip) {
        if (ip == null || ip.isBlank()) {
            log.warn("Attempted to record failed attempt with null or blank IP. Ignoring.");
            return;
        }

        failedAttempts.compute(ip, (key, attempt) -> {
            if (attempt == null || attempt.isExpired()) {
                return new FailedAttempt(1);
            } else {
                attempt.increment();
                return attempt;
            }
        });

        FailedAttempt attempt = failedAttempts.get(ip);
        log.warn("Failed attempt recorded for IP: {}. Current count: {}", ip, attempt.count);
    }

    /**
     * Checks if the given IP is currently blocked.
     *
     * @param ip the client's IP address
     * @return true if blocked, false otherwise
     */
    public boolean isBlocked(String ip) {
        if (ip == null || ip.isBlank()) {
            return false;
        }

        FailedAttempt attempt = failedAttempts.get(ip);
        if (attempt == null || attempt.isExpired()) {
            return false;
        }
        return attempt.count >= MAX_FAILED_ATTEMPTS;
    }

    /**
     * Represents a single failed attempt tracking entry.
     */
    private static class FailedAttempt {
        private int count;
        private final Instant firstAttempt;

        public FailedAttempt(int initialCount) {
            this.count = initialCount;
            this.firstAttempt = Instant.now();
        }

        public void increment() {
            count++;
        }

        public boolean isExpired() {
            return Instant.now().isAfter(firstAttempt.plusMillis(BLOCK_DURATION_MS));
        }
    }
}
