package com.muryshkin.net.backend.contact.service;

import com.muryshkin.net.backend.contact.dto.ContactRequestDto;
import com.muryshkin.net.backend.contact.dto.ContactResponseDto;
import reactor.core.publisher.Mono;

public interface ContactService {
    Mono<ContactResponseDto> submitContactMessage(String clientIp, ContactRequestDto request);
}