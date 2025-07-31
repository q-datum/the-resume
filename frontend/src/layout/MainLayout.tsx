import { Box, Flex, Container } from '@chakra-ui/react';
import { Header } from './Header';
import { Footer } from './Footer';
import {Outlet} from "react-router-dom";
import {navLinks} from "@/layout/navLinks.ts";

export const MainLayout = () => {
    return (
        <Flex direction="column" minH="100vh">
            <Header navButtonLinks={navLinks}/>

            <Box as="main" flex="1">
                <Container
                    maxW="container.lg"
                    px={{ base: 4, md: 6, lg: 8 }}
                    py={{ base: 4, md: 6 }}
                >
                    <Outlet />
                </Container>
            </Box>

            <Footer />
        </Flex>
    );
};
