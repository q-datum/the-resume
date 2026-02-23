export interface RecaptchaProvider {
    /** Obtain a fresh reCAPTCHA token for a given action (e.g., "renew"). */
    getToken(action: string): Promise<string>;
}
