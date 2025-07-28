package com.muryshkin.net.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public class RecaptchaVerificationException extends ResponseStatusException {
    public RecaptchaVerificationException(String reason) {
        super(HttpStatus.FORBIDDEN, reason);
    }
}
