import {Center, Container, Link} from "@chakra-ui/react";
import {HeroSection} from "@/components/HeroSection/HeroSection.tsx";

export const NotFoundPage = () => {
    return (
        <Container>
            <Center height="80vh">
                <HeroSection title={"404"} subtitle={
                        <>
                            Page was not found. Return
                            to <Link color="purple.fg" href="/">home page</Link>.
                        </>
                    }
                />
            </Center>
        </Container>
    );
}