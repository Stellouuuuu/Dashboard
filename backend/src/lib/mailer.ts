import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false,
});

/** Envoie un email via Mailpit (dev/démo). Le lien doit toujours pointer vers APP_URL. */
export async function sendMail(to: string, subject: string, html: string): Promise<void> {
  await transporter.sendMail({
    from: "no-reply@dashboard.local",
    to,
    subject,
    html,
  });
}
