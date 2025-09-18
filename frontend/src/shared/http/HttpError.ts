export class HttpError extends Error {
    readonly status: number;
    readonly bodyText: string;

    constructor(status: number, statusText: string, bodyText: string) {
        super(bodyText || `${status} ${statusText}`);
        this.name = "HttpError";
        this.status = status;
        this.bodyText = bodyText;
    }
}
