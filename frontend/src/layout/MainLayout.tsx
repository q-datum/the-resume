import {Bleed, Flex} from '@chakra-ui/react';
import { Header } from './Header';
import { Footer } from './Footer';
import {Outlet, useLocation} from "react-router-dom";
import {navLinks} from "@/layout/navLinks.ts";

export const MainLayout = () => {
    const location = useLocation();

    const isFooterDisabled = () => {
        const disabledPages = ["/chat"];
        return !disabledPages.includes(location.pathname);
    }

    return (
        <Flex direction="column" minH="100vh">
            <Header navButtonLinks={navLinks}/>
                <Bleed height={20}/>
                <Outlet />
            {isFooterDisabled() ? <Footer /> : null}
        </Flex>
    );
};
