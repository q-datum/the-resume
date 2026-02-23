import { load } from "recaptcha-v3";

type Execable = { execute: (action: string) => Promise<string> };

export class RecaptchaError extends Error { constructor(msg: string) { super(msg); this.name = "RecaptchaError"; } }

export interface RecaptchaProvider {
    /** Obtain a fresh reCAPTCHA token for a given action (e.g., "renew"). */
    getToken(action: string): Promise<string>;
}

export interface GoogleRecaptchaV3Options {
    autoHideBadge?: boolean;
    useEnterprise?: boolean;
}

/**
 * Programmatic loader for reCAPTCHA v3 using the `recaptcha-v3` NPM package.
 */
export class GoogleRecaptchaV3Provider implements RecaptchaProvider {
    private instancePromise: Promise<Execable> | null = null;
    private readonly siteKey: string;
    private readonly opts: GoogleRecaptchaV3Options;

    constructor(siteKey: string, opts?: GoogleRecaptchaV3Options) {
        this.siteKey = siteKey;
        this.opts = opts ?? {};
    }

    async getToken(action: string): Promise<string> {
        const inst = await this.ensureInstance();
        try {
            return await inst.execute(action);
        } catch (e) {
            console.error("[recaptcha] getToken failed:", e);
            throw new RecaptchaError("reCAPTCHA token acquisition failed");
        }
    }

    private ensureInstance(): Promise<Execable> {
        if (this.instancePromise) return this.instancePromise;

        // Only load in the browser
        if (typeof window === "undefined") {
            this.instancePromise = Promise.reject(new Error("reCAPTCHA cannot load on the server"));
            return this.instancePromise;
        }

        this.instancePromise = load(this.siteKey, {
            autoHideBadge: this.opts.autoHideBadge ?? true,
            useEnterprise: this.opts.useEnterprise ?? false,
        }) as unknown as Promise<Execable>;

        return this.instancePromise;
    }
}
