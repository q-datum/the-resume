import { Env } from "@/app/config/env";
import type { HeadersLike } from "@/shared/auth/AuthInterceptor";
import { HttpError } from "@/shared/http/HttpError";
import { parseBackendErrorPayload } from "@/shared/http/BackendError";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export interface RequestOptions<TBody = unknown> {
    method?: HttpMethod;
    headers?: HeadersLike;
    query?: Readonly<Record<string, string | number | boolean | undefined>>;
    body?: TBody;
    signal?: AbortSignal;
}

function isAbsoluteUrl(u: string): boolean { return /^https?:\/\//i.test(u); }
function browserOrigin(): string {
    if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
    return "http://localhost";
}

export class HttpClient {
    private readonly baseUrl: string;
    constructor(baseUrl = Env.apiBaseUrl) { this.baseUrl = baseUrl; }

    async json<TResp, TBody = unknown>(path: string, opts: RequestOptions<TBody> = {}): Promise<TResp> {
        const url = this.buildUrl(path, opts.query);
        const headers = this.mergeHeaders({ "Content-Type": "application/json" }, opts.headers);
        const res = await fetch(url, { method: opts.method ?? "GET", headers, body: opts.body != null ? JSON.stringify(opts.body) : undefined, signal: opts.signal });
        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new HttpError(res.status, res.statusText, text, parseBackendErrorPayload(text));
        }
        return (await res.json()) as TResp;
    }

    async stream(path: string, opts: RequestOptions = {}): Promise<Response> {
        const url = this.buildUrl(path, opts.query);
        const res = await fetch(url, { method: opts.method ?? "GET", headers: opts.headers, signal: opts.signal });
        if (!res.ok || !res.body) {
            const text = await res.text().catch(() => "");
            throw new HttpError(res.status, res.statusText, text, parseBackendErrorPayload(text));
        }
        return res;
    }

    private buildUrl(path: string, query?: RequestOptions["query"]): string {
        const base = this.normalizeBase(this.baseUrl);
        const u = new URL(path, base);
        if (query) for (const [k, v] of Object.entries(query)) if (v !== undefined) u.searchParams.set(k, String(v));
        return u.toString();
    }
    private normalizeBase(base: string): string {
        const b = (base ?? "").trim();
        if (!b || b === "/" || b.startsWith("./") || b.startsWith("../")) return browserOrigin();
        return isAbsoluteUrl(b) ? b : new URL(b, browserOrigin()).toString();
    }
    private mergeHeaders(a: HeadersLike, b?: HeadersLike): HeadersLike { return b ? { ...a, ...b } : a; }
}
