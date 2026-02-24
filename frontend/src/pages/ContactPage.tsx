import {ContactForm} from "@/features/contact/components/ContactForm.tsx";
import {Container, GridItem, SimpleGrid} from "@chakra-ui/react";
import {HeroSection} from "@/components/HeroSection/HeroSection.tsx";

export const ContactPage = () => {
    return (
        <Container>
            <SimpleGrid columns={{base: 1, md: 2}} gap={6}>
                <GridItem rowSpan={1} colSpan={{base: 1, md: 2}}>
                    <HeroSection
                        title="Contact"
                        subtitle="Don't hesitate to contact me directly. I usually reply within 1-2 days."
                        border={false}
                    />
                </GridItem>
                <GridItem rowSpan={1} colSpan={1}>
                    <ContactForm />
                </GridItem>

            </SimpleGrid>
        </Container>

    );
}