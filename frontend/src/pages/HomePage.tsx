import {HeroSection} from "@/components/HeroSection/HeroSection.tsx";
import {Container, SimpleGrid, GridItem, Highlight} from "@chakra-ui/react";

export const HomePage = () => {
    return (

        <Container py={10}>
            <SimpleGrid
                columns={{base: 1, md: 2, lg: 3}}
                gap={6}
            >
                <GridItem
                    rowSpan={2} colSpan={{base: 1, lg: 2}}
                >
                    <HeroSection
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

            </SimpleGrid>

        </Container>
    );
}