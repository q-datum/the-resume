export const Env = {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "",
    recaptchaSiteKey: import.meta.env.VITE_RECAPTCHA_SITE_KEY ?? undefined,
} as const;
