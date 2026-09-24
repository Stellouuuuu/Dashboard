export type EmailLanguage = "fr" | "en";

interface ConfirmEmailContent {
  subject: string;
  html: (link: string) => string;
}

const CONFIRM_EMAIL: Record<EmailLanguage, ConfirmEmailContent> = {
  fr: {
    subject: "Confirme ton compte Threshold",
    html: (link) => `<p>Bienvenue !</p><p><a href="${link}">${link}</a></p><p>Ce lien expire dans 24h.</p>`,
  },
  en: {
    subject: "Confirm your Threshold account",
    html: (link) => `<p>Welcome!</p><p><a href="${link}">${link}</a></p><p>This link expires in 24h.</p>`,
  },
};

/** Email de confirmation dans la langue du compte (PLAN.md i18n — langue enregistrée à l'inscription). */
export function confirmEmailContent(language: string): ConfirmEmailContent {
  return CONFIRM_EMAIL[language === "en" ? "en" : "fr"];
}
