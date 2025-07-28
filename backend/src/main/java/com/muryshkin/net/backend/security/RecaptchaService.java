package com.muryshkin.net.backend.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecaptchaService {

    @Value("${recaptcha.secret.key}")
    private String recaptchaSecret;

    private final WebClient webClient = WebClient.create("https://www.google.com");

    public Mono<Boolean> verifyToken(String token) {
        return webClient.post()
                .uri(uriBuilder -> uriBuilder
                        .path("/recaptcha/api/siteverify")
                        .queryParam("secret", recaptchaSecret)
                        .queryParam("response", token)
                        .build())
                .retrieve()
                .bodyToMono(Map.class)
                .map(response -> (Boolean) response.get("success"))
                .onErrorResume(error -> {
                    log.error("Error verifying reCAPTCHA", error);
                    return Mono.just(false);
                });
    }
}
