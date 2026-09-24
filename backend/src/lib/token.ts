import { randomBytes, createHash } from "node:crypto";

/** Génère un token opaque haute-entropie (email confirm, refresh token). */
export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/** Les tokens ne sont jamais stockés en clair — seul le hash sha256 va en base. */
export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}
