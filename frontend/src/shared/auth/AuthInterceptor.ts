import type { SessionStore } from "./SessionStore";

export type HeadersLike = Readonly<Record<string, string>>;

export class AuthInterceptor {
    private readonly store: SessionStore;
    constructor(store: SessionStore) { this.store = store; }

    attachAuth(base?: HeadersLike): HeadersLike {
        const token = this.store.getToken();
        const next: Record<string, string> = base ? { ...base } : {};
        if (token) next.Authorization = `Bearer ${token}`;
        return next;
    }
}
