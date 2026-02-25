import {
    Alert,
    Badge,
    Box,
    Button,
    Card,
    Field,
    Fieldset,
    Input,
    Link,
    Show,
    Stack,
    Text,
    Textarea
} from "@chakra-ui/react";
import {contactApi} from "@/app/wiring/contact.ts";
import type {ContactRequest} from "@/features/contact/api/ContactGateway.ts";
import {type ChangeEvent, useState} from "react";
import {RiArrowRightLine} from "react-icons/ri";

export const ContactForm = () => {
    const [formState, setFormState] = useState<ContactRequest>();
    const [isFormSending, setIsFormSending] = useState(false);
    const [isSentSuccess, setIsSentSuccess] = useState(false);

    const updateFormState = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
        setFormState (
            (prevState) => (
                {...prevState, [e.target.name]: e.target.value}
            )
        )
        console.log(formState)
    }

    const submitRequest = () => {
        if (!formState) return;
        setIsFormSending(true);
        contactApi.submit(formState).then(() => {
            setIsFormSending(false);
            setIsSentSuccess(true);
        }).catch((e) => console.error(e));
    }

    return (
        <Card.Root maxW="md">
            <Card.Header>
                <Card.Title>Contact form</Card.Title>
            </Card.Header>

            <Card.Body>
                <Fieldset.Root size="lg">
                    <Fieldset.Content>

                        <Field.Root>
                            <Field.Label>Name</Field.Label>
                            <Input name="name" onChange={updateFormState}/>
                        </Field.Root>

                        <Field.Root>
                            <Field.Label>Email
                                <Field.RequiredIndicator
                                    fallback={
                                        <Badge size="xs" variant="surface">
                                            Optional
                                        </Badge>
                                    }
                                />
                            </Field.Label>
                            <Input name="email" type="email" onChange={updateFormState} />
                        </Field.Root>

                        <Field.Root>
                            <Field.Label>Your message</Field.Label>
                            <Textarea variant="outline" name="message" placeholder="Your message..." onChange={updateFormState}/>
                        </Field.Root>
                    </Fieldset.Content>

                </Fieldset.Root>
            </Card.Body>
            <Card.Footer>
                <Show when={isSentSuccess}>
                    <Box animation="fade-in 300ms ease-out">
                        <Alert.Root status="success" >
                            <Alert.Indicator />
                            <Alert.Title>Sent. Thank you for reaching me out!</Alert.Title>
                        </Alert.Root>
                    </Box>
                </Show>

                <Show when={!isSentSuccess}>
                    <Stack>
                        <Text textStyle={{base: "2xs", lg: "xs"}} pb={2}>
                            This site is protected by reCAPTCHA and the Google&nbsp;
                            <Link color="purple.fg" href="https://policies.google.com/privacy">
                                Privacy Policy
                            </Link>{" "}
                            and&nbsp;
                            <Link color="purple.fg" href="https://policies.google.com/terms">
                                Terms of Service
                            </Link>{" "}
                            apply.
                        </Text>

                        <Button
                            type="submit"
                            alignSelf="flex-start"
                            rounded="xl"
                            loadingText="Sending..."
                            loading={isFormSending}
                            onClick={submitRequest}
                        >
                            Submit
                            <RiArrowRightLine />
                        </Button>
                    </Stack>

                </Show>
            </Card.Footer>
        </Card.Root>

    );

}