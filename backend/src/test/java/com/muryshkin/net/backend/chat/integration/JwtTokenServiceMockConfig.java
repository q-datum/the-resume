package com.muryshkin.net.backend.chat.integration;

import com.muryshkin.net.backend.security.JwtTokenService;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.test.context.TestPropertySource;

@TestConfiguration
@TestPropertySource(locations = "classpath:application-test.properties")
public class JwtTokenServiceMockConfig {

    @Bean
    @Primary
    public JwtTokenService mockJwtTokenService() {
        // Use a 32-byte secret to meet HMAC-SHA256 minimum
        String valid256BitSecret = "mock-secret-key-32-characters!!!"; // exactly 32 bytes
        long expiration = 3600000L; // 1 hour

        return new JwtTokenService(valid256BitSecret, expiration) {
            @Override
            public String generateToken(String sessionId) {
                return "mock-token";
            }

            @Override
            public String validateAndGetSessionId(String token) {
                return "test-session"; // always return same
            }

            @Override
            public String renewToken(String oldToken) {
                return "mock-renewed-token";
            }
        };
    }
}
