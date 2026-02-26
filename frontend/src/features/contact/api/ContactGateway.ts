// src/features/contact/api/ContactGateway.ts
import { HttpClient } from "@/shared/http/HttpClient";
import { HttpError } from "@/shared/http/HttpError";
import type { RecaptchaProvider } from "@/shared/recaptcha/RecaptchaProvider";

export type ContactRequest = {
    name?: string;
    email?: string;
    message?: string;
    recaptchaToken?: string;
};

export type ContactResponse = {
    code: number;
    resultStatus: "SUCCESS" | "ERROR" | string;
    errorMessage?: string | null;
};

export class ContactGateway {
    private readonly http = new HttpClient();
    private readonly recaptcha: RecaptchaProvider;

    constructor(recaptcha: RecaptchaProvider) {
        this.recaptcha = recaptcha;
    }

    async submit(payload: ContactRequest): Promise<ContactResponse> {
        this.validate(payload);

        const captcha = await this.recaptcha.getToken("contact");

        try {
            const resp = await this.http.json<ContactResponse, ContactRequest>("/api/contact", {
                method: "POST",
                body: {
                    name: payload.name?.trim(),
                    email: payload.email?.trim() || undefined,
                    message: payload.message?.trim(),
                    recaptchaToken: captcha,
                },
            });

            // In case backend returns 200 but business error is encoded in payload
            if (!resp || resp.resultStatus !== "SUCCESS") {
                throw new Error(resp?.errorMessage || "Failed to submit contact form.");
            }

            return resp;
        } catch (err) {
            // Normalize backend/network errors to a readable message for UI
            if (err instanceof HttpError) {
                // parseBackendErrorPayload is already used inside HttpClient and attached to HttpError
                const backendMessage =
                    err.status + ': ' + err.bodyText + ' ' + err.payload

                throw new Error(backendMessage || "Failed to submit contact form.");
            }

            if (err instanceof Error) {
                throw err;
            }

            throw new Error("Unexpected error while submitting contact form.");
        }
    }

    private validate(payload: ContactRequest): void {
        if (!payload.name?.trim()) {
            throw new Error("Name is required.");
        }

        if (!payload.message?.trim()) {
            throw new Error("Message is required.");
        }

        if (payload.name.trim().length > 100) {
            throw new Error("Name is too long.");
        }

        if (payload.message.trim().length > 5000) {
            throw new Error("Message is too long.");
        }

        if (payload.email?.trim()) {
            const email = payload.email.trim();

            if (email.length > 255) {
                throw new Error("Email is too long.");
            }

            const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            if (!emailOk) {
                throw new Error("Email format is invalid.");
            }
        }
    }
}