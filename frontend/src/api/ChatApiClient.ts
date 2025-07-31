import axios, { AxiosInstance } from 'axios';
import { ChatMessage } from './apiTypes';
import tokenStorage from '../utils/tokenStorage';

export class ChatApiClient {
    private http: AxiosInstance;

    constructor(baseURL: string) {
        this.http = axios.create({ baseURL });
    }

    async createSession(recaptchaToken: string): Promise<{ sessionId: string; token: string }> {
        const res = await this.http.post('/session', null, {
            params: { recaptchaToken },
        });
        return res.data;
    }

    async renewToken(recaptchaToken: string): Promise<{ token: string }> {
        const res = await this.http.post('/renew', null, {
            headers: this.getAuthHeaders(),
            params: { recaptchaToken },
        });
        return res.data;
    }

    async getChatHistory(): Promise<ChatMessage[]> {
        const res = await this.http.get('/history', {
            headers: this.getAuthHeaders(),
        });
        return res.data;
    }

    streamChat(message: string): EventSource {
        const token = tokenStorage.getToken();
        if (!token) throw new Error('No auth token');

        const url = new URL(`${this.http.defaults.baseURL}/stream`);
        url.searchParams.append('message', message);

        return new EventSource(url.toString(), {
            withCredentials: false,
        });
    }

    private getAuthHeaders() {
        const token = tokenStorage.getToken();
        if (!token) throw new Error('No auth token');
        return { Authorization: `Bearer ${token}` };
    }
}
