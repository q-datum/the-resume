package com.muryshkin.net.backend.common;

import com.muryshkin.net.backend.chat.exception.ChatSessionNotFoundException;
import com.muryshkin.net.backend.chat.exception.OpenAiServiceException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Instant;

/**
 * Centralized handler for all exceptions across controllers,
 * producing a consistent ResponseError object.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ChatSessionNotFoundException.class)
    public ResponseEntity<ResponseError> handleSessionNotFound(ChatSessionNotFoundException ex) {
        log.warn("Session not found: {}", ex.getMessage());
        return buildErrorResponse("Session Not Found", ex.getMessage(), HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(OpenAiServiceException.class)
    public ResponseEntity<ResponseError> handleOpenAiServiceException(OpenAiServiceException ex) {
        log.error("OpenAI API error: {}", ex.getMessage());
        return buildErrorResponse("OpenAI Service Error", ex.getMessage(), HttpStatus.BAD_GATEWAY);
    }

    @ExceptionHandler(WebClientResponseException.class)
    public ResponseEntity<ResponseError> handleWebClientException(WebClientResponseException ex) {
        log.error("WebClient error: {}", ex.getResponseBodyAsString(), ex);
        return buildErrorResponse("External API error", ex.getMessage(), HttpStatus.BAD_GATEWAY);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ResponseError> handleIllegalArgumentException(IllegalArgumentException ex) {
        log.warn("Validation error: {}", ex.getMessage());
        return buildErrorResponse("Validation error", ex.getMessage(), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ResponseError> handleGeneralException(Exception ex) {
        log.error("Unexpected server error: {}", ex.getMessage(), ex);
        return buildErrorResponse("Internal server error", "Something went wrong on the server.", HttpStatus.INTERNAL_SERVER_ERROR);
    }

    private ResponseEntity<ResponseError> buildErrorResponse(String error, String message, HttpStatus status) {
        ResponseError response = ResponseError.builder()
                .error(error)
                .message(message)
                .status(status.value())
                .timestamp(Instant.now())
                .build();
        return ResponseEntity.status(status).body(response);
    }
}
