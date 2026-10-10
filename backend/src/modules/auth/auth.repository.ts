import { db } from "../../db/db.js";
import { users, emailTokens, refreshTokens, oauthAccounts, userServices } from "../../db/schema.js";
import { eq, and, gt } from "drizzle-orm";

export type UserRow = typeof users.$inferSelect;

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const [row] = await db.select().from(users).where(eq(users.email, email));
  return row ?? null;
}

export async function findUserById(id: number): Promise<UserRow | null> {
  const [row] = await db.select().from(users).where(eq(users.id, id));
  return row ?? null;
}

export async function findUserByGoogleId(googleId: string): Promise<UserRow | null> {
  const [row] = await db.select().from(users).where(eq(users.googleId, googleId));
  return row ?? null;
}

/** Compte créé via "Se connecter avec Google" — pas de mot de passe, email déjà vérifié par Google. */
export async function createUserFromGoogle(
  email: string,
  googleId: string,
  name: string | undefined,
  language: string,
): Promise<UserRow> {
  const [row] = await db
    .insert(users)
    .values({ email, googleId, name, language, emailConfirmed: true })
    .returning();
  return row;
}

export async function linkGoogleId(userId: number, googleId: string): Promise<void> {
  await db.update(users).set({ googleId }).where(eq(users.id, userId));
}

export async function unlinkGoogleId(userId: number): Promise<void> {
  await db.update(users).set({ googleId: null }).where(eq(users.id, userId));
}

export async function createUser(
  email: string,
  passwordHash: string,
  language: string,
  name: string,
): Promise<UserRow> {
  const [row] = await db.insert(users).values({ email, passwordHash, language, name }).returning();
  return row;
}

export async function confirmUser(userId: number): Promise<void> {
  await db.update(users).set({ emailConfirmed: true }).where(eq(users.id, userId));
}

export async function updatePasswordHash(userId: number, passwordHash: string): Promise<void> {
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}

export async function updateName(userId: number, name: string): Promise<UserRow> {
  const [row] = await db.update(users).set({ name }).where(eq(users.id, userId)).returning();
  return row;
}

export async function updateLanguage(userId: number, language: string): Promise<void> {
  await db.update(users).set({ language }).where(eq(users.id, userId));
}

export async function deleteUserById(userId: number): Promise<void> {
  await db.delete(users).where(eq(users.id, userId));
}

export type EmailTokenPurpose = "confirm" | "reset";

export async function createEmailToken(
  userId: number,
  purpose: EmailTokenPurpose,
  tokenHash: string,
  expiresAt: Date,
): Promise<void> {
  await db.delete(emailTokens).where(and(eq(emailTokens.userId, userId), eq(emailTokens.purpose, purpose)));
  await db.insert(emailTokens).values({ userId, purpose, tokenHash, expiresAt });
}

export async function findValidEmailToken(tokenHash: string, purpose: EmailTokenPurpose) {
  const [row] = await db
    .select()
    .from(emailTokens)
    .where(
      and(
        eq(emailTokens.tokenHash, tokenHash),
        eq(emailTokens.purpose, purpose),
        gt(emailTokens.expiresAt, new Date()),
      ),
    );
  return row ?? null;
}

export async function deleteEmailTokensForUser(
  userId: number,
  purpose?: EmailTokenPurpose,
): Promise<void> {
  if (purpose) {
    await db
      .delete(emailTokens)
      .where(and(eq(emailTokens.userId, userId), eq(emailTokens.purpose, purpose)));
    return;
  }
  await db.delete(emailTokens).where(eq(emailTokens.userId, userId));
}

export async function createRefreshToken(
  userId: number,
  tokenHash: string,
  expiresAt: Date,
): Promise<void> {
  await db.insert(refreshTokens).values({ userId, tokenHash, expiresAt });
}

export async function findValidRefreshToken(tokenHash: string) {
  const [row] = await db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.tokenHash, tokenHash),
        eq(refreshTokens.revoked, false),
        gt(refreshTokens.expiresAt, new Date()),
      ),
    );
  return row ?? null;
}

export async function revokeRefreshToken(tokenHash: string): Promise<void> {
  await db.update(refreshTokens).set({ revoked: true }).where(eq(refreshTokens.tokenHash, tokenHash));
}

export async function findOAuthAccount(userId: number, provider: string) {
  const [row] = await db
    .select()
    .from(oauthAccounts)
    .where(and(eq(oauthAccounts.userId, userId), eq(oauthAccounts.provider, provider)));
  return row ?? null;
}

/** Lie (ou relie) un compte tiers à l'utilisateur — un seul compte par provider (PLAN.md §10, piège 4). */
export async function upsertOAuthAccount(
  userId: number,
  provider: string,
  providerUserId: string,
  encryptedAccessToken: string,
  scope: string | undefined,
): Promise<void> {
  const existing = await findOAuthAccount(userId, provider);
  if (existing) {
    await db
      .update(oauthAccounts)
      .set({ providerUserId, accessToken: encryptedAccessToken, scope })
      .where(eq(oauthAccounts.id, existing.id));
  } else {
    await db.insert(oauthAccounts).values({
      userId,
      provider,
      providerUserId,
      accessToken: encryptedAccessToken,
      scope,
    });
  }
}

export async function deleteOAuthAccount(userId: number, provider: string): Promise<void> {
  await db
    .delete(oauthAccounts)
    .where(and(eq(oauthAccounts.userId, userId), eq(oauthAccounts.provider, provider)));
  // Perdre le lien OAuth invalide l'abonnement au service correspondant (ex: github).
  await db
    .delete(userServices)
    .where(and(eq(userServices.userId, userId), eq(userServices.serviceName, provider)));
}
