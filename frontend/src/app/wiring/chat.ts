import { PersistentSessionStore } from "@/shared/auth/SessionStore";
import { GoogleRecaptchaV3Provider } from "@/shared/recaptcha/GoogleRecaptchaV3Provider";
import { ChatGateway } from "@/features/chat/api/ChatGateway";

const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string;

const store = new PersistentSessionStore("chat");
const recaptcha = new GoogleRecaptchaV3Provider(siteKey, { autoHideBadge: true });
export const chatApi = new ChatGateway(store, recaptcha);
