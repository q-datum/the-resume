import { Flex } from '@chakra-ui/react';
import { Header } from './Header';
import { Footer } from './Footer';
import {Outlet} from "react-router-dom";
import {navLinks} from "@/layout/navLinks.ts";

export const MainLayout = () => {
    return (
        <Flex direction="column" minH="100vh">
            <Header navButtonLinks={navLinks}/>
                <Outlet />
            <Footer />
        </Flex>
    );
};
