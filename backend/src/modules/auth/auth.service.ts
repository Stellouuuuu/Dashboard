import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { generateToken, generateOtpCode, hashToken } from "../../lib/token.js";
import { sendMail } from "../../lib/mailer.js";
import { confirmEmailContent, resetEmailContent } from "../../lib/emailTemplates.js";
import { httpError } from "../../lib/httpError.js";
import { logAudit, AUDIT_ACTIONS } from "../../lib/audit.js";
import * as repo from "./auth.repository.js";
import type { UserRow } from "./auth.repository.js";
import type { GoogleProfile } from "./google-oauth.service.js";

const OTP_TTL_MS = 15 * 60 * 1000; // 15 min
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30j
const ACCESS_TOKEN_TTL = "15m";

export function toPublicUser(user: UserRow) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    emailConfirmed: user.emailConfirmed,
    language: user.language,
    createdAt: user.createdAt,
    hasPassword: Boolean(user.passwordHash),
    googleLinked: Boolean(user.googleId),
  };
}

function signAccessToken(user: UserRow): string {
  return jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

async function issueRefreshToken(userId: number): Promise<string> {
  const raw = generateToken();
  await repo.createRefreshToken(userId, hashToken(raw), new Date(Date.now() + REFRESH_TOKEN_TTL_MS));
  return raw;
}

async function issueAndSendOtp(
  user: UserRow,
  purpose: "confirm" | "reset",
): Promise<void> {
  const code = generateOtpCode();
  await repo.createEmailToken(user.id, purpose, hashToken(code), new Date(Date.now() + OTP_TTL_MS));
  const content = purpose === "confirm" ? confirmEmailContent(user.language) : resetEmailContent(user.language);
  await sendMail(user.email, content.subject, content.html(code));
}

/** Inscription : hash bcrypt (coût 12), compte non confirmé, code OTP 6 chiffres par email. */
export async function register(
  email: string,
  password: string,
  language: string = "fr",
  name: string,
): Promise<void> {
  const existing = await repo.findUserByEmail(email);
  if (existing) throw httpError(409, "AUTH_EMAIL_TAKEN", "Un compte existe déjà avec cet email");

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await repo.createUser(email, passwordHash, language, name);
  await issueAndSendOtp(user, "confirm");
}

/** Renvoie un nouveau code de confirmation (compte existant non confirmé). */
export async function resendConfirmCode(email: string): Promise<void> {
  const user = await repo.findUserByEmail(email);
  // Réponse neutre : on ne révèle pas si l'email existe.
  if (!user || user.emailConfirmed) return;
  await issueAndSendOtp(user, "confirm");
}

/** Confirmation d'email : consomme le code OTP, active le compte. */
export async function confirmEmail(email: string, code: string): Promise<void> {
  const user = await repo.findUserByEmail(email);
  if (!user) throw httpError(400, "AUTH_CONFIRM_TOKEN_INVALID", "Code invalide ou expiré");

  const row = await repo.findValidEmailToken(hashToken(code), "confirm");
  if (!row || row.userId !== user.id) {
    throw httpError(400, "AUTH_CONFIRM_TOKEN_INVALID", "Code invalide ou expiré");
  }

  await repo.confirmUser(user.id);
  await repo.deleteEmailTokensForUser(user.id, "confirm");
}

/**
 * Mot de passe oublié : envoie un code OTP si le compte existe et est confirmé.
 * Toujours silencieux (pas d'énumération d'emails).
 */
export async function forgotPassword(email: string): Promise<void> {
  const user = await repo.findUserByEmail(email);
  if (!user || !user.emailConfirmed || user.suspended) return;
  await issueAndSendOtp(user, "reset");
}

/** Réinitialisation avec le code OTP reçu par email. */
export async function resetPassword(email: string, code: string, newPassword: string): Promise<void> {
  const user = await repo.findUserByEmail(email);
  if (!user) throw httpError(400, "AUTH_RESET_TOKEN_INVALID", "Code invalide ou expiré");

  const row = await repo.findValidEmailToken(hashToken(code), "reset");
  if (!row || row.userId !== user.id) {
    throw httpError(400, "AUTH_RESET_TOKEN_INVALID", "Code invalide ou expiré");
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await repo.updatePasswordHash(user.id, passwordHash);
  await repo.deleteEmailTokensForUser(user.id, "reset");
}

/** Connexion : refuse si email non confirmé ou compte suspendu (PLAN.md §6.1). */
export async function login(
  email: string,
  password: string,
): Promise<{ user: UserRow; accessToken: string; refreshToken: string }> {
  const user = await repo.findUserByEmail(email);
  if (!user) throw httpError(401, "AUTH_INVALID_CREDENTIALS", "Identifiants invalides");
  if (!user.passwordHash) throw httpError(401, "AUTH_NO_PASSWORD_SET", "Ce compte se connecte via Google");

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw httpError(401, "AUTH_INVALID_CREDENTIALS", "Identifiants invalides");

  if (!user.emailConfirmed)
    throw httpError(403, "AUTH_EMAIL_NOT_CONFIRMED", "Confirme ton email avant de te connecter");
  if (user.suspended) throw httpError(403, "AUTH_ACCOUNT_SUSPENDED", "Ce compte a été suspendu");

  const accessToken = signAccessToken(user);
  const refreshToken = await issueRefreshToken(user.id);
  void logAudit(user.id, AUDIT_ACTIONS.AUTH_LOGIN);
  return { user, accessToken, refreshToken };
}

/**
 * Connexion/inscription via Google : retrouve le compte lié, ou le rattache à un
 * compte existant de même email (si l'email Google est vérifié), ou en crée un.
 * Émet les mêmes tokens de session qu'un login classique.
 */
export async function loginWithGoogle(
  profile: GoogleProfile,
  language: string,
): Promise<{ user: UserRow; accessToken: string; refreshToken: string }> {
  let user = await repo.findUserByGoogleId(profile.sub);

  if (!user) {
    const existing = await repo.findUserByEmail(profile.email);
    if (existing) {
      if (!profile.emailVerified) {
        throw httpError(
          403,
          "AUTH_GOOGLE_EMAIL_UNVERIFIED",
          "L'email Google n'est pas vérifié, impossible de le rattacher à un compte existant",
        );
      }
      await repo.linkGoogleId(existing.id, profile.sub);
      user = { ...existing, googleId: profile.sub };
      void logAudit(user.id, AUDIT_ACTIONS.OAUTH_GOOGLE_LINKED, { email: profile.email });
    } else {
      user = await repo.createUserFromGoogle(profile.email, profile.sub, profile.name, language);
    }
  }

  if (user.suspended) throw httpError(403, "AUTH_ACCOUNT_SUSPENDED", "Ce compte a été suspendu");

  const accessToken = signAccessToken(user);
  const refreshToken = await issueRefreshToken(user.id);
  void logAudit(user.id, AUDIT_ACTIONS.AUTH_LOGIN, { via: "google" });
  return { user, accessToken, refreshToken };
}

/** Lie Google à un compte déjà connecté (depuis Services), sans toucher à la session en cours. */
export async function linkGoogleAccount(userId: number, profile: GoogleProfile): Promise<void> {
  const existing = await repo.findUserByGoogleId(profile.sub);
  if (existing && existing.id !== userId) {
    throw httpError(409, "AUTH_GOOGLE_ALREADY_LINKED", "Ce compte Google est déjà lié à un autre utilisateur");
  }
  await repo.linkGoogleId(userId, profile.sub);
  void logAudit(userId, AUDIT_ACTIONS.OAUTH_GOOGLE_LINKED, { email: profile.email });
}

/** Délie Google — refusé si c'est l'unique moyen de connexion du compte (pas de mot de passe). */
export async function unlinkGoogleAccount(userId: number): Promise<void> {
  const user = await repo.findUserById(userId);
  if (!user) throw httpError(404, "AUTH_USER_NOT_FOUND", "Utilisateur introuvable");
  if (!user.passwordHash) {
    throw httpError(
      400,
      "AUTH_GOOGLE_UNLINK_REQUIRES_PASSWORD",
      "Définis d'abord un mot de passe avant de délier Google, sinon tu perds l'accès à ton compte",
    );
  }
  await repo.unlinkGoogleId(userId);
}

/** Nouveau access token à partir du refresh cookie — pas de rotation (PLAN.md §6.1). */
export async function refresh(rawRefreshToken: string): Promise<{ accessToken: string }> {
  const row = await repo.findValidRefreshToken(hashToken(rawRefreshToken));
  if (!row) throw httpError(401, "AUTH_SESSION_EXPIRED", "Session expirée, reconnecte-toi");

  const user = await repo.findUserById(row.userId);
  if (!user || user.suspended)
    throw httpError(401, "AUTH_SESSION_EXPIRED", "Session expirée, reconnecte-toi");

  return { accessToken: signAccessToken(user) };
}

export async function logout(rawRefreshToken: string | undefined): Promise<void> {
  if (!rawRefreshToken) return;
  await repo.revokeRefreshToken(hashToken(rawRefreshToken));
}

export async function getMe(userId: number): Promise<UserRow> {
  const user = await repo.findUserById(userId);
  if (!user) throw httpError(404, "AUTH_USER_NOT_FOUND", "Utilisateur introuvable");
  return user;
}

/** Changement de mot de passe : exige le mot de passe actuel (PLAN.md §11). */
export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await repo.findUserById(userId);
  if (!user) throw httpError(404, "AUTH_USER_NOT_FOUND", "Utilisateur introuvable");
  if (!user.passwordHash) throw httpError(401, "AUTH_NO_PASSWORD_SET", "Ce compte se connecte via Google");

  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) throw httpError(401, "AUTH_CURRENT_PASSWORD_INCORRECT", "Mot de passe actuel incorrect");

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await repo.updatePasswordHash(userId, passwordHash);
}

/** Mémorise la langue choisie sur le compte (PLAN.md — persistance i18n). */
export async function setLanguage(userId: number, language: "fr" | "en"): Promise<void> {
  await repo.updateLanguage(userId, language);
}

/** Met à jour le nom affiché du compte (PATCH /auth/profile — réellement persisté, pas simulé). */
export async function updateName(userId: number, name: string): Promise<UserRow> {
  return repo.updateName(userId, name);
}

/** Suppression du compte : exige le mot de passe, révoque la session en cours. */
export async function deleteAccount(userId: number, password: string): Promise<void> {
  const user = await repo.findUserById(userId);
  if (!user) throw httpError(404, "AUTH_USER_NOT_FOUND", "Utilisateur introuvable");

  // Compte Google sans mot de passe : la session valide suffit comme preuve d'identité,
  // il n'y a rien à comparer.
  if (user.passwordHash) {
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw httpError(401, "AUTH_CURRENT_PASSWORD_INCORRECT", "Mot de passe incorrect");
  }

  await repo.deleteUserById(userId);
}
