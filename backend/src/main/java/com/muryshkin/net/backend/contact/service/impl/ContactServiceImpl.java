package com.muryshkin.net.backend.contact.service.impl;

import com.muryshkin.net.backend.contact.dto.ContactRequestDto;
import com.muryshkin.net.backend.contact.dto.ContactResponseDto;
import com.muryshkin.net.backend.contact.service.ContactNotificationService;
import com.muryshkin.net.backend.contact.service.ContactService;
import com.muryshkin.net.backend.exception.RecaptchaVerificationException;
import com.muryshkin.net.backend.security.RateLimitService;
import com.muryshkin.net.backend.security.RecaptchaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Slf4j
@Service
@RequiredArgsConstructor
public class ContactServiceImpl implements ContactService {

    private final RateLimitService rateLimitService;
    private final RecaptchaService recaptchaService;
    private final ContactNotificationService contactNotificationService;

    @Override
    public Mono<ContactResponseDto> submitContactMessage(String clientIp, ContactRequestDto request) {

        rateLimitService.checkMessageLimit(clientIp);

        return recaptchaService.verifyToken(request.getRecaptchaToken())
                .flatMap(valid -> {
                    if (!valid) {
                        return Mono.error(new RecaptchaVerificationException("reCAPTCHA verification failed."));
                    }

                    // If this sends via RestTemplate (blocking), offload it:
                    return Mono.fromRunnable(() -> contactNotificationService.sendContactNotification(request))
                            .thenReturn(ContactResponseDto.builder()
                                    .code(200)
                                    .resultStatus("SUCCESS")
                                    .errorMessage(null)
                                    .build());
                })
                .doOnSuccess(resp -> log.info(
                        "Contact form submitted successfully from IP={}, name={}, emailPresent={}",
                        clientIp, request.getName(), request.getEmail() != null && !request.getEmail().isBlank()
                ));
    }
}