import { Box, Button, Center, IconButton } from "@chakra-ui/react";
import { MdRefresh } from "react-icons/md";
import { AnimatePresence, motion } from "framer-motion";
import {useEffect, useState} from "react";
import {FaArrowDown} from "react-icons/fa";

const MotionBox = motion.create(Box);

interface ChatControlsProps {
    onClear: () => void;
    isHistoryLoading: boolean;
}

export const ChatControls = ({ onClear, isHistoryLoading }: ChatControlsProps) => {
    const [showScrollDown, setShowScrollDown] = useState(false);
    const [firstScrollCompleted, setFirstScrollCompleted] = useState(false);
    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const viewportHeight = window.innerHeight;
            const fullHeight = document.documentElement.scrollHeight;
            const distanceFromBottom = fullHeight - (scrollTop + viewportHeight);

            setShowScrollDown(distanceFromBottom > 120);
        };
        const handleScrollEnd = () => { setFirstScrollCompleted(true) }

        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });
        document.addEventListener("scrollend", handleScrollEnd)
        return () => {
            window.removeEventListener("scroll", handleScroll);
            document.removeEventListener("scrollend", handleScrollEnd)
        };
    }, []);

    const handleScrollDown = () => {
        window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: "smooth",
        });
    };

    return (
        <Box
            position="fixed"
            bottom="150px"
            left={0}
            width="100vw"
            zIndex={1000}
            pointerEvents="none"
        >
            <Center>
                <motion.div
                    layout
                    transition={{
                        type: "spring",
                        stiffness: 340,
                        damping: 30,
                        mass: 0.9,
                    }}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        pointerEvents: "auto",
                        width: "fit-content",
                    }}
                >
                    <motion.div
                        layout
                        style={{ flex: "0 0 auto" }}
                    >
                        <Button
                            variant="outline"
                            borderRadius="full"
                            size="sm"
                            onClick={onClear}
                            whiteSpace="nowrap"
                            flexShrink={0}
                            width="auto"
                            bg={{
                                _dark: "rgba(39, 39, 42, 0.2)",
                                _light: "rgba(255, 255, 255, 0.3)",
                            }}
                            backdropFilter="blur(45px)"
                        >
                            <MdRefresh />
                            New Session
                        </Button>
                    </motion.div>

                    <AnimatePresence initial={false} mode="popLayout">
                        {showScrollDown && !isHistoryLoading && firstScrollCompleted && (
                            <MotionBox
                                layout
                                initial={{ opacity: 0, scale: 0.8, width: 0 }}
                                animate={{ opacity: 1, scale: 1, width: 40 }}
                                exit={{ opacity: 0, scale: 0.8, width: 0 }}
                                transition={{
                                    width: {
                                        type: "spring",
                                        stiffness: 320,
                                        damping: 28,
                                        mass: 0.85,
                                    },
                                    scale: {
                                        type: "spring",
                                        stiffness: 420,
                                        damping: 24,
                                    },
                                    opacity: { duration: 0.15 },
                                    layout: {
                                        type: "spring",
                                        stiffness: 340,
                                        damping: 30,
                                        mass: 0.9,
                                    },
                                }}
                                overflow="hidden"
                                display="flex"
                                justifyContent="center"
                            >
                                <IconButton
                                    aria-label="scroll down"
                                    rounded="full"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleScrollDown}
                                    bg={{
                                        _dark: "rgba(39, 39, 42, 0.2)",
                                        _light: "rgba(255, 255, 255, 0.3)",
                                    }}
                                    backdropFilter="blur(45px)"
                                >
                                    <FaArrowDown />
                                </IconButton>
                            </MotionBox>
                        )}
                    </AnimatePresence>
                </motion.div>
            </Center>
        </Box>
    );
};