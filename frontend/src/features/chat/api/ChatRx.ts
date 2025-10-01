import { Observable, defer, retry, timer } from "rxjs";
import type { ChatGateway } from "./ChatGateway";

export interface ConnectRetryOptions {
    count: number;      // how many reconnect attempts (only if the stream fails BEFORE first chunk)
    baseMs: number;
    capMs: number;
    jitter?: boolean;
}

interface BackoffOptions {
    retries: number;    // number of retries (not counting the first attempt)
    baseMs: number;     // initial backoff in ms
    capMs: number;      // max backoff per attempt
    jitter?: boolean;   // full jitter
}

function computeBackoffMs(attemptIndex: number, opts: BackoffOptions): number {
    const expo = Math.min(opts.capMs, opts.baseMs * 2 ** attemptIndex);
    return opts.jitter ? Math.floor(Math.random() * expo) : expo;
}

/**
 * Emits text chunks as they arrive. If `connectRetry` is provided, it will
 * retry ONLY if the connection fails before the first chunk is seen.
 */
export function streamChat$(
    api: ChatGateway,
    message: string,
    connectRetry?: ConnectRetryOptions
): Observable<string> {
    const source = defer(() => new Observable<string>((subscriber) => {
        let firstChunkSeen = false;

        const ctrl = api.streamChat({
            message,
            onChunk: (t) => {
                firstChunkSeen = true;
                subscriber.next(t);
            },
            onError: (e) => {
                // Tag early-connect failures so the retry operator knows these are safe to reconnect.
                if (!firstChunkSeen) {
                    const err = e instanceof Error ? e : new Error(String(e));
                    (err as unknown as { __connectPhase?: true }).__connectPhase = true;
                    subscriber.error(err);
                } else {
                    subscriber.error(e);
                }
            },
            onClose: () => subscriber.complete(),
        });

        return () => ctrl.abort();
    }));

    if (!connectRetry) return source;

    // Retry with backoff ONLY for connect-phase errors
    return source.pipe(
        retry({
            count: connectRetry.count,
            delay: (_err, retryIndex) => {
                // if the error wasn't a connect-phase error, don't retry
                const err = _err as unknown as { __connectPhase?: boolean };
                if (!err.__connectPhase) throw _err;
                const ms = computeBackoffMs(retryIndex, {
                    baseMs: connectRetry.baseMs,
                    capMs: connectRetry.capMs,
                    retries: connectRetry.count,
                    jitter: connectRetry.jitter,
                });
                return timer(ms);
            },
        })
    );
}
