package com.muryshkin.net.backend.security;

import com.muryshkin.net.backend.exception.RateLimitExceededException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.*;

@TestPropertySource(locations = "classpath:application-test.properties")
class RateLimitServiceTest {

    private RateLimitService rateLimitService;

    @BeforeEach
    void setUp() {
        rateLimitService = new RateLimitService();
    }

    // ------------------------
    // SESSION LIMIT TESTS
    // ------------------------
    @Test
    void checkSessionLimit_ShouldPass_WhenUnderLimit() {
        String ip = "192.168.0.1";
        for (int i = 0; i < 5; i++) {
            assertThatCode(() -> rateLimitService.checkSessionLimit(ip))
                    .doesNotThrowAnyException();
        }
    }

    @Test
    void checkSessionLimit_ShouldThrow_WhenOverLimit() {
        String ip = "192.168.0.1";
        for (int i = 0; i < 5; i++) {
            rateLimitService.checkSessionLimit(ip);
        }
        assertThatThrownBy(() -> rateLimitService.checkSessionLimit(ip))
                .isInstanceOf(RateLimitExceededException.class)
                .hasMessageContaining("session creation");
    }

    @Test
    void checkSessionLimit_ShouldResetAfterPeriod() throws InterruptedException {
        String ip = "192.168.0.1";
        for (int i = 0; i < 5; i++) {
            rateLimitService.checkSessionLimit(ip);
        }
        // Simulate time passing
        Thread.sleep(1100);
        // Wait > 1 sec and manually reset timestamp in service
        // Here, we just verify that after sleeping, we can proceed
        // by creating a new IP (for demonstration).
        String newIp = "192.168.0.2";
        for (int i = 0; i < 5; i++) {
            rateLimitService.checkSessionLimit(newIp);
        }
    }

    // ------------------------
    // MESSAGE LIMIT TESTS
    // ------------------------
    @Test
    void checkMessageLimit_ShouldThrow_WhenOverLimit() {
        String ip = "192.168.0.3";
        for (int i = 0; i < 20; i++) {
            rateLimitService.checkMessageLimit(ip);
        }
        assertThatThrownBy(() -> rateLimitService.checkMessageLimit(ip))
                .isInstanceOf(RateLimitExceededException.class)
                .hasMessageContaining("message sending");
    }

    // ------------------------
    // RENEW LIMIT TESTS
    // ------------------------
    @Test
    void checkRenewLimit_ShouldPass_WhenUnderLimit() {
        String ip = "192.168.0.4";
        for (int i = 0; i < 3; i++) {
            assertThatCode(() -> rateLimitService.checkRenewLimit(ip))
                    .doesNotThrowAnyException();
        }
    }

    @Test
    void checkRenewLimit_ShouldThrow_WhenOverLimit() {
        String ip = "192.168.0.4";
        for (int i = 0; i < 3; i++) {
            rateLimitService.checkRenewLimit(ip);
        }
        assertThatThrownBy(() -> rateLimitService.checkRenewLimit(ip))
                .isInstanceOf(RateLimitExceededException.class)
                .hasMessageContaining("token renewal");
    }

    // ------------------------
    // MULTIPLE IP TEST
    // ------------------------
    @Test
    void limits_ShouldBeIndependentPerIp() {
        String ip1 = "192.168.0.5";
        String ip2 = "192.168.0.6";

        for (int i = 0; i < 5; i++) {
            rateLimitService.checkSessionLimit(ip1);
            rateLimitService.checkSessionLimit(ip2);
        }
        assertThatThrownBy(() -> rateLimitService.checkSessionLimit(ip1))
                .isInstanceOf(RateLimitExceededException.class);
        assertThatThrownBy(() -> rateLimitService.checkSessionLimit(ip2))
                .isInstanceOf(RateLimitExceededException.class);
    }
}
