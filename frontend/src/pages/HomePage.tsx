import {HeroSection} from "@/components/HeroSection/HeroSection.tsx";
import {
    Container,
    SimpleGrid,
    GridItem,
    Highlight,
    Card,
    Button,
    Image,
    useBreakpointValue, Heading,
    Timeline,
    Text,
    Box,
    Blockquote, For, Center, Flex, Link
} from "@chakra-ui/react";
import sampleChatImg from "@/assets/images/sample-chat.png";
import myPhoto from "@/assets/images/my-photo.jpg";
import cvutLogo from "@/assets/images/logo_CVUT.svg"
import {useNavigate} from "react-router-dom";
import {FaDiceD20, FaSuitcase} from "react-icons/fa";
import {SiCommerzbank} from "react-icons/si";
import type {ReactNode} from "react";
import {SkillsBlock} from "@/components/ui/SkillsBlock.tsx";

type ExperienceNode = {
    title: string;
    period: string;
    icon: ReactNode;
    description: ReactNode;
}

const experiences: ExperienceNode[] = [
    {
        title: "Frontend Developer, Dungeons LAB",
        period: "Feb 2025 – present",
        icon: <FaDiceD20 />,
        description:
            <Text textStyle="md">
                Built and maintained <strong>Dungeons LAB HUB</strong> using <strong>TypeScript</strong>,
                <strong>React</strong>, and <strong>Sass</strong> — an in-game hub for managing our
                released macros, modules, and content.
                Shipped QoL macros that streamline common player / DM
                workflows and reduce repetitive manual steps
                for a <Link color="purple.fg" href="https://www.patreon.com/cw/Dungeons_LAB">Patreon</Link>-supported
                community of 3,000+ members.
            </Text>
    },
    {
        title: "Frontend Developer, Commerzbank",
        period: "Feb 2023 – Feb 2025",
        icon: <SiCommerzbank />,
        description:
            <Box>
                <Text textStyle="md">
                    Built and maintained <strong>Transaction Overview</strong> features for
                    an <strong>online banking</strong> web app using <strong>React</strong>,
                    <strong>TypeScript</strong>, and  <strong>Sass</strong>;
                </Text>
                <Text textStyle="md">
                    Implemented reusable UI components and expanded
                    automated tests with <strong>Jest</strong>, reducing local test execution
                    time by up to ~50%;
                </Text>
                <Text textStyle="md">
                    Led development of an internal employee directory
                    (“Book of Faces”) used by ~200 employees, improving
                    discoverability and onboarding;
                </Text>
            </Box>
    },
    {
        title: "Python Developer, Kvadro Plus",
        period: "Jan 2022 – Dec 2022",
        icon: <FaSuitcase />,
        description:
            <Text textStyle="md">
                Built a stock-market data parsing pipeline using <strong>Python</strong>,
                <strong>Pandas</strong>, and <strong>yfinance</strong>, producing structured datasets for
                analysis.
            </Text>
    },
    {
        title: "Web Developer, ABC Studio",
        period: "Aug 2020 – Dec 2021",
        icon: <FaSuitcase />,
        description:
            <Text textStyle="md">
                Developed and maintained the website for a local language school featuring
                a <strong>booking system</strong>, <strong>admin panel</strong> and a <strong>landing page </strong>. The application
                was based on <strong>JQuery</strong>, <strong>PHP</strong>, and <strong>PostgreSQL</strong>
            </Text>
    },
]

