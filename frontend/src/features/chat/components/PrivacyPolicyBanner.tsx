import {Box, Center, Container} from "@chakra-ui/react";
import DarkVeil from "@/features/backgrounds/DarkVeil/DarkVeil.tsx";
import {useColorModeValue} from "@/components/ui/color-mode.tsx";
import {HeroSection} from "@/components/HeroSection/HeroSection.tsx";
import {useNavigate} from "react-router-dom";

interface IPrivacyPolicyBanner {
    onAccept: () => void
}

export const PrivacyPolicyBanner = ({onAccept}: IPrivacyPolicyBanner) => {
    const navigate = useNavigate();

    return (
        <Container w="100vw">
            <Box
                w="100vw"
                h="100vh"
                position="fixed"
                top="0"
                left="0"
                zIndex="-9999"
                animation="fade-in 4s ease-out"
            >
                {useColorModeValue(null, <DarkVeil />)}
            </Box>
            <Center h="80vh">
                <HeroSection
                    title="Welcome to the AI-powered chat"
                    subtitle="Ask questions about my work, experience, or projects and receive intelligent, real-time responses. This chat processes your messages to generate answers. Please review and accept the Privacy Policy before continuing."
                    centerContent={true}
                    border={false}
                    primaryButtonText="Accept"
                    onPrimaryButtonClick={onAccept}
                    secondaryButtonText="Privacy Policy"
                    onSecondaryButtonClick={() => navigate('/privacy')}
                />
            </Center>
        </Container>
    );
}