import React from "react";
import {
    Box,
    Heading,
    Text,
    SimpleGrid,
    Wrap,
    WrapItem,
    Badge, Icon, Center,
} from "@chakra-ui/react";
import {
    FaReact,
    FaJava,
    FaDocker,
    FaGithub,
    FaGitlab,
    FaDatabase,
} from "react-icons/fa";
import { SiTypescript, SiSpring, SiJest, SiWebpack, SiVite, SiPostgresql } from "react-icons/si";
import {useColorModeValue} from "@/components/ui/color-mode.tsx";

type SkillGroupProps = {
    title: string;
    skills: { label: string; icon?: React.ElementType }[];
};

function SkillGroup({ title, skills }: SkillGroupProps) {
    const cardBg = useColorModeValue("white", "whiteAlpha.50");
    const cardBorder = useColorModeValue("blackAlpha.200", "whiteAlpha.200");
    const tagBg = useColorModeValue("blackAlpha.50", "whiteAlpha.100");

    return (
        <Box
            bg={cardBg}
            borderWidth="1px"
            borderColor={cardBorder}
            borderRadius="2xl"
            p={{ base: 5, md: 6 }}
            shadow="sm"
        >
            <Heading size="lg" display="flex" fontWeight="bold" alignItems="center" gap={3} mb={3}>
                {title}
            </Heading>

            <Wrap rowGap={2}>
                {skills.map((s) => (
                    <WrapItem key={s.label}>
                        <Badge bg={tagBg} borderRadius="full" px={3} py={1} size="lg">
                            <Center color="purple.fg">
                                {s.icon ? <Icon mr={1} as={s.icon} /> : null}
                            </Center>
                            <Text fontWeight="medium">{s.label}</Text>
                        </Badge>
                    </WrapItem>
                ))}
            </Wrap>
        </Box>
    );
}

export function SkillsBlock() {
    return (
        <Box py={{ base: 10, md: 14 }}>
            <Heading size="4xl" fontWeight="bold">Skills</Heading>
            <Text mt={2} color={useColorModeValue("blackAlpha.700", "whiteAlpha.700")}>
                My core stack for frontend and full-stack projects.
            </Text>

            <SimpleGrid mt={6} columns={{ base: 1, md: 2 }} gap={4}>
                <SkillGroup
                    title="Frontend"
                    skills={[
                        { label: "TypeScript", icon: SiTypescript },
                        { label: "React", icon: FaReact },
                        { label: "Jest", icon: SiJest },
                        { label: "Vite", icon: SiVite },
                        { label: "Webpack", icon: SiWebpack },
                    ]}
                />

                <SkillGroup
                    title="Backend"
                    skills={[
                        { label: "Java", icon: FaJava },
                        { label: "Spring", icon: SiSpring },
                        { label: "PostgreSQL", icon: SiPostgresql },
                        { label: "JUnit" },
                        { label: "Mockito" },
                    ]}
                />

                <SkillGroup
                    title="DevOps & Tooling"
                    skills={[
                        { label: "Docker", icon: FaDocker },
                        { label: "GitHub Actions", icon: FaGithub },
                        { label: "GitLab CI/CD", icon: FaGitlab },
                        { label: "SQL", icon: FaDatabase },
                    ]}
                />

                <SkillGroup
                    title="Languages"
                    skills={[
                        { label: "English (C1)" },
                        { label: "Czech (B1)" },
                        { label: "Russian (Native)" },
                    ]}
                />
            </SimpleGrid>
        </Box>
    );
}