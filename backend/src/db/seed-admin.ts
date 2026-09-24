import { randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db } from "./db.js";
import { users } from "./schema.js";
import { env } from "../config/env.js";

/**
 * Ensure a demo admin account exists.
 * - Email: ADMIN_EMAIL or admin@threshold.local
 * - Password: ADMIN_PASSWORD if set, otherwise a random one printed **once**
 *   to the logs when the account is created (never again on later boots).
 */
export async function seedAdmin(): Promise<void> {
  const email = env.ADMIN_EMAIL;
  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) {
    console.log(`[seed] Admin already present: ${email}`);
    return;
  }

  const generated = !env.ADMIN_PASSWORD;
  const password = env.ADMIN_PASSWORD ?? randomBytes(12).toString("base64url");
  const passwordHash = await bcrypt.hash(password, 12);

  await db.insert(users).values({
    email,
    passwordHash,
    role: "admin",
    emailConfirmed: true,
    name: "Admin",
  });

  console.log(`[seed] Demo admin created: ${email}`);
  if (generated) {
    console.log("══════════════════════════════════════════════════════");
    console.log(`  DEMO ADMIN PASSWORD (shown once): ${password}`);
    console.log("  Change it after first login. It will not be printed again.");
    console.log("══════════════════════════════════════════════════════");
  }
}
