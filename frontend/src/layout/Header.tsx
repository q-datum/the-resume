import {
    Box,
    ButtonGroup,
    Button,
    Flex,
    Text,
    Container,
    IconButton,
    Drawer,
    Portal,
    CloseButton, For, Center
} from "@chakra-ui/react";
import { FaGithub } from "react-icons/fa";
import { CgMenu } from "react-icons/cg";
import * as React from "react";
import {ColorModeButton} from "@/components/ui/color-mode.tsx";
import type {INavLink} from "@/layout/navLinks.ts";
import { useLocation, Link as RouterLink } from 'react-router-dom';

type NavigationButtonGroupProps = {
    navButtonLinks: INavLink[];
    orientation?: "vertical" | "horizontal";
}

const NavigationButtonGroup = ({navButtonLinks, orientation="horizontal"}: NavigationButtonGroupProps) => {
    const location = useLocation();

    const getNavButtons = () => {
        return (
            <For each={navButtonLinks}>
                {(link, index) => (
                    <RouterLink to={link.path} key={index}>
                        <Button
                            key={index}
                            variant={location.pathname === link.path ? 'surface' : 'ghost'}
                        >
                            {link.label}
                        </Button>
                    </RouterLink>
                )}
            </For>
        );
    }

    return (

            orientation === "vertical" ?
                <ButtonGroup flexDirection="column"
                             size="xl"
                             variant="plain"
                             colorPalette="white"
                             alignItems="flex-start"
                             key="navigation-button-group"
                >
                    {getNavButtons()}
                </ButtonGroup>

                :

                <ButtonGroup variant="plain" colorPalette="white" key="navigation-button-group">
                    {getNavButtons()}
                </ButtonGroup>
    );
}

type MenuDrawerProps = {
    navButtonLinks: INavLink[];
    isOpen: boolean;
    setIsOpen: (e: boolean) => void;
}

const MenuDrawer = ({navButtonLinks, isOpen, setIsOpen}: MenuDrawerProps) => {
    return (
        <Drawer.Root
            size={'xl'}
            placement={'bottom'}
            open={isOpen}
            onOpenChange={(e) => setIsOpen(e.open)}
        >
            <Portal>
                <Drawer.Backdrop />
                <Drawer.Positioner>
                    <Drawer.Content rounded="2xl" bottom={-4}>
                        <Drawer.Body>
                            <Box padding={[6, 2, 2, 6]}>
                                <NavigationButtonGroup navButtonLinks={navButtonLinks} orientation={"vertical"}/>
                            </Box>
                        </Drawer.Body>
                        <Drawer.CloseTrigger asChild>
                            <CloseButton size="md" />
                        </Drawer.CloseTrigger>
                    </Drawer.Content>
                </Drawer.Positioner>
            </Portal>
        </Drawer.Root>
    );
}

type NavigationIconButtonGroupProps = {
    navButtonLinks: INavLink[];
    showMenu?: boolean;
}

const NavigationIconButtonGroup = ({navButtonLinks, showMenu = false}: NavigationIconButtonGroupProps) => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <ButtonGroup key="navigation-icon-button-group" paddingLeft="20px">
            <IconButton
                variant={'ghost'}
                aria-label="GitHub profile"
                key="github-ib"
            >
                <FaGithub />
            </IconButton>
            <ColorModeButton />

            {showMenu &&
              <div>
                <IconButton
                  variant={'ghost'}
                  aria-label="Open menu"
                  onClick={() => setIsOpen(!isOpen)}
                  key="menu-ib"
                >
                  <CgMenu />
                </IconButton>
                <MenuDrawer navButtonLinks={navButtonLinks} isOpen={isOpen} setIsOpen={setIsOpen}/>
              </div>
            }

        </ButtonGroup>
    );
}

type HeaderProps = {
    navButtonLinks: INavLink[];
};

export const Header = ({navButtonLinks}: HeaderProps) => {

    return (
        <Box
            borderBottom={"1px solid"}
            borderColor="border"
            paddingTop={4}
            paddingBottom={3}
            position="fixed"
            width="100%"
            bg={{ _dark: "rgba(39 39 42, 1)", _light: "rgba(255, 255, 255, 0.3)" }}
            backdropFilter="blur(45px)"
            zIndex={1000}
        >
            <Container>
                <Flex justify="space-between">
                    <Center h={10}>
                        <Text fontWeight="bold" textStyle={{base: "md", md: "lg"}}>
                            Alexander Muryshkin
                        </Text>
                    </Center>
                    <Flex
                        display={{ base: 'none', md: 'flex' }}
                        direction="row"
                        align="center"
                        justify="space-between"
                    >
                        <NavigationButtonGroup navButtonLinks={navButtonLinks} />
                        <NavigationIconButtonGroup navButtonLinks={navButtonLinks} />
                    </Flex>
                    <Box
                        display={{ base: 'block', md: 'none' }}
                        children={<NavigationIconButtonGroup navButtonLinks={navButtonLinks} showMenu={true}/>}
                    />
                </Flex>
            </Container>
        </Box>
    );
}