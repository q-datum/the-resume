package com.muryshkin.net.backend.common;

import org.springframework.http.server.reactive.ServerHttpRequest;

public final class IpUtil {
    private IpUtil() {}

    public static String clientIp(ServerHttpRequest request) {
        var xff = request.getHeaders().getFirst("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            var first = xff.split(",")[0].trim();
            if (!first.isEmpty()) return first;
        }
        var xri = request.getHeaders().getFirst("X-Real-IP");
        if (xri != null && !xri.isBlank()) return xri.trim();

        var remote = request.getRemoteAddress();
        return remote != null ? remote.getAddress().getHostAddress() : "unknown";
    }
}