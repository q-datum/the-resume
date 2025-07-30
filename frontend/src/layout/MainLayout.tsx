// src/layout/MainLayout.tsx
import type { ReactNode } from 'react';
import { Box, Flex, Container } from '@chakra-ui/react';
import { Header } from './Header';
import { Footer } from './Footer';

type MainLayoutProps = {
    children: ReactNode;
};

export const MainLayout = ({ children }: MainLayoutProps) => {
    return (
        <Flex direction="column" minH="100vh">
            <Header />

            <Box as="main" flex="1">
                <Container
                    maxW="container.lg"
                    px={{ base: 4, md: 6, lg: 8 }}
                    py={{ base: 4, md: 6 }}
                >
                    {children}
                </Container>
            </Box>

            <Footer />
        </Flex>
    );
};
