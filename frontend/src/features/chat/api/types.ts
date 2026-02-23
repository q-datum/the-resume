export interface ChatMessage {
    id: string;
    sessionId: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: string; // ISO-8601
}

export interface CreateSessionResponse {
    sessionId: string;
    token: string;
}

export interface RenewTokenResponse {
    token: string;
}
