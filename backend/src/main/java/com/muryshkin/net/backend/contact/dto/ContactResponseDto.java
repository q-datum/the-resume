package com.muryshkin.net.backend.contact.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ContactResponseDto {
    private int code;
    private String resultStatus;
    private String errorMessage;
}