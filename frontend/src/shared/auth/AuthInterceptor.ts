import type { TokenStore } from "./TokenStore";

export type HeadersLike = Readonly<Record<string, string>>;

export interface AuthInterceptorOptions {
    /** Called when no token is present; should obtain & persist a new JWT. */
    onDemandToken?: () => Promise<string>;
}

export class AuthInterceptor {
    private readonly store: TokenStore;
    private readonly onDemandToken?: () => Promise<string>;

    constructor(tokenStore: TokenStore, opts?: AuthInterceptorOptions) {
        this.store = tokenStore;
        this.onDemandToken = opts?.onDemandToken;
    }

    /** Sync: attach Authorization *if* a token already exists. */
    attachAuth(base?: HeadersLike): HeadersLike {
        const token = this.store.getToken();
        const next: Record<string, string> = base ? { ...base } : {};
        if (token) next.Authorization = `Bearer ${token}`;
        return next;
    }

    /**
     * Async: if no token exists, tries to obtain one (onDemandToken),
     * then attaches Authorization.
     */
    async attachAuthAsync(base?: HeadersLike): Promise<HeadersLike> {
        let token = this.store.getToken();
        if (!token && this.onDemandToken) {
            token = await this.onDemandToken();
        }
        const next: Record<string, string> = base ? { ...base } : {};
        if (token) next.Authorization = `Bearer ${token}`;
        return next;
    }
}
