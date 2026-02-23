import {Box, Button, Center} from "@chakra-ui/react";
import {MdRefresh} from "react-icons/md";

export const ClearChatButton = ({ onClear }: { onClear: () => void }) => (
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
