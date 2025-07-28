package com.muryshkin.net.backend.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

@Slf4j
@Service
public class RecaptchaService {

    @Value("${recaptcha.secret.key}")
    private String recaptchaSecret;

    private final WebClient webClient;

    public RecaptchaService() {
        this.webClient = WebClient.create("https://www.google.com");
    }

    // Test-only constructor
    RecaptchaService(String recaptchaSecret, WebClient webClient) {
        this.recaptchaSecret = recaptchaSecret;
        this.webClient = webClient;
    }

    public Mono<Boolean> verifyToken(String token) {
        return webClient.post()
                .uri(uriBuilder -> uriBuilder
                        .path("/recaptcha/api/siteverify")
                        .queryParam("secret", recaptchaSecret)
                        .queryParam("response", token)
                        .build())
                .retrieve()
                .bodyToMono(Map.class)
                .map(response -> {
                    try {
                        Object successValue = response.get("success");
                        if (!(successValue instanceof Boolean)) {
                            log.warn("Unexpected 'success' field type: {}", successValue);
                            return false;
                        }
                        return (Boolean) successValue;
                    } catch (Exception e) {
                        log.error("Error parsing reCAPTCHA response: {}", response, e);
                        return false;
                    }
                })
                .onErrorResume(error -> {
                    log.error("Error verifying reCAPTCHA", error);
                    return Mono.just(false);
                });
    }
}
