import {Button, ButtonGroup, Container, Heading} from "@chakra-ui/react";
import type {ReactNode} from "react";

interface HeroSectionProps {
    title: string | ReactNode;
    subtitle: string | ReactNode;
    centerContent?: boolean;
    border?: boolean;
    primaryButtonContent?: string | ReactNode;
    onPrimaryButtonClick?: () => void;
    secondaryButtonContent?: string | ReactNode;
    onSecondaryButtonClick?: () => void;
}

function isString(x: unknown): x is string {
    return typeof x === "string";
}

export const HeroSection = ({
                                title,
                                subtitle,
                                centerContent = false,
                                border = true,
                                primaryButtonContent = "Get Started",
                                onPrimaryButtonClick = undefined,
                                secondaryButtonContent,
                                onSecondaryButtonClick = undefined
}: HeroSectionProps) => {
    const headingAlign = centerContent ? "center" : "left";
    const primaryIsElement = !isString(primaryButtonContent);
    const secondaryIsElement = !isString(secondaryButtonContent);

    const showButtons =
        !!primaryButtonContent &&
        !!secondaryButtonContent &&
        (primaryIsElement || !!onPrimaryButtonClick) &&
        (secondaryIsElement || !!onSecondaryButtonClick);

    return (
        <Container
            maxW={{base: "xl", lg: "2xl", xl: "4xl"}}
            centerContent={centerContent}
            p={border ? {base: 5, md: 7, lg: 10} : 0}
            m={0}
            borderRadius="3xl"
            borderColor="border.emphasized"
            borderWidth={1}
            borderStyle={border? "solid": "none"}
        >
            <Heading
                as="h1"
                size={{base: "5xl", xl: "6xl"}}
                color="gray.fg"
                fontWeight="bold"
                textAlign={headingAlign}
                mb={4}
            >
                {title}
            </Heading>
            <Heading
                as="h2"
                size="lg"
                fontWeight="medium"
                textAlign={headingAlign}
                maxW={centerContent ? "70%" : "100%"}
            >
                {subtitle}
            </Heading>

            {
                showButtons
                ?
                <ButtonGroup pt={{base: 10, lg: 16}} size="lg">
                    <Button
                        variant="solid"
                        colorPalette="gray"
                        rounded="xl"
                        asChild={primaryIsElement}
                        onClick={primaryIsElement ? undefined : onPrimaryButtonClick}
                    >
                        {primaryButtonContent}
                    </Button>
                    <Button
                        variant="ghost"
                        colorPalette="purple"
                        rounded="xl"
                        asChild={secondaryIsElement}
                        onClick={secondaryIsElement ? undefined : onSecondaryButtonClick}
                    >
                        {secondaryButtonContent}
                    </Button>
                </ButtonGroup>
                :
                null
            }

        </Container>
    );
}