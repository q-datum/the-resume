import type { BackendErrorPayload } from "./BackendError";

export class HttpError extends Error {
    readonly status: number;
    readonly bodyText: string;
    readonly payload: BackendErrorPayload | null;

    constructor(status: number, statusText: string, bodyText: string, payload: BackendErrorPayload | null) {
        super(bodyText || `${status} ${statusText}`);
        this.name = "HttpError";
        this.status = status;
        this.bodyText = bodyText;
        this.payload = payload;
    }
}
