import { PersistentTokenStore } from "@/shared/auth/TokenStore";
import { GoogleRecaptchaV3Provider } from "@/shared/recaptcha/GoogleRecaptchaV3Provider";
import { ChatGateway } from "@/features/chat/api/ChatGateway";

const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string;

const tokenStore = new PersistentTokenStore("chat.jwt"); // not exported
const recaptcha = new GoogleRecaptchaV3Provider(siteKey, { autoHideBadge: true });

export const chatApi = new ChatGateway(tokenStore, recaptcha);