export const HomePage = () => {
    const secondaryButtonHref = useBreakpointValue<string>({
        base: '/chat',
        md: '/projects'
    }) ?? '/chat';

    const navigate = useNavigate();

    const openGithubProfile = () => {
        window.open("https://github.com/q-datum/the-resume", "_blank", "noopener,noreferrer");
    }

    return (

        <Container py={10}>
            <SimpleGrid
                columns={{base: 1, md: 2, lg: 3}}
                gridTemplateRows="auto"
                gap={6}
            >
                <GridItem rowSpan={{base: 2, md: 1}} colSpan={{base: 1, lg: 2}}>
                    <HeroSection
                        border = {false}
                        title = {
                            <Highlight query={"I am Alexander"} styles={{ color: "purple.fg" }}>Hello, I am Alexander</Highlight>
                        }
                        subtitle = {
                            <Box>
                                <Highlight query={["frontend", "full-stack developer", "React", "TypeScript", "Java Spring Boot"]} styles={{ color: "purple.fg" }}>
                                    An experienced frontend / full-stack developer specializing in building modern web applications based on React,
                                    TypeScript, and Java Spring Boot.
                                </Highlight>
                                <br/><br/>
                                Prague • Open to remote
                            </Box>
                        }
                        primaryButtonContent={
                            <a
                                href="/cv/CV%20-%20Alexander%20Muryshkin%20(public).pdf"
                                download="Alexander_Muryshkin_CV.pdf"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Download CV
                            </a>
                        }
                        secondaryButtonContent={useBreakpointValue({base: "AI Chat", md: "Projects"})}
                        onSecondaryButtonClick={() => navigate(secondaryButtonHref)}
                    />
                </GridItem>

                <GridItem display="flex" flexDirection="column" justifyContent="end">
                    <Flex direction="row" justify="end">
                        <Image
                            rounded={{base: "2xl", md: "full"}}
                            fit="cover"
                            w={{base: '100%', md: "250px"}}
                            h={{base: '100wv', md: "250px"}}
                            src={myPhoto}
                            alt="Alexander's Photo"
                        />
                    </Flex>
                </GridItem>

                <GridItem colSpan={{base: 1, md: 2, lg: 3}}>
                    <SkillsBlock />
                </GridItem>

                <GridItem colSpan={{base: 1, lg: 2}}>
                    <Heading size="4xl" fontWeight="bold">My Experience</Heading>
                    <Timeline.Root size="xl" mt={10} maxW="600px">
                        <For each={experiences}>
                            {(experience, index) => (
                                <Timeline.Item key={index}>
                                    <Timeline.Connector>
                                        <Timeline.Separator />
                                        <Timeline.Indicator>
                                            {experience.icon}
                                        </Timeline.Indicator>
                                    </Timeline.Connector>
                                    <Timeline.Content>
                                        <Timeline.Title fontSize="lg" fontWeight="bold">{experience.title}</Timeline.Title>
                                        <Timeline.Description fontSize="sm" color="purple.fg">{experience.period}</Timeline.Description>
                                        {experience.description}
                                    </Timeline.Content>
                                </Timeline.Item>
                            )}
                        </For>
                    </Timeline.Root>
                </GridItem>

                {useBreakpointValue({
                    base: null,
                    md:
                        <GridItem colSpan={1} display="flex" alignItems="start">

                            <Card.Root mt="4.75rem" overflow="hidden" variant={{_dark: "outline", _light: "elevated"}}>
                                <Image src={sampleChatImg} alt="Sample Chat" />
                                <Card.Body>
                                    <Card.Title>AI-Powered Chat</Card.Title>
                                    <Card.Description>Ask anything in the GPT-powered chat about my background, education, experience, and projects.</Card.Description>
                                </Card.Body>
                                <Card.Footer gap="2">
                                    <Button variant="solid" onClick={() => navigate('/chat')}>Start chat</Button>
                                    <Button variant="ghost" onClick={openGithubProfile}>How it works</Button>
                                </Card.Footer>
                            </Card.Root>

                        </GridItem>,
                })}

                <GridItem colSpan={{base: 1, md: 2, lg: 3}}>
                    <Heading size="4xl" fontWeight="bold" mt={10}>Education</Heading>
                    <Flex direction="row" mt={10} gap={{base: 8, md: 10}}>
                        <Center>
                            <Image
                                src={cvutLogo}
                                alt="cvut logo"
                                fit="contain"
                                height={28}
                            />
                        </Center>
                        <Box>
                            <Heading size={{base: "lg", md: "2xl"}} fontWeight="bold">Czech Technical University in Prague</Heading>
                            <Text fontSize={{base: "md", md: "lg"}} fontWeight="semibold" >Faculty of Information Technology</Text>
                            <Text color="fg.muted">Bachelor’s degree in Software Engineering - graduation in summer 2026</Text>
                        </Box>

                    </Flex>

                </GridItem>

                <GridItem colSpan={{base: 1, md: 2, lg: 3}}>
                    <Heading size="4xl" fontWeight="bold" mt={10}>About</Heading>
                    <Blockquote.Root mt={10} variant="solid" maxW={{base: "100%",md: "60%"}}>
                        <Blockquote.Content fontSize="lg">
                            I build reliable, maintainable applications with well-thought-out architecture and a focus on scalability and reuse. I enjoy improving developer experience through clean abstractions, testing, and automation. I stay curious and adopt new tools pragmatically — including AI-assisted workflows — when they help ship better software faster.
                        </Blockquote.Content>
                    </Blockquote.Root>
                </GridItem>

            </SimpleGrid>

        </Container>
    );
}