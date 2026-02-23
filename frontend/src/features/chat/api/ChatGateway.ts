import { HttpClient } from "@/shared/http/HttpClient";
import { AuthInterceptor } from "@/shared/auth/AuthInterceptor";
import { StreamReader } from "@/shared/http/StreamReader";
import { HttpError } from "@/shared/http/HttpError";
import { parseBackendErrorPayload, isTokenErrorPayload } from "@/shared/http/BackendError";

import type { SessionStore } from "@/shared/auth/SessionStore";
import type { RecaptchaProvider } from "@/shared/recaptcha/RecaptchaProvider";
import type { ChatMessage, CreateSessionResponse, RenewTokenResponse } from "./types";

export class ChatGateway {
    private readonly http = new HttpClient();
    private readonly streams = new StreamReader();
    private readonly store: SessionStore;
    private readonly recaptcha: RecaptchaProvider;
    private readonly auth: AuthInterceptor;

    // single-flight guards
    private renewInFlight: Promise<void> | null = null;
    private sessionInFlight: Promise<void> | null = null;

    constructor(store: SessionStore, recaptcha: RecaptchaProvider) {
        this.store = store;
        this.recaptcha = recaptcha;
        this.auth = new AuthInterceptor(store);
    }

    // -------- Session lifecycle --------

    /** Scenario A helper: create a brand-new session (single-flight). */
    private async createSessionNow(): Promise<void> {
        if (this.sessionInFlight) return this.sessionInFlight;

        const run = async (): Promise<void> => {
            const captcha = await this.recaptcha.getToken("session");
            const resp = await this.http.json<CreateSessionResponse>("/api/chat/session", {
                method: "POST",
                query: { recaptchaToken: captcha },
            });
            this.store.setSessionId(resp.sessionId);
            this.store.setToken(resp.token);
        };

        this.sessionInFlight = (async () => {
            try {
                await run();
            } catch (err) {
                if (this.isTokenError(err)) {
                    await this.renewTokenOnce();
                    await run();
                } else {
                    // unexpected → follow your temporary policy
                    console.error("[chat] unexpected error", err);
                    //this.abortSession();
                    throw err;
                }
            }
        })();

        try { await this.sessionInFlight; } finally { this.sessionInFlight = null; }
    }

    /** Ensure we have {sessionId, token}; if missing, create session once. */
    private async ensureSession(): Promise<void> {
        const sid = this.store.getSessionId();
        const tok = this.store.getToken();
        if (sid && tok) return;
        await this.createSessionNow();
    }

    /** Explicit renew (single-flight wrapper below). */
    private async renewTokenOnce(): Promise<void> {
        if (this.renewInFlight) return this.renewInFlight;
        this.renewInFlight = (async () => {
            const captcha = await this.recaptcha.getToken("renew");
            const headers = this.auth.attachAuth();
            const resp = await this.http.json<RenewTokenResponse>("/api/chat/renew", {
                method: "POST",
                headers,
                query: { recaptchaToken: captcha },
            });
            this.store.setToken(resp.token);
        })();
        try { await this.renewInFlight; } finally { this.renewInFlight = null; }
    }

    /** Temporary policy: clear local session on unexpected errors. */
    public abortSession(): void {
        this.store.clear();
    }

    // -------- Public API --------

    async tryGetHistory(): Promise<ChatMessage[]> {
        const sid = this.store.getSessionId();
        const tok = this.store.getToken();
        if (!sid || !tok) return []; // scenario A: nothing to load yet

        const fetchHistory = async (): Promise<ChatMessage[]> => {
            const headers = this.auth.attachAuth();
            return this.http.json<ChatMessage[]>("/api/chat/history", { headers });
        };

        try {
            return await fetchHistory();
        } catch (err) {
            // New rule: if /history says token is bad/expired → /renew → retry /history once.
            if (this.isTokenError(err)) {
                try {
                    await this.renewTokenOnce(); // single-flight guarded
                } catch (renewErr) {
                    // Per your request: JUST LOG the /renew failure, keep storage intact, and don't throw.
                    // Returning empty history lets the UI continue; streaming will attempt its own renew later.
                    console.error("[chat] /renew failed after /history 401:", renewErr);
                    return [];
                }
                // Retry history once after a successful renew.
                return fetchHistory();
            }

            // Unexpected error: keep storage, log, and bubble up.
            console.error("[chat] /history unexpected error:", err);
            throw err;
        }
    }

    /**
     * Stream with token handling:
     * - Ensure session exists.
     * - On connect 401 or in-stream token error → /renew ONCE → restart once.
     * - Any other error → abort session + throw via onError.
     */
    streamChat(args: {
        message: string;
        onChunk: (text: string) => void;
        onError?: (err: unknown) => void;
        onClose?: () => void;
        signal?: AbortSignal;
    }): AbortController {
        const { message, onChunk, onError, onClose, signal } = args;

        const userAbort = new AbortController();
        const userSignal = this.mergeSignals(userAbort.signal, signal);

        const start = async (attempt: "initial" | "retryAfterRenew"): Promise<void> => {
            const attemptAbort = new AbortController();
            const merged = this.mergeSignals(attemptAbort.signal, userSignal);
            let renewingInStream = false;

            try {
                await this.ensureSession();

                const headers = this.auth.attachAuth({ Accept: "text/event-stream" });
                const res = await this.http.stream("/api/chat/stream", {
                    method: "GET",
                    headers,
                    query: { message },
                    signal: merged,
                });

                await this.streams.readSSE(res, {
                    onChunk: async (payload) => {
                        const p = parseBackendErrorPayload(payload);
                        if (attempt === "initial" && isTokenErrorPayload(p)) {
                            renewingInStream = true;
                            attemptAbort.abort();
                            try {
                                await this.renewTokenOnce();
                                if (!userSignal.aborted) void start("retryAfterRenew");
                            } catch (e) {
                                //this.abortSession();
                                console.error("[chat] unexpected error", e);
                                onError?.(e);
                            }
                            return;
                        }
                        onChunk(payload);
                    },
                    onError: (err) => {
                        if (renewingInStream && err instanceof DOMException && err.name === "AbortError") return;
                        //this.abortSession();
                        console.error("[chat] unexpected error", err);
                        onError?.(err);
                    },
                    onClose: () => {
                        if (renewingInStream) return;
                        onClose?.();
                    },
                });
            } catch (err) {
                // Connect-phase token error → /renew once → restart once
                if (attempt === "initial" && this.isTokenError(err) && !userSignal.aborted) {
                    try {
                        await this.renewTokenOnce();
                        if (!userSignal.aborted) void start("retryAfterRenew");
                        return;
                    } catch (e) {
                        console.error("[chat] unexpected error", err);
                        //this.abortSession();
                        onError?.(e);
                        return;
                    }
                }
                console.error("[chat] unexpected error", err);
                //this.abortSession();
                onError?.(err);
            }
        };

        void start("initial");
        return userAbort;
    }

    // -------- helpers --------
    private isTokenError(err: unknown): boolean {
        if (err instanceof HttpError) {
            if (err.status === 401) return true;
            return isTokenErrorPayload(err.payload);
        }
        return false;
    }

    private mergeSignals(a: AbortSignal, b?: AbortSignal): AbortSignal {
        if (!b || a === b) return a;
        const merged = new AbortController();
        const abort = (): void => merged.abort();
        if (a.aborted || b.aborted) { merged.abort(); return merged.signal; }
        a.addEventListener("abort", abort);
        b.addEventListener("abort", abort);
        return merged.signal;
    }
}
