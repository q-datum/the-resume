import React, {useCallback} from "react";
import {Box, Button, Center, Container, Flex, Link, Text, Textarea, useBreakpointValue} from "@chakra-ui/react";
import {IoSend} from "react-icons/io5";

type ChatUserInputProps = {
    value: string;
    onChange: (v: string) => void;
    onSubmit: () => void;
    isHistoryLoading?: boolean;
    isStreaming?: boolean;
};

export const ChatUserInput = ({
                                  value,
                                  onChange,
                                  onSubmit,
                                  isStreaming,
                                  isHistoryLoading,
                              }: ChatUserInputProps) => {
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
                        <Button
                            size="lg"
                            rounded="full"
                            type="submit"
                            disabled={isStreaming}
                            loading={isHistoryLoading}
                            loadingText="Loading"
                            spinnerPlacement="start"
                        >
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