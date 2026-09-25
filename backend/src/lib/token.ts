import { randomBytes, randomInt, createHash } from "node:crypto";

/** Génère un token opaque haute-entropie (refresh token). */
export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/** Code OTP à 6 chiffres (confirmation email, reset mot de passe). */
export function generateOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** Les tokens/OTP ne sont jamais stockés en clair — seul le hash sha256 va en base. */
export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}
