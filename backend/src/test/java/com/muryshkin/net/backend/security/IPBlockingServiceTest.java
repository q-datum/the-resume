package com.muryshkin.net.backend.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

class IPBlockingServiceTest {

    private IPBlockingService ipBlockingService;

    @BeforeEach
    void setUp() {
        ipBlockingService = new IPBlockingService();
    }

    // ---------------------
    // BASIC ATTEMPTS TESTS
    // ---------------------
    @Test
    void recordFailedAttempt_ShouldNotBlock_WhenBelowThreshold() {
        String ip = "192.168.1.1";
        for (int i = 0; i < 9; i++) {
            ipBlockingService.recordFailedAttempt(ip);
            assertThat(ipBlockingService.isBlocked(ip))
                    .as("IP should not be blocked after " + (i + 1) + " attempts")
                    .isFalse();
        }
    }

    @Test
    void recordFailedAttempt_ShouldBlock_WhenThresholdReached() {
        String ip = "192.168.1.2";
        for (int i = 0; i < 10; i++) {
            ipBlockingService.recordFailedAttempt(ip);
        }
        assertThat(ipBlockingService.isBlocked(ip))
                .as("IP should be blocked after 10 attempts")
                .isTrue();
    }

    @Test
    void recordFailedAttempt_ShouldStayBlocked_WhenExceedingMaxAttempts() {
        String ip = "192.168.1.5";
        for (int i = 0; i < 20; i++) {
            ipBlockingService.recordFailedAttempt(ip);
        }
        assertThat(ipBlockingService.isBlocked(ip))
                .as("IP should remain blocked even after exceeding attempts")
                .isTrue();
    }

    // ---------------------
    // MULTIPLE IP TESTS
    // ---------------------
    @Test
    void attempts_ShouldBeTrackedIndependentlyPerIp() {
        String ip1 = "192.168.1.3";
        String ip2 = "192.168.1.4";

        for (int i = 0; i < 9; i++) {
            ipBlockingService.recordFailedAttempt(ip1);
        }
        for (int i = 0; i < 10; i++) {
            ipBlockingService.recordFailedAttempt(ip2);
        }

        assertThat(ipBlockingService.isBlocked(ip1)).isFalse();
        assertThat(ipBlockingService.isBlocked(ip2)).isTrue();
    }

    // ---------------------
    // FRESH IP TEST
    // ---------------------
    @Test
    void isBlocked_ShouldReturnFalse_ForFreshIp() {
        assertThat(ipBlockingService.isBlocked("new.ip"))
                .as("A fresh IP with no attempts should not be blocked")
                .isFalse();
    }

    // ---------------------
    // EDGE CASES
    // ---------------------
    @Test
    void recordFailedAttempt_WithNullIp_ShouldNotThrowButShouldNotBlock() {
        assertThatCode(() -> ipBlockingService.recordFailedAttempt(null))
                .as("Null IP should not cause a crash")
                .doesNotThrowAnyException();
        // Null IP tracking is not possible, but calling isBlocked(null) should return false
        assertThat(ipBlockingService.isBlocked(null)).isFalse();
    }

    @Test
    void recordFailedAttempt_WithNullIp_ShouldNotThrowAndNotBlock() {
        assertThatCode(() -> ipBlockingService.recordFailedAttempt(null))
                .as("Null IP should not cause a crash")
                .doesNotThrowAnyException();

        // Ensure null IP is not considered blocked
        assertThat(ipBlockingService.isBlocked(null))
                .as("Null IP should never be blocked")
                .isFalse();
    }

    @Test
    void recordFailedAttempt_WithBlankIp_ShouldNotThrowAndNotBlock() {
        assertThatCode(() -> ipBlockingService.recordFailedAttempt(" "))
                .as("Blank IP should not cause a crash")
                .doesNotThrowAnyException();

        // Ensure blank IP is not considered blocked
        assertThat(ipBlockingService.isBlocked(" "))
                .as("Blank IP should never be blocked")
                .isFalse();
    }

    @Test
    void recordFailedAttempt_WithEmptyIp_ShouldNotThrowButShouldNotBlock() {
        assertThatCode(() -> ipBlockingService.recordFailedAttempt(""))
                .as("Empty IP should not cause a crash")
                .doesNotThrowAnyException();
        assertThat(ipBlockingService.isBlocked("")).isFalse();
    }

    @Test
    void recordFailedAttempt_ShouldHandleManyAttempts() {
        String ip = "192.168.100.1";
        for (int i = 0; i < 1000; i++) {
            ipBlockingService.recordFailedAttempt(ip);
        }
        assertThat(ipBlockingService.isBlocked(ip))
                .as("After many attempts, IP must remain blocked")
                .isTrue();
    }

    @Test
    void isBlocked_ShouldReturnTrue_IfCalledAfterBlocking() {
        String ip = "192.168.1.10";
        for (int i = 0; i < 10; i++) {
            ipBlockingService.recordFailedAttempt(ip);
        }
        assertThat(ipBlockingService.isBlocked(ip)).isTrue();

        // Additional attempts should not change state
        ipBlockingService.recordFailedAttempt(ip);
        assertThat(ipBlockingService.isBlocked(ip)).isTrue();
    }

    @Test
    void differentIps_ShouldNotAffectEachOther_WhenBlocked() {
        String blockedIp = "192.168.1.50";
        String safeIp = "192.168.1.51";

        for (int i = 0; i < 10; i++) {
            ipBlockingService.recordFailedAttempt(blockedIp);
        }

        assertThat(ipBlockingService.isBlocked(blockedIp)).isTrue();
        assertThat(ipBlockingService.isBlocked(safeIp)).isFalse();
    }
}
