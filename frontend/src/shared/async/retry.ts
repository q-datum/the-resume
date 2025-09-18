// src/shared/async/retry.ts
export interface BackoffOptions {
    retries: number;    // number of retries (not counting the first attempt)
    baseMs: number;     // initial backoff in ms
    capMs: number;      // max backoff per attempt
    jitter?: boolean;   // full jitter
}

export function computeBackoffMs(attemptIndex: number, opts: BackoffOptions): number {
    const expo = Math.min(opts.capMs, opts.baseMs * 2 ** attemptIndex);
    return opts.jitter ? Math.floor(Math.random() * expo) : expo;
}

function delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
}

/** Generic promise retry with backoff and a shouldRetry guard */
export async function retryPromise<T>(
    op: () => Promise<T>,
    opts: BackoffOptions,
    shouldRetry: (err: unknown) => boolean
): Promise<T> {
    let attempt = 0;
    // first try + up to opts.retries more
    while (true) {
        try {
            return await op();
        } catch (err) {
            if (attempt >= opts.retries || !shouldRetry(err)) throw err;
            const wait = computeBackoffMs(attempt, opts);
            await delay(wait);
            attempt += 1;
        }
    }
}
