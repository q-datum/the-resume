export interface StreamCallbacks {
    onChunk: (data: string) => void;
    onError?: (err: unknown) => void;
    onClose?: () => void;
}

/**
 * SSE reader that preserves spaces EXACTLY as sent by the server.
 * - Does not trim or strip the "optional" post-colon space.
 * - Concatenates multiple `data:` lines in a single event with '\n' (per spec).
 */
export class StreamReader {
    async readSSE(res: Response, cbs: StreamCallbacks): Promise<void> {
        const { onChunk, onError, onClose } = cbs;
        try {
            const reader = res.body!.getReader();
            const decoder = new TextDecoder("utf-8");
            let buffer = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                // Normalize CRLF to LF so "\n\n" split works reliably
                buffer = buffer.replace(/\r\n/g, "\n");

                let sep = buffer.indexOf("\n\n");
                while (sep >= 0) {
                    const eventBlock = buffer.slice(0, sep);
                    buffer = buffer.slice(sep + 2);

                    const lines = eventBlock.split("\n");
                    const dataLines: string[] = [];

                    for (const line of lines) {
                        // DO NOT trim the line; preserve spaces.
                        if (line.startsWith("data:")) {
                            // Keep everything after the colon exactly as-is (including the first space if present)
                            dataLines.push(line.slice(5));
                        }
                    }

                    if (dataLines.length > 0) {
                        // Spec: join multiple data lines with '\n'
                        const payload = dataLines.join("\n");
                        onChunk(payload);
                    }

                    sep = buffer.indexOf("\n\n");
                }
            }

            onClose?.();
        } catch (err) {
            onError?.(err);
        }
    }
}
