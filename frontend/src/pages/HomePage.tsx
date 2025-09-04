import {HeroSection} from "@/components/HeroSection/HeroSection.tsx";
import {Container, SimpleGrid, GridItem, Highlight, Card, Button, Image} from "@chakra-ui/react";
import sampleChatImg from "@/assets/images/sample-chat.png";

export const HomePage = () => {
    return (

        <Container py={10}>
            <SimpleGrid
                columns={{base: 1, md: 2, lg: 3}}
                gap={6}
            >
                <GridItem rowSpan={2} colSpan={{base: 1, lg: 2}}>
                    <HeroSection
                        border = {false}
                        title = {
                            <Highlight query={"I am Alexander"} styles={{ color: "purple.fg" }}>Hello, I am Alexander</Highlight>
                        }
                        subtitle = {
                            <Highlight query={["web developer", "React", "TypeScript", "Java Spring Boot"]} styles={{ color: "purple.fg" }}>
                                An experienced web developer specializing in building modern web applications based on React,
                                TypeScript, and Java Spring Boot.
                            </Highlight>
                        }
                        primaryButtonText="My Skills"
                        onPrimaryButtonClick={() => window.location.href = "/skills"}
                        secondaryButtonText="My Projects"
                        onSecondaryButtonClick={() => window.location.href = "/projects"}
                    />
                </GridItem>

                <GridItem rowSpan={2} colSpan={1}>

                    <Card.Root>
                        <Image src={sampleChatImg} alt="Sample Chat" />
                        <Card.Body>
                            <Card.Title>AI-Powered Chat</Card.Title>
                            <Card.Description>Ask anything in the GPT-powered chat about my background, education, experience, and projects.</Card.Description>
                        </Card.Body>
                        <Card.Footer gap="2">
                            <Button variant="solid">Start chat</Button>
                            <Button variant="ghost">How it works</Button>
                        </Card.Footer>
                    </Card.Root>

                </GridItem>

            </SimpleGrid>

        </Container>
    );
}