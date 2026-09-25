import type { Request, Response } from "express";
import { env } from "../../config/env.js";
import * as service from "./auth.service.js";
import * as githubOAuth from "./github-oauth.service.js";

function sendError(res: Response, err: any) {
  res.status(err.status ?? 500).json({ error: err.message, code: err.code ?? "INTERNAL_ERROR" });
}

const SECURE_COOKIES = env.APP_URL.startsWith("https");
const ACCESS_COOKIE_MAX_AGE = 15 * 60 * 1000; // 15 min, aligné sur l'expiration du JWT
const REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 jours

// SameSite=Lax (pas Strict) : sinon le cookie n'est pas renvoyé au retour du callback
// OAuth GitHub, qui est une navigation cross-site (PLAN.md §10, piège 3).
function setAccessCookie(res: Response, token: string) {
  res.cookie("access_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: SECURE_COOKIES,
    maxAge: ACCESS_COOKIE_MAX_AGE,
    path: "/",
  });
}

function setRefreshCookie(res: Response, token: string) {
  res.cookie("refresh_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: SECURE_COOKIES,
    maxAge: REFRESH_COOKIE_MAX_AGE,
    path: "/api/v1/auth",
  });
}

function clearAuthCookies(res: Response) {
  res.clearCookie("access_token", { path: "/" });
  res.clearCookie("refresh_token", { path: "/api/v1/auth" });
}

export async function register(req: Request, res: Response) {
  const { email, password, language } = req.body;
  try {
    await service.register(email, password, language);
    res.status(201).json({ message: "Compte créé, vérifie ta boîte mail pour confirmer." });
  } catch (err: any) {
    sendError(res, err);
  }
}

export async function confirm(req: Request, res: Response) {
  const { token } = req.body;
  try {
    await service.confirmEmail(token);
    res.json({ message: "Email confirmé, tu peux te connecter." });
  } catch (err: any) {
    sendError(res, err);
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  try {
    const { user, accessToken, refreshToken } = await service.login(email, password);
    setAccessCookie(res, accessToken);
    setRefreshCookie(res, refreshToken);
    res.json({ user: service.toPublicUser(user) });
  } catch (err: any) {
    sendError(res, err);
  }
}

export async function refresh(req: Request, res: Response) {
  const raw = req.cookies?.refresh_token;
  if (!raw)
    return res.status(401).json({ error: "Aucune session à rafraîchir", code: "AUTH_SESSION_EXPIRED" });
  try {
    const { accessToken } = await service.refresh(raw);
    setAccessCookie(res, accessToken);
    res.json({ ok: true });
  } catch (err: any) {
    sendError(res, err);
  }
}

export async function logout(req: Request, res: Response) {
  await service.logout(req.cookies?.refresh_token);
  clearAuthCookies(res);
  res.status(204).send();
}

export async function me(req: Request, res: Response) {
  try {
    const user = await service.getMe(req.userId!);
    res.json(service.toPublicUser(user));
  } catch (err: any) {
    sendError(res, err);
  }
}

/** GET /api/v1/auth/oauth/github — redirige vers GitHub avec un state signé (requireAuth). */
export async function oauthGithubStart(req: Request, res: Response) {
  try {
    const url = githubOAuth.buildAuthorizeUrl(req.userId!);
    res.redirect(url);
  } catch (err: any) {
    sendError(res, err);
  }
}

/**
 * GET /api/v1/auth/oauth/github/callback — pas de requireAuth : l'identité vient
 * du `state` signé, pas du cookie de session (PLAN.md §10, pièges 3 et 4).
 */
export async function oauthGithubCallback(req: Request, res: Response) {
  const { code, state } = req.query;
  if (typeof code !== "string" || typeof state !== "string") {
    return res.status(400).json({ error: "Paramètres OAuth manquants", code: "OAUTH_STATE_INVALID" });
  }
  try {
    await githubOAuth.completeLink(code, state);
    res.redirect(`${env.APP_URL}/services?github=linked`);
  } catch (err: any) {
    res.redirect(`${env.APP_URL}/services?github=error`);
  }
}

export async function oauthGithubUnlink(req: Request, res: Response) {
  await githubOAuth.unlink(req.userId!);
  res.status(204).send();
}

export async function changePassword(req: Request, res: Response) {
  const { currentPassword, newPassword } = req.body;
  try {
    await service.changePassword(req.userId!, currentPassword, newPassword);
    res.status(204).send();
  } catch (err: any) {
    sendError(res, err);
  }
}

export async function setLanguage(req: Request, res: Response) {
  const { language } = req.body;
  try {
    await service.setLanguage(req.userId!, language);
    res.status(204).send();
  } catch (err: any) {
    sendError(res, err);
  }
}

export async function updateProfile(req: Request, res: Response) {
  const { name } = req.body;
  try {
    const user = await service.updateName(req.userId!, name);
    res.json(service.toPublicUser(user));
  } catch (err: any) {
    sendError(res, err);
  }
}

export async function deleteAccount(req: Request, res: Response) {
  const { password } = req.body;
  try {
    await service.deleteAccount(req.userId!, password);
    await service.logout(req.cookies?.refresh_token);
    clearAuthCookies(res);
    res.status(204).send();
  } catch (err: any) {
    sendError(res, err);
  }
}
