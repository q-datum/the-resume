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
import {devLog} from "@/shared/utils/devUtils.ts";

type FormErrorMsg = {
    name: string;
    email: string;
    message: string;
}

export const ContactForm = () => {
    const [formState, setFormState] = useState<ContactRequest>();
    const [isFormSending, setIsFormSending] = useState(false);
    const [isSentSuccess, setIsSentSuccess] = useState(false);
    const [isNameError, setIsNameError] = useState(false);
    const [isEmailError, setIsEmailError] = useState(false);
    const [isMessageError, setIsMessageError] = useState(false);
    const [errorMsg, setErrorMsg] = useState<FormErrorMsg>({name: '', email: '', message: ''})

    const updateFormState = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
        setFormState (
            (prevState) => (
                {...prevState, [e.target.name]: e.target.value}
            )
        )
        devLog(formState)
    }

    const validateForm = (): boolean => {
        let isFormValid = true;
        setIsNameError(false);
        setIsEmailError(false);
        setIsMessageError(false);

        if (!formState?.name?.trim()) {
            isFormValid = false;
            setIsNameError(true);
            setErrorMsg(prevState => ({...prevState, name: "Please, enter your name."}))
        }
        if ((formState?.name?.trim().length ?? 0) > 100) {
            isFormValid = false;
            setIsNameError(true);
            setErrorMsg(prevState => ({...prevState, name: "Please, enter a shorter name."}))
        }
        if ((formState?.email?.trim().length ?? 0) > 255) {
            isFormValid = false;
            setIsEmailError(true);
            setErrorMsg(prevState => ({...prevState, email: "Please, enter a shorter email."}))
        }
        if ((formState?.email?.trim().length ?? 0) > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState?.email ?? '')) {
            isFormValid = false;
            setIsEmailError(true);
            setErrorMsg(prevState => ({...prevState, email: "Please, enter a valid email."}))
        }
        if (!formState?.message?.trim()) {
            isFormValid = false;
            setIsMessageError(true);
            setErrorMsg(prevState => ({...prevState, message: "Please, enter your message."}))
        }
        if ((formState?.message?.trim().length ?? 0) > 5000) {
            isFormValid = false;
            setIsMessageError(true);
            setErrorMsg(prevState => ({...prevState, message: "Please, enter a shorter message."}))
        }
        return isFormValid;
    }

    const submitRequest = () => {
        if (!validateForm() || !formState) return;
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

                        <Field.Root invalid={isNameError}>
                            <Field.Label>Name</Field.Label>
                            <Input name="name" onChange={updateFormState}/>
                            <Field.ErrorText width="full">
                                <Field.ErrorIcon h={3}/>
                                {errorMsg.name}
                            </Field.ErrorText>
                        </Field.Root>

                        <Field.Root invalid={isEmailError}>
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
                            <Field.ErrorText width="full">
                                <Field.ErrorIcon h={3}/>
                                {errorMsg.email}
                            </Field.ErrorText>
                        </Field.Root>

                        <Field.Root invalid={isMessageError}>
                            <Field.Label>Your message</Field.Label>
                            <Textarea variant="outline" name="message" placeholder="Your message..." onChange={updateFormState}/>
                            <Field.ErrorText width="full">
                                <Field.ErrorIcon h={3}/>
                                {errorMsg.message}
                            </Field.ErrorText>
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