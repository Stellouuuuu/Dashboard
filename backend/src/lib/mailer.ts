import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth:
    env.SMTP_USER && env.SMTP_PASS
      ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
      : undefined,
});

function parseFrom(raw: string): { email: string; name?: string } {
  const match = raw.match(/^(.*)<(.+)>$/);
  if (match) return { name: match[1].trim() || undefined, email: match[2].trim() };
  return { email: raw.trim() };
}

async function sendViaBrevo(to: string, subject: string, html: string): Promise<void> {
  const from = parseFrom(env.SMTP_FROM);
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": env.BREVO_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: from,
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });
  if (!res.ok) {
    throw new Error(`Brevo error ${res.status}: ${await res.text()}`);
  }
}

/**
 * Envoie un email : Mailpit/SMTP réel en local, ou Brevo (API HTTP, port 443)
 * si BREVO_API_KEY est défini — Render bloque le SMTP sortant (25/465/587)
 * sur son plan gratuit, donc nodemailer y reste bloqué indéfiniment.
 */
export async function sendMail(to: string, subject: string, html: string): Promise<void> {
  if (env.BREVO_API_KEY) {
    await sendViaBrevo(to, subject, html);
    return;
  }
  await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    html,
  });
}
