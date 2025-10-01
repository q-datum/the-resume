import {
    Bleed,
    Box,
    Button,
    Center,
    Clipboard,
    Container,
    Flex,
    IconButton,
    Link,
    Spinner,
    Text,
    Textarea,
    useBreakpointValue,
} from "@chakra-ui/react";
import { Prose } from "@/components/ui/prose"
import React, {useCallback, useEffect, useRef, useState} from "react";
import {IoSend} from "react-icons/io5";
import { MdRefresh } from "react-icons/md";
import {streamChat$} from "@/features/chat/api/ChatRx";
import {chatApi} from "@/app/wiring/chat";
import Markdown from "react-markdown";
import remarkGfm from 'remark-gfm'

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
    isStreaming?: boolean;
};

const ChatUserInput = ({ value, onChange, onSubmit, isStreaming }: ChatUserInputProps) => {
    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            onSubmit();
        },
        [onSubmit]
    );

    const sendButtonLabel = useBreakpointValue({
        base: "",
        md: "Send"
    })

    return (
        <Box
            position="fixed"
            bottom="0"
            width="100vw"
            left="0"
            pt="4"
            pb="3"
            px={{ base: "4", md: "8", lg: "16", xl: "40" }}
            bg={{ _dark: "rgba(39 39 42, 1)", _light: "rgba(255, 255, 255, 0.3)" }}
            backdropFilter="blur(45px)"
            borderTop="1px solid"
            borderColor="border"
            zIndex={1000}
        >
            <Container>
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
                        <Button size="lg" rounded="full" type="submit" disabled={isStreaming}>
                            {sendButtonLabel}
                            <IoSend />
                        </Button>
                    </Center>
                </Flex>
                <Text textStyle={{base: "2xs", lg: "xs"}} textAlign="center" mt="4">
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
            </Container>
        </Box>
    );
};

const UserMessage = ({ content }: { content: string }) => (
    <Flex width="100%" justifyContent="flex-end">
        <Box bg="purple.subtle" borderRadius="2xl" px="5" py="3" m="2" mr="0" maxWidth="70%">
            <Text whiteSpace="pre-wrap">{content}</Text>
        </Box>
    </Flex>
);

const AssistantMessage = ({ content }: { content: string }) => (
    <Box p="3" m="2" mt="7" pl="0" ml={{base: "2", md: "0"}} maxWidth={{base: "90%", md: "70%"}} overflowX="auto">
        {
            content === "" ? <Spinner size="sm" />
            :
            <Prose size="xl" baseColor="fg">
                <Markdown remarkPlugins={[remarkGfm]}>
                    {content}
                </Markdown>
            </Prose>
        }

        <Clipboard.Root value={content} style={{ marginTop: 12 }}>
            <Clipboard.Trigger asChild>
                <IconButton variant="surface" size="xs" borderRadius="full" aria-label="Copy to clipboard">
                    <Clipboard.Indicator />
                </IconButton>
            </Clipboard.Trigger>
        </Clipboard.Root>
    </Box>
);

const MessagesView = ({ messages }: { messages: Message[] }) => {
    return (
        <Box pt={{ base: "4", md: "6", lg: "10" }}>
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

const ClearChatButton = ({ onClear }: { onClear: () => void }) => (
    <Box position="fixed" bottom="150px" width="100vw" left="0" zIndex={1000}>
        <Center>
            <Button
                variant="outline"
                borderRadius="full"
                size="sm"
                onClick={onClear}
                bg={{ _dark: "rgba(39 39 42, 1)", _light: "rgba(255, 255, 255, 0.3)" }}
                backdropFilter="blur(45px)"
            >
                <MdRefresh />
                New Session
            </Button>
        </Center>
    </Box>

);

export const ChatPage = () => {
    const [messages, setMessages] = useState<Message[]>([
        { id: "1", role: "user", content: "Hello, who are you?", timestamp: new Date().toISOString() },
        { id: "2", role: "assistant", content: "I am an AI assistant. How can I help you today?", timestamp: new Date().toISOString() },
    ]);
    const [input, setInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);

    const loadedHistoryRef = React.useRef(false);
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

    React.useEffect(() => {
        if (loadedHistoryRef.current) return;
        loadedHistoryRef.current = true;

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

        // 1) append user message
        setMessages((prev) => [
            ...prev,
            { id: userId, role: "user", content, timestamp: now },
            { id: assistantId, role: "assistant", content: "", timestamp: now }, // placeholder to stream into
        ]);

        setInput("");

        // 2) start streaming
        console.log("[chat] stream start:", content);
        setIsStreaming(true);
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
                setIsStreaming(false);
            },
            complete: () => {
                console.log("[chat] stream complete");
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
            <ChatUserInput value={input} onChange={setInput} onSubmit={handleSend} isStreaming={isStreaming}/>
            <MessagesView messages={messages} />
            <ClearChatButton onClear={handleClear}/>
            <Bleed height={{base: "20vh", md: "15vh"}} />
        </Container>
    );
};
