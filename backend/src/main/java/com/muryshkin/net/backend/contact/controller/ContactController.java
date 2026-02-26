package com.muryshkin.net.backend.contact.controller;

import com.muryshkin.net.backend.contact.dto.ContactRequestDto;
import com.muryshkin.net.backend.contact.dto.ContactResponseDto;
import com.muryshkin.net.backend.contact.service.ContactService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import static com.muryshkin.net.backend.common.IpUtil.clientIp;

@Slf4j
@RestController
@RequestMapping("/api/contact")
@RequiredArgsConstructor
public class ContactController {

    private final ContactService contactService;

    @PostMapping
    public Mono<ResponseEntity<ContactResponseDto>> submitContact(
            @Valid @RequestBody ContactRequestDto payload,
            ServerHttpRequest httpRequest
    ) {
        String ip = clientIp(httpRequest);

        return contactService.submitContactMessage(ip, payload).map(ResponseEntity::ok);
    }
}