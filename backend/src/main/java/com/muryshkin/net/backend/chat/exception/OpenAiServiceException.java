package com.muryshkin.net.backend.chat.exception;

/**
 * Thrown when an error occurs while calling the OpenAI API.
 */
public class OpenAiServiceException extends RuntimeException {
    public OpenAiServiceException(String message) {
        super("OpenAI Service Error: " + message);
    }
}
