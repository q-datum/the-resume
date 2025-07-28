package com.muryshkin.net.backend.security;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import static org.assertj.core.api.Assertions.assertThat;

class RecaptchaServiceTest {

    private RecaptchaService createServiceWithResponse(String responseJson, HttpStatus status) {
        ClientResponse response = ClientResponse.create(status)
                .header("Content-Type", "application/json")
                .body(responseJson)
                .build();
        WebClient mockWebClient = WebClientTestUtils.createMockWebClient(Mono.just(response));
        return new RecaptchaService("fake-secret", mockWebClient);
    }

    @Test
    void verifyToken_ShouldReturnTrue_WhenSuccessIsTrue() {
        RecaptchaService service = createServiceWithResponse("{\"success\":true}", HttpStatus.OK);
        assertThat(service.verifyToken("valid-token").block()).isTrue();
    }

    @Test
    void verifyToken_ShouldReturnFalse_WhenSuccessIsFalse() {
        RecaptchaService service = createServiceWithResponse("{\"success\":false}", HttpStatus.OK);
        assertThat(service.verifyToken("invalid-token").block()).isFalse();
    }

    @Test
    void verifyToken_ShouldReturnFalse_WhenSuccessKeyMissing() {
        RecaptchaService service = createServiceWithResponse("{\"otherKey\":true}", HttpStatus.OK);
        assertThat(service.verifyToken("missing-key").block()).isFalse();
    }

    @Test
    void verifyToken_ShouldReturnFalse_WhenSuccessIsNotBoolean() {
        RecaptchaService service = createServiceWithResponse("{\"success\":\"true\"}", HttpStatus.OK);
        assertThat(service.verifyToken("wrong-type").block()).isFalse();
    }

    @Test
    void verifyToken_ShouldReturnFalse_WhenRequestFails() {
        WebClient mockWebClient = WebClientTestUtils.createMockWebClient(Mono.error(new RuntimeException("Network error")));
        RecaptchaService service = new RecaptchaService("fake-secret", mockWebClient);
        assertThat(service.verifyToken("error-token").block()).isFalse();
    }

    @Test
    void verifyToken_ShouldReturnFalse_OnHttpError() {
        RecaptchaService service = createServiceWithResponse("{\"success\":true}", HttpStatus.BAD_REQUEST);
        assertThat(service.verifyToken("http-error").block()).isFalse();
    }

    @Test
    void verifyToken_ShouldReturnFalse_WhenMalformedJson() {
        RecaptchaService service = createServiceWithResponse("NOT A JSON", HttpStatus.OK);
        assertThat(service.verifyToken("malformed").block()).isFalse();
    }

    @Test
    void verifyToken_ShouldHandleNullToken() {
        RecaptchaService service = createServiceWithResponse("{\"success\":true}", HttpStatus.OK);
        assertThat(service.verifyToken(null).block()).isTrue(); // still returns true if backend says so
    }

    @Test
    void verifyToken_ShouldHandleEmptyToken() {
        RecaptchaService service = createServiceWithResponse("{\"success\":false}", HttpStatus.OK);
        assertThat(service.verifyToken("").block()).isFalse();
    }

    @Test
    void verifyToken_ShouldWork_WithLongToken() {
        String longToken = "a".repeat(5000);
        RecaptchaService service = createServiceWithResponse("{\"success\":true}", HttpStatus.OK);
        assertThat(service.verifyToken(longToken).block()).isTrue();
    }
}
