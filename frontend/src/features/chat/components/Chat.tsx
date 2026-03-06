import { Bleed, Box, Container } from "@chakra-ui/react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { streamChat$ } from "@/features/chat/api/ChatRx";
import { chatApi } from "@/app/wiring/chat";
import { type Message, MessagesView } from "@/features/chat/components/MessagesView.tsx";
import { ChatControls } from "@/features/chat/components/ChatControls.tsx";
import { ChatUserInput } from "@/features/chat/components/ChatUserInput.tsx";
import { devLog } from "@/shared/utils/devUtils.ts";

export const Chat = () => {
    const [messages, setMessages] = useState<Message[]>([
        { id: "1", role: "user", content: "Hello, who are you?", timestamp: new Date().toISOString() },
        { id: "2", role: "assistant", content: "Hello! I'm the portfolio assistant for Alexander Muryshkin. I'm here to provide you with information about Alexander's education, experience, projects, and skills. How can I help you today?", timestamp: new Date().toISOString() },
    ]);
    const [input, setInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const loadedHistoryRef = React.useRef(false);
    const subRef = useRef<ReturnType<typeof streamChat$>["subscribe"] | null>(null);
    const idRef = useRef(1000);

    useEffect(() => {
        return () => {
            if (subRef.current) {
                // @ts-expect-error rxjs subscription at runtime
                subRef.current.unsubscribe();
                subRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (loadedHistoryRef.current) return;
        loadedHistoryRef.current = true;
        setIsHistoryLoading(true);

        (async () => {
            try {
                const history = await chatApi.tryGetHistory();
                if (history.length) {
                    setMessages((prev) => [
                        ...prev,
                        ...history.map((m) => ({
                            id: m.id,
                            role: m.role,
                            content: m.content,
                            timestamp: m.timestamp,
                        })),
                    ]);
                }
            } catch (e) {
                console.error("[history] load failed:", e);
            } finally {
                setIsHistoryLoading(false);
            }
        })();
    }, []);

    const nextId = () => String(++idRef.current);

    const handleSend = useCallback(() => {
        const content = input.trim();
        if (!content) return;

        if (subRef.current) {
            // @ts-expect-error rxjs subscription at runtime
            subRef.current.unsubscribe();
            subRef.current = null;
        }

        const now = new Date().toISOString();
        const userId = nextId();
        const assistantId = nextId();

        setMessages((prev) => [
            ...prev,
            { id: userId, role: "user", content, timestamp: now },
            { id: assistantId, role: "assistant", content: "", timestamp: now },
        ]);

        setInput("");
        devLog("[chat] stream start:", content);
        setIsStreaming(true);

        const obs = streamChat$(chatApi, content, {
            count: 3,
            baseMs: 300,
            capMs: 2500,
            jitter: true,
        });

        // @ts-expect-error rxjs subscription at runtime
        subRef.current = obs.subscribe({
            next: (chunk) => {
                devLog("[chat] chunk:", JSON.stringify(chunk));
                setMessages((prev) =>
                    prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m))
                );
            },
            error: (err) => {
                console.error("[chat] stream error:", err);
                setIsStreaming(false);
            },
            complete: () => {
                devLog("[chat] stream complete");
                setIsStreaming(false);
            },
        });
    }, [input]);

    const handleClear = useCallback(() => {
        if (subRef.current) {
            // @ts-expect-error rxjs subscription at runtime
            subRef.current.unsubscribe();
            subRef.current = null;
        }

        chatApi.abortSession();
        location.reload();
    }, []);

    return (
        <Container>
            <ChatUserInput
                value={input}
                onChange={setInput}
                onSubmit={handleSend}
                isStreaming={isStreaming}
                isHistoryLoading={isHistoryLoading}
            />

            <Box>
                <MessagesView messages={messages} />
            </Box>

            <ChatControls onClear={handleClear} isHistoryLoading={isHistoryLoading}/>
            <Bleed height={{ base: "20vh", md: "18vh" }} />
        </Container>
    );
};