export type EmailLanguage = "fr" | "en";

interface OtpEmailContent {
  subject: string;
  html: (code: string) => string;
}

const CONFIRM_EMAIL: Record<EmailLanguage, OtpEmailContent> = {
  fr: {
    subject: "Ton code Threshold",
    html: (code) =>
      `<p>Bienvenue !</p><p>Ton code de confirmation :</p><p style="font-size:28px;letter-spacing:6px;font-weight:700">${code}</p><p>Ce code expire dans 15 minutes.</p>`,
  },
  en: {
    subject: "Your Threshold code",
    html: (code) =>
      `<p>Welcome!</p><p>Your confirmation code:</p><p style="font-size:28px;letter-spacing:6px;font-weight:700">${code}</p><p>This code expires in 15 minutes.</p>`,
  },
};

const RESET_EMAIL: Record<EmailLanguage, OtpEmailContent> = {
  fr: {
    subject: "Réinitialisation Threshold",
    html: (code) =>
      `<p>Tu as demandé à réinitialiser ton mot de passe.</p><p>Ton code :</p><p style="font-size:28px;letter-spacing:6px;font-weight:700">${code}</p><p>Ce code expire dans 15 minutes. Si tu n'es pas à l'origine de cette demande, ignore cet email.</p>`,
  },
  en: {
    subject: "Threshold password reset",
    html: (code) =>
      `<p>You asked to reset your password.</p><p>Your code:</p><p style="font-size:28px;letter-spacing:6px;font-weight:700">${code}</p><p>This code expires in 15 minutes. If you did not request this, ignore this email.</p>`,
  },
};

function lang(language: string): EmailLanguage {
  return language === "en" ? "en" : "fr";
}

/** Email de confirmation (code OTP) dans la langue du compte. */
export function confirmEmailContent(language: string): OtpEmailContent {
  return CONFIRM_EMAIL[lang(language)];
}

/** Email de reset mot de passe (code OTP). */
export function resetEmailContent(language: string): OtpEmailContent {
  return RESET_EMAIL[lang(language)];
}
