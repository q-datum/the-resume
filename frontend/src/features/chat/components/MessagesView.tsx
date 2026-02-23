import {Box, Flex, Text, Spinner, Clipboard, IconButton} from "@chakra-ui/react";
import {Prose} from "@/components/ui/prose.tsx";
import Markdown from "react-markdown";
import remarkGfm from 'remark-gfm'

export interface Message {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: string; // ISO-8601
}

const UserMessage = ({ content }: { content: string }) => (
    <Flex width="100%" justifyContent="flex-end" animationName="slide-from-bottom-full, fade-in" animationDuration="300ms">
        <Box bg="purple.subtle" borderRadius="2xl" px="5" py="3" m="2" mr="0" maxWidth="70%">
            <Text whiteSpace="pre-wrap">{content}</Text>
        </Box>
    </Flex>
);

const AssistantMessage = ({ content }: { content: string }) => (
    <Box
        p="3"
        m="2"
        mt="7"
        pl="0"
        ml={{base: "2", md: "0"}}
        maxWidth={{base: "90%", md: "70%"}}
        overflowX="auto"
        animation="easeIn"
        animationName="slide-from-bottom-full, fade-in"
        animationDuration="500ms"
    >
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

export const MessagesView = ({ messages }: { messages: Message[] }) => {
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