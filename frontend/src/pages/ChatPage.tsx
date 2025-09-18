import {Box, Button, Center, Flex, Textarea, Text, Link, Bleed, IconButton, Clipboard} from "@chakra-ui/react";
import { IoSend } from "react-icons/io5";

interface Message {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: string; // ISO-8601
}

const ChatUserInput = () => {
    return (
        <Box
            position="fixed"
            bottom="0"
            width="100vw"
            left="0"
            height={{base: "20vh", md: "18vh"}}
            py="4"
            px={{base: "4", md: "8", lg: "16", xl: "40"}}
            bg={{_dark: "rgba(39 39 42, 1)", _light: "rgba(255, 255, 255, 0.3)"}}
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
            >
                <Textarea
                    maxHeight="10vh"
                    borderRadius="2xl"
                    mr={{base: "4", md: "6", lg: "10"}}
                    autoresize
                    placeholder="Type your message..."
                    size="lg"
                    variant="subtle"

                />
                <Center>
                    <Button
                        size="lg"
                        rounded="full"
                    >
                        Send <IoSend />
                    </Button>
                </Center>
            </Flex>
            <Text textStyle="2xs" textAlign="center" mt="2">
                This site is protected by reCAPTCHA and the Google&nbsp;
                <Link color="purple.fg" href="https://policies.google.com/privacy">Privacy Policy</Link> and&nbsp;
                <Link color="purple.fg" href="https://policies.google.com/terms">Terms of Service</Link> apply.
            </Text>
        </Box>
    );
}

const UserMessage = ({ content }: { content: string }) => (
    <Flex width="100%" justifyContent="flex-end">
        <Box bg="purple.subtle" borderRadius="full" px="5" py="3" m="2" maxWidth="70%">
            <Text>{content}</Text>
        </Box>
    </Flex>
);

const AssistantMessage = ({ content }: { content: string }) => (
    <Box p="3" m="2" maxWidth="70%">
        <Text textStyle="lg" fontWeight="semibold">{content}</Text>
        <Clipboard.Root value={content} mt="3">
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
        <Box
            px={{base: "4", md: "8", lg: "16", xl: "40"}}
            pt={{base: "4", md: "6", lg: "10"}}
        >
            {messages.map((msg) => (
                msg.role === "user" ?
                    <UserMessage key={msg.id} content={msg.content} /> :
                    <AssistantMessage key={msg.id} content={msg.content} />
            ))}
        </Box>
    );
}

export const ChatPage = () => {
    const dummyMessages: Message[] = [
        {id: "1", role: "user", content: "Hello, who are you?", timestamp: new Date().toISOString()},
        {id: "2", role: "assistant", content: "I am an AI assistant. How can I help you today?", timestamp: new Date().toISOString()},
        {id: "3", role: "user", content: "Can you tell me a joke?", timestamp: new Date().toISOString()},
        {id: "4", role: "assistant", content: "Why did the scarecrow win an award? Because he was outstanding in his field!", timestamp: new Date().toISOString()},
        {id: "5", role: "user", content: "That's funny! Thanks!", timestamp: new Date().toISOString()},
        {id: "6", role: "assistant", content: "You're welcome! If you have any more questions or need assistance, feel free to ask.", timestamp: new Date().toISOString()},
        {id: "7", role: "user", content: "What can you do?", timestamp: new Date().toISOString()},
        {id: "8", role: "assistant", content: "I can help with a variety of tasks such as answering questions, providing information, and engaging in conversation.", timestamp: new Date().toISOString()},
        {id: "9", role: "user", content: "Great! Let's chat more later.", timestamp: new Date().toISOString()},
        {id: "10", role: "assistant", content: "Looking forward to it! Have a great day!", timestamp: new Date().toISOString()}
    ];

    return (
      <Box>
          <ChatUserInput />
            <MessagesView messages={dummyMessages} />
            <Bleed height={{ base: "22vh", md: "20vh" }} />
      </Box>
    );
}