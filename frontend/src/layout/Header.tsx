import {
    Box,
    ButtonGroup,
    Heading,
    Button,
    Flex,
    Container,
    IconButton,
    Drawer,
    Portal,
    CloseButton
} from "@chakra-ui/react";
import { FaGithub } from "react-icons/fa";
import { CgMenu } from "react-icons/cg";
import * as React from "react";
import {ColorModeButton} from "@/components/ui/color-mode.tsx";

type NavigationButtonGroupProps = {
    orientation?: "vertical" | "horizontal";
}

const NavigationButtonGroup = ({orientation="horizontal"}: NavigationButtonGroupProps) => {
    return (

            orientation === "vertical" ?
                <ButtonGroup flexDirection="column"
                             size="xl"
                             variant="plain"
                             colorPalette="white"
                             alignItems="flex-start"
                             key="navigation-button-group"
                >
                    <Button>About</Button>
                    <Button>Projects</Button>
                    <Button>Contact</Button>
                </ButtonGroup>

                :

                <ButtonGroup variant="plain" colorPalette="white" key="navigation-button-group">
                    <Button>About</Button>
                    <Button>Projects</Button>
                    <Button>Contact</Button>
                </ButtonGroup>
    );
}

type MenuDrawerProps = {
    isOpen: boolean;
    setIsOpen: (e: boolean) => void;
}

const MenuDrawer = ({isOpen, setIsOpen}: MenuDrawerProps) => {
    return (
        <Drawer.Root
            size={'xl'}
            placement={'bottom'}
            open={isOpen}
            onOpenChange={(e) => setIsOpen(e.open)}
        >
            <Drawer.Trigger asChild>
                <></>
            </Drawer.Trigger>
            <Portal>
                <Drawer.Backdrop />
                <Drawer.Positioner>
                    <Drawer.Content rounded="2xl" bottom={-4}>
                        <Drawer.Body>
                            <Box padding={[4, 2, 2, 3]}>
                                <NavigationButtonGroup orientation={"vertical"}/>
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
    showMenu?: boolean;
}

const NavigationIconButtonGroup = ({showMenu = false}: NavigationIconButtonGroupProps) => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <ButtonGroup key="navigation-icon-button-group">
            <IconButton
                variant={'ghost'}
                aria-label="GitHub profile"
            >
                <FaGithub />
            </IconButton>
            <ColorModeButton />

            {showMenu &&
              <>
                <IconButton
                  variant={'ghost'}
                  aria-label="Open menu"
                  onClick={() => setIsOpen(!isOpen)}
                >
                  <CgMenu />
                </IconButton>
                <MenuDrawer isOpen={isOpen} setIsOpen={setIsOpen}/>
              </>
            }

        </ButtonGroup>
    );
}

export const Header = () => {

    return (
        <Box borderBottom={"1px solid"} borderColor={'gray.800'} paddingTop={'4'} paddingBottom={'2'}>
            <Container>
                <Flex justify="space-between">
                    <Heading fontWeight="bold">Alexander Muryshkin</Heading>
                    <Flex
                        display={{ base: 'none', md: 'flex' }}
                        direction="row"
                        align="center"
                        justify="space-between"
                    >
                        <NavigationButtonGroup />
                        <NavigationIconButtonGroup />
                    </Flex>
                    <Box
                        display={{ base: 'block', md: 'none' }}
                        children={<NavigationIconButtonGroup showMenu={true}/>}
                    />
                </Flex>
            </Container>
        </Box>
    );
}