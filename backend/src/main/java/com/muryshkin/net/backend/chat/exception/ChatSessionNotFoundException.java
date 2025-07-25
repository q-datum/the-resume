package com.muryshkin.net.backend.chat.exception;

/**
 * Thrown when a requested chat session is not found in the database.
 */
public class ChatSessionNotFoundException extends RuntimeException {
    public ChatSessionNotFoundException(String sessionId) {
        super("Chat session not found: " + sessionId);
    }
}
