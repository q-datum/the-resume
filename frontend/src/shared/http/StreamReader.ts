export interface StreamCallbacks { onChunk: (data: string) => void; onError?: (err: unknown) => void; onClose?: () => void; }

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
                buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");

                let sep = buffer.indexOf("\n\n");
                while (sep >= 0) {
                    const block = buffer.slice(0, sep);
                    buffer = buffer.slice(sep + 2);

                    const dataLines: string[] = [];
                    for (const line of block.split("\n")) {
                        if (line.startsWith("data:")) dataLines.push(line.slice(5)); // keep exactly as sent
                    }
                    if (dataLines.length) onChunk(dataLines.join("\n"));
                    sep = buffer.indexOf("\n\n");
                }
            }
            onClose?.();
        } catch (err) {
            onError?.(err);
        }
    }
}
