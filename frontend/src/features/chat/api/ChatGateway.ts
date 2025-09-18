import { HttpClient } from "@/shared/http/HttpClient";
import { AuthInterceptor } from "@/shared/auth/AuthInterceptor";
import { StreamReader } from "@/shared/http/StreamReader";
import { HttpError } from "@/shared/http/HttpError";
import { retryPromise } from "@/shared/async/retry";

import type { TokenStore } from "@/shared/auth/TokenStore";
import type { RecaptchaProvider } from "@/shared/recaptcha/RecaptchaProvider";
import type { ChatMessage, CreateSessionResponse, RenewTokenResponse } from "./types";

export class ChatGateway {
    private readonly http: HttpClient;
    private readonly auth: AuthInterceptor;
    private readonly streams: StreamReader;
    private readonly tokenStore: TokenStore;
    private readonly recaptcha: RecaptchaProvider;

    private static readonly RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);
    private static readonly DEFAULT_BACKOFF = { retries: 3, baseMs: 300, capMs: 2500, jitter: true } as const;
    // private static readonly LIGHT_BACKOFF    = { retries: 2, baseMs: 300, capMs: 1500, jitter: true } as const;

    constructor(tokenStore: TokenStore, recaptcha: RecaptchaProvider) {
        this.http = new HttpClient();
        this.streams = new StreamReader();
        this.tokenStore = tokenStore;
        this.recaptcha = recaptcha;

        // 👇 Auth now knows how to mint a token if none exists
        this.auth = new AuthInterceptor(tokenStore, {
            onDemandToken: async () => {
                const captcha = await this.recaptcha.getToken("session");
                const resp = await this.http.json<CreateSessionResponse>("/api/chat/session", {
                    method: "POST",
                    query: { recaptchaToken: captcha },
                });
                this.tokenStore.setToken(resp.token);
                return resp.token;
            },
        });
    }

    /** Still available if you ever want to call it explicitly */
    async createSession(recaptchaToken: string): Promise<CreateSessionResponse> {
        const resp = await this.http.json<CreateSessionResponse>("/api/chat/session", {
            method: "POST",
            query: { recaptchaToken },
        });
        this.tokenStore.setToken(resp.token);
        return resp;
    }

    async renewToken(recaptchaToken: string): Promise<RenewTokenResponse> {
        // Token exists (maybe expired); attach sync is enough
        const headers = this.auth.attachAuth();
        const resp = await this.http.json<RenewTokenResponse>("/api/chat/renew", {
            method: "POST",
            headers,
            query: { recaptchaToken },
        });
        this.tokenStore.setToken(resp.token);
        return resp;
    }

    async getHistory(): Promise<ChatMessage[]> {
        return this.withBackoffAutoRenew(async () => {
            const headers = await this.auth.attachAuthAsync();
            return this.http.json<ChatMessage[]>("/api/chat/history", { headers });
        });
    }

    /**
     * Streams chat. If no token exists, it will auto-create a session first.
     * Still does a single 401-driven auto-renew if needed.
     */
    streamChat(args: {
        message: string;
        onChunk: (text: string) => void;
        onError?: (err: unknown) => void;
        onClose?: () => void;
        signal?: AbortSignal;
    }): AbortController {
        const { message, onChunk, onError, onClose, signal } = args;

        const controller = new AbortController();
        const mergedSignal = this.mergeSignals(controller.signal, signal);

        const start = async (attempt: "initial" | "retryAfterRenew"): Promise<void> => {
            try {
                const headers = await this.auth.attachAuthAsync({ Accept: "text/event-stream" });

                const res = await this.http.stream("/api/chat/stream", {
                    method: "GET",
                    headers,
                    query: { message },
                    signal: mergedSignal,
                });

                await this.streams.readSSE(res, { onChunk, onError, onClose });
            } catch (err) {
                if (
                    attempt === "initial" &&
                    err instanceof HttpError &&
                    err.status === 401 &&
                    !mergedSignal.aborted
                ) {
                    try {
                        const captcha = await this.recaptcha.getToken("renew");
                        await this.renewToken(captcha);
                        if (!mergedSignal.aborted) void start("retryAfterRenew");
                        return;
                    } catch (renewErr) {
                        onError?.(renewErr);
                        return;
                    }
                }
                onError?.(err);
            }
        };

        void start("initial");
        return controller;
    }

    private async withBackoffAutoRenew<T>(op: () => Promise<T>): Promise<T> {
        return retryPromise(
            async () => this.withAutoRenew(op),
            ChatGateway.DEFAULT_BACKOFF,
            (err) => this.isRetryableTransient(err)
        );
    }

    private async withAutoRenew<T>(op: () => Promise<T>): Promise<T> {
        try {
            // Ensure we have a token *before* the op
            await this.auth.attachAuthAsync();
            return await op();
        } catch (err) {
            if (err instanceof HttpError && err.status === 401) {
                const captcha = await this.recaptcha.getToken("renew");
                await this.renewToken(captcha);
                return op();
            }
            throw err;
        }
    }

    private isRetryableTransient(err: unknown): boolean {
        if (err instanceof DOMException && err.name === "AbortError") return false;
        if (err instanceof TypeError) return true;
        if (err instanceof HttpError) {
            if (err.status === 401) return false;
            return ChatGateway.RETRYABLE_STATUSES.has(err.status);
        }
        return false;
    }

    private mergeSignals(a: AbortSignal, b?: AbortSignal): AbortSignal {
        if (!b || a === b) return a;
        const merged = new AbortController();
        const abort = (): void => merged.abort();
        if (a.aborted || b.aborted) {
            merged.abort();
            return merged.signal;
        }
        a.addEventListener("abort", abort);
        b.addEventListener("abort", abort);
        return merged.signal;
    }
}
