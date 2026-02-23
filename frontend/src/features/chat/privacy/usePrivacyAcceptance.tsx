import { useEffect, useState } from "react";

const STORAGE_KEY = "privacyPolicyAccepted:v1";

/**
    To reset privacy accepted:
    <code> localStorage.setItem("privacyPolicyAccepted:v1", false); </code>
 **/

export function usePrivacyAcceptance() {
    const [hydrated, setHydrated] = useState(false);
    const [isPrivacyAccepted, setIsPrivacyAccepted] = useState(false);

    useEffect(() => {
        try {
            setIsPrivacyAccepted(localStorage.getItem(STORAGE_KEY) === "true");
        } finally {
            setHydrated(true);
        }
    }, []);

    const accept = () => {
        setIsPrivacyAccepted(true);
        try { localStorage.setItem(STORAGE_KEY, "true"); }
        catch { console.error("Failed to access local storage.") }
    };

    const reset = () => {
        setIsPrivacyAccepted(false);
        try { localStorage.removeItem(STORAGE_KEY); }
        catch { console.error("Failed to access local storage.") }
    };

    return { hydrated, isPrivacyAccepted, accept, reset };
}
