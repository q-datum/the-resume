package com.muryshkin.net.backend.common;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

/**
 * Represents a standardized error response returned by the backend.
 */
@Data
@Builder
public class ResponseError {
    private String error;
    private String message;
    private int status;
    private Instant timestamp;
}
