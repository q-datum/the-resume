import {
    Badge,
    Bleed,
    Box,
    Button,
    Card,
    Container,
    For,
    Highlight,
    HStack,
    Image,
    Separator,
    Stack,
    Text
} from "@chakra-ui/react";
import {HeroSection} from "@/components/HeroSection/HeroSection.tsx";
import {FaGithub, FaGitlab} from "react-icons/fa";
import theResumeImg from '@/assets/images/the-resume-portrait.png';
import dungeonsLabHubImg from '@/assets/images/dungeonslab-hub-portrait.png';
import gymByddyImg from '@/assets/images/gymbuddy-portrait.png';
import type {ReactNode} from "react";
import {GoLinkExternal} from "react-icons/go";

type Project = {
    name: string;
    description: {
        text: string;
        highlight: string[] | "";
    };
    tags: string[];
    buttonLink: {
        icon: ReactNode;
        href: string;
        label: string;
    };
    imageHref: string;
}

const projectsContent:Project[] = [
    {
        name: 'The Resume',
        description: {
            text: 'The Resume is my personal portfolio website designed to present my background through a clean UI and an AI-powered chat. The frontend is built with TypeScript + React and Chakra UI, fully responsive, and supports light/dark themes. I structured the UI using Feature-Driven Architecture (FDA) with a dedicated API layer to keep the codebase scalable and easy to extend. The backend is a reactive Java + Spring service that streams AI responses to the UI using Flux, creating a smooth “live typing” chat experience. To protect the system, the backend validates Google reCAPTCHA v3 and applies IP-based request throttling. Chat history is persisted in PostgreSQL and linked to a session ID, so returning users can continue the conversation seamlessly. Access to stored conversations is protected with JWT-based authorization to prevent unauthorized reads. The app is containerized with Docker, fronted by Nginx as a reverse proxy, and deployed via GitHub Actions.',
            highlight: ['The Resume', 'TypeScript + React', 'Chakra UI', 'light/dark themes', 'Feature-Driven Architecture (FDA)', 'reactive Java + Spring', 'Flux', 'Google reCAPTCHA v3', 'IP-based request throttling', 'PostgreSQL', 'session ID', 'JWT-based authorization', 'Docker', 'Nginx', 'GitHub Actions'],
        },
        tags: ['TypeScript', 'React', 'Vite', 'Java', 'Spring', 'AI', 'WebFlux', 'Docker', 'Nginx'],
        buttonLink: {
            icon: <FaGithub/>,
            href: 'https://github.com/q-datum/the-resume',
            label: 'View on GitHub'
        },
        imageHref: theResumeImg,
    },
    {
        name: 'DungeonsLAB Hub',
        description: {
            text: 'Dungeons LAB Hub is a TypeScript + React application embedded into Foundry VTT that acts as a centralized hub for Dungeons LAB plugins. It’s designed to feel native inside the Foundry UI, with separate experiences for Dungeon Masters (DMs) and Players. DMs get a toolbox of session macros — for example controlling weather, adjusting day/time, and other quality-of-life utilities that speed up table management. The project includes a premium layer that unlocks extra macros and maps via offline, hash-based activation key validation, so no server is required for licensing. From an engineering perspective, the module is bundled with Webpack using SWC for fast TypeScript/TSX builds, keeping iteration tight during development. The build pipeline also packages Foundry-ready assets (templates, localization files, and static resources) so installation stays straightforward. I led the hub’s development with a focus on maintainable UI structure and a smooth in-game workflow. The repository is private, but the public package page is available here:',
            highlight: ["Dungeons LAB Hub", "TypeScript + React", "Foundry VTT", "Dungeon Masters (DMs)", "Players", "weather", "day/time", "hash-based activation", "Webpack", "SWC", "TypeScript/TSX", "localization"],
        },
        tags: ['TypeScript', 'React', 'Webpack', 'SCSS', 'FoundryVTT'],
        buttonLink: {
            icon: <GoLinkExternal />,
            href: 'https://foundryvtt.com/packages/dungeons-lab-hub',
            label: 'View on FoundryVTT',
        },
        imageHref: dungeonsLabHubImg,
    },
    {
        name: 'GymBuddy',
        description: {
            text: 'Gym Buddy is a school project built to manage a gym’s schedule and class bookings. It provides a simple system for working with trainers, members, and gym classes, keeping the core entities and their relationships clear and easy to maintain. Users can browse available classes and create bookings when free slots are available. The frontend is built with Vite + React + JavaScript, focused on a straightforward UI for managing and viewing schedules. The backend is implemented in Java + Spring with PostgreSQL as the database. The whole application is Dockerized, making local setup and running the full stack consistent across environments.',
            highlight: ['Gym Buddy', 'trainers', 'members', 'gym classes', 'Vite + React + JavaScript', 'Java + Spring', 'PostgreSQL', 'Dockerized'],
        },
        tags: ['JavaScript', 'React', 'Vite', 'SCSS', 'Java', 'Spring', 'JPA', 'PostgreSQL'],
        buttonLink: {
            icon: <FaGitlab />,
            href: 'https://gitlab.fit.cvut.cz/murysale/bie-tjv-gymbuddy',
            label: 'View on GitLab',
        },
        imageHref: gymByddyImg,
    }

]

export const ProjectsPage = () => {
    const openLink = (href: string) => {
        window.open(href, "_blank", "noopener,noreferrer");
    }

    return (
        <Container>
            <Box pt={{base: 5, md: 10}}>
                <HeroSection
                    title="Projects"
                    subtitle={
                        <Highlight query={"end to end"} styles={{ color: "purple.fg" }}>
                            A selection of things I’ve built - end to end.
                        </Highlight>
                    }
                    border={false}
                />
            </Box>

            <Bleed h={10}/>
            <Separator/>

            <Stack pb={20}>
                <For each={projectsContent}>
                    {(project, index) =>
                        <Card.Root
                            key={index}
                            flexDirection={{lg: "row"}}
                            overflow="hidden"
                            size="lg"
                            mt={{base: 7, md: 14}}
                        >
                            <Box>

                                <Card.Body>

                                    <Card.Title mb="2">{project.name}</Card.Title>

                                    <Stack direction={{base: "column-reverse", lg: "row"}}>
                                        <Text py={5} pr={{base: 0, lg: 14}}>
                                            <Highlight query={project.description.highlight} styles={{fontWeight: 'semibold', color: 'fg'}}>
                                                {project.description.text}
                                            </Highlight>
                                        </Text>
                                        <Image
                                            rounded="xl"
                                            mt={5}
                                            w={{base: "100%",lg: "20vw"}}
                                            minW={{base: 0, lg: '400px'}}
                                            shadow="sm"
                                            fit="cover"
                                            src={project.imageHref}
                                            alt="Project Screenshot"
                                        />
                                    </Stack>

                                    <HStack mt="4" overflowX="auto">
                                        <For each={project.tags}>
                                            {(tag, index) => (
                                                <Badge
                                                    key={index}
                                                    variant="outline"
                                                    size="lg"
                                                    colorPalette={{_light: 'purple', _dark: 'purple'}}
                                                >
                                                    {tag}
                                                </Badge>
                                            )}
                                        </For>
                                    </HStack>

                                </Card.Body>

                                <Card.Footer>
                                    <Button onClick={() => openLink(project.buttonLink.href)} rounded="xl">
                                        {project.buttonLink.icon}
                                        {project.buttonLink.label}
                                    </Button>
                                </Card.Footer>

                            </Box>

                        </Card.Root>
                    }
                </For>
            </Stack>


        </Container>
    );
}