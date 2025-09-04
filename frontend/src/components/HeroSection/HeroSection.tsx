import {Button, ButtonGroup, Container, Heading} from "@chakra-ui/react";
import type {ReactNode} from "react";

interface HeroSectionProps {
    title: string | ReactNode;
    subtitle: string | ReactNode;
    centerContent?: boolean;
    border?: boolean;
    primaryButtonText?: string;
    onPrimaryButtonClick?: () => void;
    secondaryButtonText?: string;
    onSecondaryButtonClick?: () => void;
}

export const HeroSection = ({
                                title,
                                subtitle,
                                centerContent = false,
                                border = true,
                                primaryButtonText = "Get Started",
                                onPrimaryButtonClick = undefined,
                                secondaryButtonText,
                                onSecondaryButtonClick = undefined
}: HeroSectionProps) => {
    const headingAlign = centerContent ? "center" : "left";
    const areButtonsPassedCorrectly =  primaryButtonText &&
                                                            secondaryButtonText &&
                                                            onPrimaryButtonClick !== undefined &&
                                                            onSecondaryButtonClick !== undefined;

    return (
        <Container
            maxW={{base: "xl", lg: "2xl", xl: "4xl"}}
            centerContent={centerContent}
            p={border ? {base: 5, md: 7, lg: 10} : 0}
            borderRadius="3xl"
            borderColor="border.emphasized"
            borderWidth={1}
            borderStyle={border? "solid": "none"}
        >
            <Heading
                as="h1"
                size={{base: "2xl", lg: "4xl", xl: "6xl"}}
                color="gray.fg"
                fontWeight="bold"
                textAlign={headingAlign}
                mb={4}
            >
                {title}
            </Heading>
            <Heading as="h2" size="lg" fontWeight="medium" textAlign={headingAlign}>
                {subtitle}
            </Heading>

            {
                areButtonsPassedCorrectly
                ?
                <ButtonGroup pt={{base: 10, lg: 16}} size="lg">
                    <Button
                        variant="solid"
                        colorPalette="gray"
                        rounded="xl"
                        onClick={onPrimaryButtonClick}
                    >
                        {primaryButtonText}
                    </Button>
                    <Button
                        variant="ghost"
                        colorPalette="purple"
                        rounded="xl"
                        onClick={onSecondaryButtonClick}
                    >
                        {secondaryButtonText}
                    </Button>
                </ButtonGroup>
                :
                null
            }

        </Container>
    );
}