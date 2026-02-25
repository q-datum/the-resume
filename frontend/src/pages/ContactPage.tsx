import {ContactForm} from "@/features/contact/components/ContactForm.tsx";
import {
    Bleed,
    Container,
    GridItem, Heading,
    Highlight,
    Link,
    Separator,
    SimpleGrid,
    Stat,
} from "@chakra-ui/react";
import {HeroSection} from "@/components/HeroSection/HeroSection.tsx";
import {FaGithub, FaLinkedin} from "react-icons/fa";

export const ContactPage = () => {
    return (
        <Container>
            <SimpleGrid columns={{base: 1, md: 2}} gap={50}>
                <GridItem rowSpan={1} colSpan={{base: 1, md: 2}} pt={{base: 5, md: 10}}>
                    <HeroSection
                        title="Contact"
                        subtitle={
                            <Highlight query={"within 1-2 days"} styles={{ color: "purple.fg" }}>
                                Don't hesitate to contact me directly. I usually reply within 1-2 days.
                            </Highlight>
                        }
                        border={false}
                    />
                    <Bleed h={10}/>
                    <Separator/>
                </GridItem>
                <GridItem rowSpan={1} colSpan={1}>
                    <ContactForm />
                </GridItem>
                <GridItem>
                    <SimpleGrid columns={{base: 1, lg: 2}} gap={10}>
                        <GridItem display={{base: 'block', md: 'none'}}>
                            <Bleed h={5} />
                            <Separator />
                            <Bleed h={5} />
                        </GridItem>
                        <GridItem>
                            <Heading size="2xl">Contact Details</Heading>
                        </GridItem>
                        <GridItem display={{base: 'none', lg: 'block'}} />
                        <GridItem>
                            <Stat.Root>
                                <Stat.Label color="purple.fg">my email</Stat.Label>
                                <Stat.ValueText>
                                    <Link
                                        variant="plain"
                                        type="email"
                                        href="mailto://q.datum@gmail.com"
                                    >
                                        q.datum@gmail.com
                                    </Link>
                                </Stat.ValueText>
                            </Stat.Root>
                        </GridItem>
                        <GridItem>
                            <Stat.Root>
                                <Stat.Label color="purple.fg">my timezone</Stat.Label>
                                <Stat.ValueText>
                                    UTC+1
                                </Stat.ValueText>
                            </Stat.Root>
                        </GridItem>
                        <GridItem>
                            <Stat.Root>
                                <Stat.Label color="purple.fg">visit</Stat.Label>
                                <Stat.ValueText>
                                    <Link
                                        variant="plain"
                                        href="https://github.com/q-datum"
                                    >
                                        <FaGithub style={{marginRight: '5px'}}/> My GitHub
                                    </Link>
                                </Stat.ValueText>
                            </Stat.Root>
                        </GridItem>
                        <GridItem>
                            <Stat.Root>
                                <Stat.Label color="purple.fg">visit</Stat.Label>
                                <Stat.ValueText>
                                    <Link
                                        variant="plain"
                                        href="https://www.linkedin.com/in/alexander-muryshkin-390828236"
                                    >
                                        <FaLinkedin style={{marginRight: '5px'}}/> My LinkedIn
                                    </Link>
                                </Stat.ValueText>
                            </Stat.Root>
                        </GridItem>
                    </SimpleGrid>
                </GridItem>
                <GridItem colSpan={{base: 1, md: 2}}>
                    <Bleed h={10} />
                </GridItem>
            </SimpleGrid>
        </Container>

    );
}