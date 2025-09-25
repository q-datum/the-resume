export interface BackendErrorPayload {
    error?: string;
    message?: string;
    status?: number;
    timestamp?: string;
}

export function parseBackendErrorPayload(s: string): BackendErrorPayload | null {
    try {
        const o = JSON.parse(s) as unknown;
        return o && typeof o === "object" ? (o as BackendErrorPayload) : null;
    } catch { return null; }
}

export function isTokenErrorPayload(p: BackendErrorPayload | null): boolean {
    if (!p) return false;
    if (p.status === 401) return true;
    const msg = (p.message ?? "").toLowerCase();
    const err = (p.error ?? "").toLowerCase();
    return err.includes("invalid token") || err.includes("unauthorized") ||
        (msg.includes("jwt") && (msg.includes("expired") || msg.includes("invalid")));
}
