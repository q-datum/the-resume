import type {ReactNode} from "react";
import {Center, Text} from "@chakra-ui/react";

export const Footer = (): ReactNode => {
    return (
        <Center h={20}><Text color="fg.muted" fontSize="sm">© 2026 Alexander Muryshkin</Text></Center>
    )
}