import {Bleed, Box, Button, Center, Clipboard, Flex, IconButton, Link, Text, Textarea} from "@chakra-ui/react";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {IoSend} from "react-icons/io5";
import {streamChat$} from "@/features/chat/api/ChatRx";
import {chatApi} from "@/app/wiring/chat";

interface Message {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: string; // ISO-8601
}

/** ───────────────── UI pieces (appearance unchanged) ───────────────── */

type ChatUserInputProps = {
    value: string;
    onChange: (v: string) => void;
    onSubmit: () => void;
};

const ChatUserInput = ({ value, onChange, onSubmit }: ChatUserInputProps) => {
    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            onSubmit();
        },
        [onSubmit]
    );

    return (
        <Box
            position="fixed"
            bottom="0"
            width="100vw"
            left="0"
            height={{ base: "20vh", md: "18vh" }}
            py="4"
            px={{ base: "4", md: "8", lg: "16", xl: "40" }}
            bg={{ _dark: "rgba(39 39 42, 1)", _light: "rgba(255, 255, 255, 0.3)" }}
            backdropFilter="blur(45px)"
            borderTop="1px solid"
            borderColor="border.emphasized"
            zIndex={1000}
        >
            <Flex
                maxHeight="10vh"
                as="form"
                align="bottom"
                justify="space-between"
                onSubmit={handleSubmit}
            >
                <Textarea
                    maxHeight="10vh"
                    borderRadius="2xl"
                    mr={{ base: "4", md: "6", lg: "10" }}
                    autoresize
                    placeholder="Type your message..."
                    size="lg"
                    variant="subtle"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
                <Center>
                    <Button size="lg" rounded="full" type="submit">
                        Send <IoSend />
                    </Button>
                </Center>
            </Flex>
            <Text textStyle="2xs" textAlign="center" mt="2">
                This site is protected by reCAPTCHA and the Google&nbsp;
                <Link color="purple.fg" href="https://policies.google.com/privacy">
                    Privacy Policy
                </Link>{" "}
                and&nbsp;
                <Link color="purple.fg" href="https://policies.google.com/terms">
                    Terms of Service
                </Link>{" "}
                apply.
            </Text>
        </Box>
    );
};

const UserMessage = ({ content }: { content: string }) => (
    <Flex width="100%" justifyContent="flex-end">
        <Box bg="purple.subtle" borderRadius="full" px="5" py="3" m="2" maxWidth="70%">
            {/* preserve user text as typed */}
            <Text whiteSpace="pre-wrap">{content}</Text>
        </Box>
    </Flex>
);

const AssistantMessage = ({ content }: { content: string }) => (
    <Box p="3" m="2" maxWidth="70%">
        {/* preserve spaces/newlines in streamed text */}
        <Text textStyle="lg" fontWeight="semibold" whiteSpace="pre-wrap">
            {content}
        </Text>
        <Clipboard.Root value={content} style={{ marginTop: 12 }}>
            <Clipboard.Trigger asChild>
                <IconButton variant="surface" size="xs" borderRadius="2xl" aria-label="Copy to clipboard">
                    <Clipboard.Indicator />
                </IconButton>
            </Clipboard.Trigger>
        </Clipboard.Root>
    </Box>
);

const MessagesView = ({ messages }: { messages: Message[] }) => {
    return (
        <Box px={{ base: "4", md: "8", lg: "16", xl: "40" }} pt={{ base: "4", md: "6", lg: "10" }}>
            {messages.map((msg) =>
                msg.role === "user" ? (
                    <UserMessage key={msg.id} content={msg.content} />
                ) : (
                    <AssistantMessage key={msg.id} content={msg.content} />
                )
            )}
        </Box>
    );
};

/** ───────────────── Page with API integration (no visual changes) ───────────────── */

export const ChatPage = () => {
    const [messages, setMessages] = useState<Message[]>([
        // keep your dummy content if you like, or start empty
        { id: "1", role: "user", content: "Hello, who are you?", timestamp: new Date().toISOString() },
        { id: "2", role: "assistant", content: "I am an AI assistant. How can I help you today?", timestamp: new Date().toISOString() },
    ]);
    const [input, setInput] = useState("");

    const subRef = useRef<ReturnType<typeof streamChat$>["subscribe"] | null>(null);
    const idRef = useRef(1000);

    // Clean up stream on unmount
    useEffect(() => {
        return () => {
            if (subRef.current) {
                // @ts-expect-error rxjs subscription at runtime
                subRef.current.unsubscribe();
                subRef.current = null;
            }
        };
    }, []);

    // inside ChatPage component:
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const history = await chatApi.tryGetHistory();
                if (!cancelled && history.length) {
                    setMessages((prev) => [...prev, ...history.map(m => ({
                        id: m.id, role: m.role, content: m.content, timestamp: m.timestamp
                    }))]);
                }
            } catch (e) {
                // For now: log only; gateway already clears session on unexpected errors
                console.error("[history] error", e);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const nextId = () => String(++idRef.current);

    const handleSend = useCallback(() => {
        const content = input.trim();
        if (!content) return;

        // Cancel any existing stream
        if (subRef.current) {
            // @ts-expect-error rxjs subscription at runtime
            subRef.current.unsubscribe();
            subRef.current = null;
        }

        const now = new Date().toISOString();
        const userId = nextId();
        const assistantId = nextId();

        // 1) append user message
        setMessages((prev) => [
            ...prev,
            { id: userId, role: "user", content, timestamp: now },
            { id: assistantId, role: "assistant", content: "", timestamp: now }, // placeholder to stream into
        ]);

        setInput("");

        // 2) start streaming
        console.log("[chat] stream start:", content);
        const obs = streamChat$(chatApi, content, { count: 3, baseMs: 300, capMs: 2500, jitter: true });

        // @ts-expect-error rxjs subscription at runtime
        subRef.current = obs.subscribe({
            next: (chunk) => {
                console.log("[chat] chunk:", JSON.stringify(chunk));
                // append chunk into the last assistant message
                setMessages((prev) =>
                    prev.map((m) => (m.id === assistantId ? {...m, content: m.content + chunk} : m))
                );
            },
            error: (err) => {
                console.error("[chat] stream error:", err);
            },
            complete: () => {
                console.log("[chat] stream complete");
            },
        });
    }, [input]);

    return (
        <Box>
            <ChatUserInput value={input} onChange={setInput} onSubmit={handleSend} />
            <MessagesView messages={messages} />
            <Bleed height={{ base: "22vh", md: "20vh" }} />
        </Box>
    );
};
