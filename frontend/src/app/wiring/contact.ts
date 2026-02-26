import { GoogleRecaptchaV3Provider } from "@/shared/recaptcha/GoogleRecaptchaV3Provider";
import {ContactGateway} from "@/features/contact/api/ContactGateway.ts";

const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string;

const recaptcha = new GoogleRecaptchaV3Provider(siteKey, { autoHideBadge: true });
export const contactApi = new ContactGateway(recaptcha);
