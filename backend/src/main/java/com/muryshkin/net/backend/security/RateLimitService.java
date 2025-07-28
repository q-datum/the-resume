package com.muryshkin.net.backend.security;

import com.muryshkin.net.backend.exception.RateLimitExceededException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service responsible for rate-limiting user requests based on IP addresses.
 * Limits:
 *  - Max 5 sessions per minute per IP.
 *  - Max 20 messages per minute per IP.
 *  - Max 3 token renewals per 10 minutes per IP.
 */
@Slf4j
@Service
public class RateLimitService {

    private static final int MAX_SESSIONS_PER_MINUTE = 5;
    private static final int MAX_MESSAGES_PER_MINUTE = 20;
    private static final int MAX_RENEWS_PER_10_MINUTES = 3;

    private static final long ONE_MINUTE = 60 * 1000;
    private static final long TEN_MINUTES = 10 * 60 * 1000;

    private final Map<String, RequestCounter> sessionRequests = new ConcurrentHashMap<>();
    private final Map<String, RequestCounter> messageRequests = new ConcurrentHashMap<>();
    private final Map<String, RequestCounter> renewRequests = new ConcurrentHashMap<>();

    /** Checks if the IP can create a new session. */
    public void checkSessionLimit(String ip) {
        checkLimit(sessionRequests, ip, MAX_SESSIONS_PER_MINUTE, ONE_MINUTE, "session creation");
    }

    /** Checks if the IP can send a new message. */
    public void checkMessageLimit(String ip) {
        checkLimit(messageRequests, ip, MAX_MESSAGES_PER_MINUTE, ONE_MINUTE, "message sending");
    }

    /** Checks if the IP can renew a token. */
    public void checkRenewLimit(String ip) {
        checkLimit(renewRequests, ip, MAX_RENEWS_PER_10_MINUTES, TEN_MINUTES, "token renewal");
    }

    private void checkLimit(Map<String, RequestCounter> map, String ip, int max, long periodMs, String action) {
        RequestCounter counter = map.computeIfAbsent(ip, k -> new RequestCounter());
        synchronized (counter) {
            long now = Instant.now().toEpochMilli();
            if (now - counter.timestamp > periodMs) {
                counter.reset(now);
            }

            if (counter.count >= max) {
                log.warn("Rate limit exceeded for {}: {}", action, ip);
                throw new RateLimitExceededException(
                        String.format("Rate limit exceeded for %s. Try again later.", action));
            }

            counter.count++;
        }
    }

    private static class RequestCounter {
        long timestamp = Instant.now().toEpochMilli();
        int count = 0;

        void reset(long now) {
            this.timestamp = now;
            this.count = 0;
        }
    }
}
