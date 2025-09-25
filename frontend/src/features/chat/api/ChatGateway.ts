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
    private renewInFlight: Promise<void> | null = null;

    constructor(store: SessionStore, recaptcha: RecaptchaProvider) {
        this.store = store;
        this.recaptcha = recaptcha;
        this.auth = new AuthInterceptor(store);
    }

    // ---------- Session lifecycle ----------
    private async ensureSession(): Promise<void> {
        const sid = this.store.getSessionId();
        const tok = this.store.getToken();
        if (sid && tok) return;

        const captcha = await this.recaptcha.getToken("session");
        const resp = await this.http.json<CreateSessionResponse>("/api/chat/session", {
            method: "POST",
            query: { recaptchaToken: captcha },
        });
        // /session returns both
        this.store.setSessionId(resp.sessionId);
        this.store.setToken(resp.token);
    }

    private async renewOnce(): Promise<void> {
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

    private abortSession(): void {
        this.store.clear();
    }

    // ---------- Public API ----------
    /** Scenario B helper: if both present, download history; otherwise return empty list */
    async tryGetHistory(): Promise<ChatMessage[]> {
        const sid = this.store.getSessionId();
        const tok = this.store.getToken();
        if (!sid || !tok) return [];

        const run = async (): Promise<ChatMessage[]> => {
            const headers = this.auth.attachAuth();
            return this.http.json<ChatMessage[]>("/api/chat/history", { headers });
        };

        try {
            return await run();
        } catch (err) {
            if (this.isTokenError(err)) {
                await this.renewOnce();
                const headers = this.auth.attachAuth();
                return this.http.json<ChatMessage[]>("/api/chat/history", { headers });
            }
            this.abortSession(); // unexpected → abort (temp policy)
            throw err;
        }
    }

    /** Stream chat with one-time in-stream renew+restart on token error */
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
                                await this.renewOnce();
                                if (!userSignal.aborted) void start("retryAfterRenew");
                            } catch (e) {
                                this.abortSession();
                                onError?.(e);
                            }
                            return; // suppress error payload from reaching UI
                        }
                        onChunk(payload);
                    },
                    onError: (err) => {
                        if (renewingInStream && err instanceof DOMException && err.name === "AbortError") return;
                        this.abortSession();
                        onError?.(err);
                    },
                    onClose: () => {
                        if (renewingInStream) return; // restart scheduled
                        onClose?.();
                    },
                });
            } catch (err) {
                // connect-phase token errors:
                if (attempt === "initial" && this.isTokenError(err) && !userSignal.aborted) {
                    try {
                        await this.renewOnce();
                        if (!userSignal.aborted) void start("retryAfterRenew");
                        return;
                    } catch (e) {
                        this.abortSession();
                        onError?.(e);
                        return;
                    }
                }
                // unexpected → abort and bubble
                this.abortSession();
                onError?.(err);
            }
        };

        void start("initial");
        return userAbort;
    }

    // ---------- helpers ----------
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
