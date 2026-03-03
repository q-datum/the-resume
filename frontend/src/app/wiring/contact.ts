import { GoogleRecaptchaV3Provider } from "@/shared/recaptcha/GoogleRecaptchaV3Provider";
import {ContactGateway} from "@/features/contact/api/ContactGateway.ts";

const recaptcha = new GoogleRecaptchaV3Provider({ autoHideBadge: true });
export const contactApi = new ContactGateway(recaptcha);
