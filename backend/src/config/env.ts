import "dotenv/config";
import { z } from "zod";
import { ensureSecrets } from "./secrets.js";

ensureSecrets();

const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required (e.g. postgres://user:pass@host:5432/db)"),
  JWT_SECRET: z
    .string()
    .min(16, "JWT_SECRET must be at least 16 characters (auto-generated if omitted)"),
  CRYPTO_KEY: z
    .string()
    .regex(
      /^[0-9a-fA-F]{64}$/,
      "CRYPTO_KEY must be exactly 64 hexadecimal characters (32 bytes). Omit it to auto-generate.",
    ),
  SMTP_HOST: z.string().default("localhost"),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  SMTP_SECURE: z
    .preprocess((v) => v === true || v === "true" || v === "1", z.boolean())
    .default(false),
  SMTP_USER: z.preprocess(emptyToUndefined, z.string().optional()),
  SMTP_PASS: z.preprocess(emptyToUndefined, z.string().optional()),
  SMTP_FROM: z.string().default("Threshold <no-reply@dashboard.local>"),
  // Render's free plan blocks outbound SMTP (25/465/587), so prod sends through
  // Brevo's HTTP API (port 443) instead when this is set. SMTP_FROM's email
  // must match a sender verified in Brevo.
  BREVO_API_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  APP_URL: z.string().url().default("http://localhost:8080"),
  SECRETS_DIR: z.preprocess(emptyToUndefined, z.string().optional()),
  ADMIN_EMAIL: z.preprocess(
    emptyToUndefined,
    z.string().email().default("admin@threshold.local"),
  ),
  ADMIN_PASSWORD: z.preprocess(emptyToUndefined, z.string().min(8).optional()),
  GITHUB_CLIENT_ID: z.preprocess(emptyToUndefined, z.string().optional()),
  GITHUB_CLIENT_SECRET: z.preprocess(emptyToUndefined, z.string().optional()),
  GITHUB_TOKEN: z.preprocess(emptyToUndefined, z.string().optional()),
});

function formatZodError(err: z.ZodError): string {
  const lines = err.issues.map((i) => `  • ${i.path.join(".") || "(root)"}: ${i.message}`);
  return [
    "Invalid environment configuration. Fix the following and restart:",
    ...lines,
    "",
    "Tip: leave JWT_SECRET and CRYPTO_KEY empty to auto-generate them into SECRETS_DIR.",
    "GitHub OAuth is optional — omit GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET to disable it.",
  ].join("\n");
}

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error(formatZodError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;

export const isGithubOAuthConfigured = Boolean(
  env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET,
);

if (!isGithubOAuthConfigured) {
  console.log("[config] GitHub OAuth disabled (GITHUB_CLIENT_ID/SECRET not set)");
}
