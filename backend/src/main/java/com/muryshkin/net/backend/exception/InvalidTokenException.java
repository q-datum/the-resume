package com.muryshkin.net.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public class InvalidTokenException extends ResponseStatusException {
    public InvalidTokenException(String reason) {
        super(HttpStatus.UNAUTHORIZED, reason);
    }
}