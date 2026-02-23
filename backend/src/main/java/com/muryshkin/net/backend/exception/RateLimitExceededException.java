package com.muryshkin.net.backend.exception;

/**
 * Exception thrown when an IP exceeds its rate limit.
 */
public class RateLimitExceededException extends RuntimeException {
    public RateLimitExceededException(String message) {
        super(message);
    }
}
