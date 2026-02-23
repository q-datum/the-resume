package com.muryshkin.net.backend.security;

import com.muryshkin.net.backend.exception.InvalidTokenException;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;

@Slf4j
@Service
public class JwtTokenService {

    private final Key key;
    private final long expirationMillis;

    @Value("${jwt.clock-skew-seconds:30}")
    private long clockSkewSeconds;

    public JwtTokenService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration}") long expirationMillis) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
        this.expirationMillis = expirationMillis;
    }

    /** Generate a new JWT with a sessionId */
    public String generateToken(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            throw new IllegalArgumentException("SessionId cannot be null or blank");
        }

        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMillis);
        return Jwts.builder()
                .setSubject(sessionId)
                .setId(java.util.UUID.randomUUID().toString())
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    /** Validate and get sessionId from token */
    public String validateAndGetSessionId(String token) {
        Claims claims = parseToken(token, true);
        return claims.getSubject();
    }

    /** Issue a new token with the same sessionId */
    public String renewToken(String oldToken) {
        Claims claims = parseToken(oldToken, false);
        String sessionId = claims.getSubject();
        return generateToken(sessionId);
    }

    /** Parse token and validate signature/expiration with error handling */
    private Claims parseToken(String token, boolean strict) {
        if (token == null || token.isBlank()) {
            throw new InvalidTokenException("JWT token is missing");
        }

        try {
            return Jwts.parserBuilder()
                    .setSigningKey(key)
                    .setAllowedClockSkewSeconds(clockSkewSeconds)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (ExpiredJwtException e) {
            if (!strict) {
                return e.getClaims();
            }
            log.warn("JWT token has expired: {}", e.getMessage());
            throw new InvalidTokenException("JWT token has expired");
        } catch (UnsupportedJwtException e) {
            log.warn("Unsupported JWT token: {}", e.getMessage());
            throw new InvalidTokenException("Unsupported JWT token");
        } catch (MalformedJwtException e) {
            log.warn("Malformed JWT token: {}", e.getMessage());
            throw new InvalidTokenException("Invalid JWT token");
        } catch (io.jsonwebtoken.security.SecurityException e) {
            log.warn("Invalid JWT signature: {}", e.getMessage());
            throw new InvalidTokenException("Invalid JWT signature");
        } catch (JwtException e) {
            log.warn("JWT token validation error: {}", e.getMessage());
            throw new InvalidTokenException("Invalid JWT token");
        }
    }

}
