export interface TokenStore {
    getToken(): string | null;
    setToken(token: string): void;
    clear(): void;
}

/**
 * Persistent token store using localStorage when available.
 * Falls back to in-memory storage (e.g. SSR, disabled storage).
 */
export class PersistentTokenStore implements TokenStore {
    private readonly key: string;
    private memoryValue: string | null = null;

    constructor(key = "chat.jwt") {
        this.key = key;
    }

    getToken(): string | null {
        const storage = this.getStorage();
        if (!storage) return this.memoryValue;
        try {
            return storage.getItem(this.key);
        } catch {
            return this.memoryValue;
        }
    }

    setToken(token: string): void {
        const storage = this.getStorage();
        if (!storage) {
            this.memoryValue = token;
            return;
        }
        try {
            storage.setItem(this.key, token);
        } catch {
            this.memoryValue = token;
        }
    }

    clear(): void {
        const storage = this.getStorage();
        if (!storage) {
            this.memoryValue = null;
            return;
        }
        try {
            storage.removeItem(this.key);
        } catch {
            this.memoryValue = null;
        }
    }

    private getStorage(): Storage | null {
        try {
            if (typeof window === "undefined") return null;
            return window.localStorage ?? null;
        } catch {
            return null;
        }
    }
}
