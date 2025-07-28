package com.muryshkin.net.backend.security;

import com.muryshkin.net.backend.exception.InvalidTokenException;
import io.jsonwebtoken.security.WeakKeyException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

class JwtTokenServiceTest {

    private JwtTokenService jwtTokenService;

    @BeforeEach
    void setUp() {
        // HS256 requires at least 32-byte key
        String secret = "01234567890123456789012345678901";
        long expirationMillis = 1000; // 1 second
        jwtTokenService = new JwtTokenService(secret, expirationMillis);
    }

    // ---------------------
    // GENERATE TOKEN TESTS
    // ---------------------
    @Test
    void generateToken_ShouldReturnValidToken() {
        String token = jwtTokenService.generateToken("session123");
        assertThat(token).isNotBlank();
        assertThat(jwtTokenService.validateAndGetSessionId(token)).isEqualTo("session123");
    }

    @Test
    void generateToken_ShouldThrow_WhenSessionIdIsBlank() {
        assertThatThrownBy(() -> jwtTokenService.generateToken(""))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("SessionId cannot be null or blank");
    }

    @Test
    void generateToken_ShouldThrow_WhenSessionIdIsNull() {
        assertThatThrownBy(() -> jwtTokenService.generateToken(null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void generateToken_WithVeryLongSessionId_ShouldWork() {
        String longSessionId = "a".repeat(500);
        String token = jwtTokenService.generateToken(longSessionId);
        assertThat(jwtTokenService.validateAndGetSessionId(token)).isEqualTo(longSessionId);
    }

    // ---------------------
    // VALIDATION TESTS
    // ---------------------
    @Test
    void validateAndGetSessionId_ShouldReturnSessionId_WhenValidToken() {
        String token = jwtTokenService.generateToken("validSession");
        assertThat(jwtTokenService.validateAndGetSessionId(token)).isEqualTo("validSession");
    }

    @Test
    void validateAndGetSessionId_ShouldThrow_WhenTokenIsNull() {
        assertThatThrownBy(() -> jwtTokenService.validateAndGetSessionId(null))
                .isInstanceOf(InvalidTokenException.class)
                .hasMessageContaining("JWT token is missing");
    }

    @Test
    void validateAndGetSessionId_ShouldThrow_WhenTokenIsBlank() {
        assertThatThrownBy(() -> jwtTokenService.validateAndGetSessionId(" "))
                .isInstanceOf(InvalidTokenException.class)
                .hasMessageContaining("JWT token is missing");
    }

    @Test
    void validateAndGetSessionId_ShouldThrow_WhenTokenIsMalformed() {
        assertThatThrownBy(() -> jwtTokenService.validateAndGetSessionId("malformed.token"))
                .isInstanceOf(InvalidTokenException.class)
                .hasMessageContaining("Invalid JWT token");
    }

    @Test
    void validateAndGetSessionId_ShouldThrow_WhenTokenExpired() throws InterruptedException {
        String token = jwtTokenService.generateToken("expireTest");
        Thread.sleep(1100); // wait for 1.1 seconds
        assertThatThrownBy(() -> jwtTokenService.validateAndGetSessionId(token))
                .isInstanceOf(InvalidTokenException.class)
                .hasMessageContaining("expired");
    }

    // ---------------------
    // RENEWAL TESTS
    // ---------------------
    @Test
    void renewToken_ShouldReturnNewTokenWithSameSessionId() {
        String token = jwtTokenService.generateToken("renewSession");
        String renewed = jwtTokenService.renewToken(token);

        assertThat(renewed).isNotBlank();
        assertThat(renewed).isNotEqualTo(token); // because new iat/exp
        assertThat(jwtTokenService.validateAndGetSessionId(renewed)).isEqualTo("renewSession");
    }

    @Test
    void renewToken_ShouldThrow_WhenOldTokenIsInvalid() {
        assertThatThrownBy(() -> jwtTokenService.renewToken("invalid"))
                .isInstanceOf(InvalidTokenException.class);
    }

    // ---------------------
    // EDGE CASE: Weak Key
    // ---------------------
    @Test
    void constructor_ShouldThrow_WhenKeyTooShort() {
        String shortKey = "short-key";
        assertThatThrownBy(() -> new JwtTokenService(shortKey, 1000))
                .isInstanceOf(WeakKeyException.class);
    }

    @Test
    void token_ShouldExpireImmediately_WhenExpirationZero() {
        JwtTokenService zeroExpService = new JwtTokenService("01234567890123456789012345678901", 0);
        String token = zeroExpService.generateToken("test");
        assertThatThrownBy(() -> zeroExpService.validateAndGetSessionId(token))
                .isInstanceOf(InvalidTokenException.class)
                .hasMessageContaining("expired");
    }
}
