// src/features/chat/components/ChatTest.tsx
import {type JSX, useCallback, useRef, useState } from "react";
import { streamChat$ } from "@/features/chat/api/ChatRx";
import { chatApi } from "@/app/wiring/chat";

function useLogger() {
    const [logs, setLogs] = useState<Array<{ t: string; msg: string }>>([]);
    const log = useCallback((msg: string) => {
        const t = new Date().toISOString();
        console.log(`[${t}] ${msg}`);
        setLogs((prev) => [...prev, { t, msg }]);
    }, []);
    const clear = useCallback(() => setLogs([]), []);
    return { logs, log, clear };
}

export function ChatPage(): JSX.Element {
    const { logs, log, clear } = useLogger();
    const [message, setMessage] = useState("Hello! Tell me a short fun fact.");
    const [response, setResponse] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const subRef = useRef<ReturnType<typeof streamChat$>["subscribe"] | null>(null);

    const handleSend = useCallback(() => {
        if (subRef.current) {
            // @ts-expect-error RxJS sub at runtime
            subRef.current.unsubscribe();
            subRef.current = null;
        }
        setResponse("");
        setIsStreaming(true);

        log(`Streaming start: "${message}"`);
        const obs = streamChat$(chatApi, message, { count: 3, baseMs: 300, capMs: 2500, jitter: true });

        const sub = obs.subscribe({
            next: (chunk) => {
                setResponse((prev) => prev + chunk);
                log(`chunk(${chunk.length})`);
            },
            error: (err) => {
                const msg = err instanceof Error ? err.message : String(err);
                log(`stream ERROR: ${msg}`);
                setIsStreaming(false);
            },
            complete: () => {
                log("stream COMPLETE");
                setIsStreaming(false);
            },
        });
        // @ts-expect-error RxJS sub at runtime
        subRef.current = sub;
    }, [log, message]);

    const handleStop = useCallback(() => {
        if (subRef.current) {
            // @ts-expect-error RxJS sub at runtime
            subRef.current.unsubscribe();
            subRef.current = null;
            log("stream ABORTED by user");
            setIsStreaming(false);
        }
    }, [log]);

    return (
        <div style={{ maxWidth: 720, margin: "2rem auto", fontFamily: "system-ui, sans-serif" }}>
            <h2>Chat Test</h2>

            <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1rem" }}>
                <label>
                    Message
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={3}
                        style={{ width: "100%" }}
                        placeholder="Type your prompt"
                    />
                </label>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button onClick={handleSend} disabled={isStreaming}>
                        {isStreaming ? "Streaming…" : "Send & Stream"}
                    </button>
                    <button onClick={handleStop} disabled={!isStreaming}>
                        Stop
                    </button>
                    <button onClick={clear}>Clear Logs</button>
                </div>
            </div>

            <h3>Assistant Response (live)</h3>
            <div style={{ minHeight: "6rem", padding: ".75rem", background: "#111", border: "1px solid #ddd", borderRadius: 8, whiteSpace: "pre-wrap" }}>
                {response || "—"}
            </div>

            <h3>Logs</h3>
            <div style={{ maxHeight: "16rem", overflow: "auto", padding: ".5rem", border: "1px solid #eee", borderRadius: 8, background: "#111", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12 }}>
                {logs.length === 0 ? <div style={{ opacity: .7 }}>No logs yet.</div> : (
                    <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                        {logs.map((l, i) => (
                            <li key={`${l.t}-${i}`}><span style={{ opacity: .6 }}>[{l.t}]</span> {l.msg}</li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
