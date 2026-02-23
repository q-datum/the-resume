import {Chat} from "@/features/chat/components/Chat.tsx";
import {PrivacyPolicyBanner} from "@/features/chat/components/PrivacyPolicyBanner.tsx";
import {usePrivacyAcceptance} from "@/features/chat/privacy/usePrivacyAcceptance.tsx";

export const ChatPage = () => {
    const { hydrated, isPrivacyAccepted, accept } = usePrivacyAcceptance();

    if (!hydrated) return null;

    return isPrivacyAccepted ? <Chat /> : <PrivacyPolicyBanner onAccept={accept} />
};
