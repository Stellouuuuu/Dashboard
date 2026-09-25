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

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw httpError(401, "AUTH_CURRENT_PASSWORD_INCORRECT", "Mot de passe incorrect");

  await repo.deleteUserById(userId);
}
