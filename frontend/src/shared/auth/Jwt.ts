// src/shared/auth/Jwt.ts
/** Minimal base64url decode */
function b64urlDecode(s: string): string {
    const pad = s.length % 4 === 2 ? "==" : s.length % 4 === 3 ? "=" : "";
    const base64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
    if (typeof atob === "function") return atob(base64);
    return Buffer.from(base64, "base64").toString("binary");
}

export interface JwtPayload {
    exp?: number; // seconds since epoch
    iat?: number;
    [k: string]: unknown;
}

export function decodeJwt(token: string): JwtPayload | null {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        const json = b64urlDecode(parts[1]);
        return JSON.parse(json) as JwtPayload;
    } catch {
        return null;
    }
}

/** true if exp is missing or already passed (with optional skewSec) */
export function isExpired(token: string, skewSec = 0): boolean {
    const p = decodeJwt(token);
    if (!p || typeof p.exp !== "number") return true;
    const nowSec = Math.floor(Date.now() / 1000);
    return nowSec + skewSec >= p.exp;
}

/** true if exp is within minTtlSec from now (or missing) */
export function needsRefresh(token: string, minTtlSec = 60): boolean {
    const p = decodeJwt(token);
    if (!p || typeof p.exp !== "number") return true;
    const nowSec = Math.floor(Date.now() / 1000);
    return p.exp - nowSec <= minTtlSec;
}
