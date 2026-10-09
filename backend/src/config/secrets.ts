import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomBytes } from "node:crypto";

/**
 * Persist JWT_SECRET / CRYPTO_KEY across container restarts when they are not
 * provided via the environment. Files live under SECRETS_DIR (Docker volume
 * `/data/secrets` in compose; local fallback `.data/secrets`).
 */
function secretsDir(): string {
  if (process.env.SECRETS_DIR?.trim()) return process.env.SECRETS_DIR.trim();
  if (process.env.NODE_ENV === "production") return "/data/secrets";
  return join(process.cwd(), ".data", "secrets");
}

function readOrCreate(file: string, bytes: number, envName: string): string {
  const dir = secretsDir();
  mkdirSync(dir, { recursive: true });
  const path = join(dir, file);

  if (existsSync(path)) {
    const existing = readFileSync(path, "utf8").trim();
    if (existing) {
      console.log(`[secrets] Loaded ${envName} from ${path}`);
      return existing;
    }
  }

  const value = randomBytes(bytes).toString("hex");
  writeFileSync(path, value, { encoding: "utf8", mode: 0o600 });
  console.log(`[secrets] Generated ${envName} and saved to ${path}`);
  return value;
}

/** Fill process.env for missing secrets before Zod validation. */
export function ensureSecrets(): void {
  if (!process.env.JWT_SECRET?.trim()) {
    process.env.JWT_SECRET = readOrCreate("jwt_secret", 32, "JWT_SECRET");
  }
  if (!process.env.CRYPTO_KEY?.trim()) {
    process.env.CRYPTO_KEY = readOrCreate("crypto_key", 32, "CRYPTO_KEY");
  }
}
