export interface SessionStore {
    getSessionId(): string | null;
    setSessionId(id: string): void;
    getToken(): string | null;
    setToken(token: string): void;
    clear(): void;
}

export class PersistentSessionStore implements SessionStore {
    private readonly keyId: string;
    private readonly keyJwt: string;
    private memId: string | null = null;
    private memJwt: string | null = null;

    constructor(prefix = "chat") {
        this.keyId = `${prefix}.sessionId`;
        this.keyJwt = `${prefix}.jwt`;
    }

    getSessionId(): string | null {
        const s = this.storage();
        if (!s) return this.memId;
        try { return s.getItem(this.keyId); } catch { return this.memId; }
    }

    setSessionId(id: string): void {
        const s = this.storage();
        if (!s) { this.memId = id; return; }
        try { s.setItem(this.keyId, id); } catch { this.memId = id; }
    }

    getToken(): string | null {
        const s = this.storage();
        if (!s) return this.memJwt;
        try { return s.getItem(this.keyJwt); } catch { return this.memJwt; }
    }

    setToken(token: string): void {
        const s = this.storage();
        if (!s) { this.memJwt = token; return; }
        try { s.setItem(this.keyJwt, token); } catch { this.memJwt = token; }
    }

    clear(): void {
        const s = this.storage();
        if (!s) { this.memId = null; this.memJwt = null; return; }
        try { s.removeItem(this.keyId); s.removeItem(this.keyJwt); }
        finally { this.memId = null; this.memJwt = null; }
    }

    private storage(): Storage | null {
        try { if (typeof window === "undefined") return null; return window.localStorage ?? null; }
        catch { return null; }
    }
}
