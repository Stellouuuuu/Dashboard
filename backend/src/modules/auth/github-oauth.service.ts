import jwt from "jsonwebtoken";
import { env, isGithubOAuthConfigured } from "../../config/env.js";
import { encrypt } from "../../lib/crypto.js";
import { httpError } from "../../lib/httpError.js";
import { logAudit, AUDIT_ACTIONS } from "../../lib/audit.js";
import * as repo from "./auth.repository.js";

const STATE_TTL = "10m";
const CALLBACK_PATH = "/api/v1/auth/oauth/github/callback";
// read:user = identité ; repo = commits (dépôts privés inclus) ; security_events = alertes Dependabot
const SCOPE = "read:user repo security_events";

interface GithubStatePayload {
  sub: number;
  purpose: "github-link";
}

interface GithubTokenResponse {
  access_token?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

interface GithubUserResponse {
  id: number;
  login: string;
}

function assertConfigured(): void {
  if (!isGithubOAuthConfigured) {
    throw httpError(
      503,
      "OAUTH_NOT_CONFIGURED",
      "GitHub OAuth is disabled. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to enable it.",
    );
  }
}

function redirectUri(): string {
  return `${env.APP_URL}${CALLBACK_PATH}`;
}

/**
 * `state` signé (JWT, 10 min) contenant l'utilisateur qui initie la liaison —
 * PLAN.md §10, piège 4 : c'est ce qui permet de lier le bon compte au callback,
 * indépendamment du cookie de session (qui peut ne pas survivre au retour cross-site).
 */
export function buildAuthorizeUrl(userId: number): string {
  assertConfigured();
  const state = jwt.sign({ sub: userId, purpose: "github-link" } satisfies GithubStatePayload, env.JWT_SECRET, {
    expiresIn: STATE_TTL,
  });
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID!,
    redirect_uri: redirectUri(),
    scope: SCOPE,
    state,
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

function verifyState(state: string): number {
  let payload: GithubStatePayload;
  try {
    payload = jwt.verify(state, env.JWT_SECRET) as unknown as GithubStatePayload;
  } catch {
    throw httpError(400, "OAUTH_STATE_INVALID", "State OAuth invalide ou expiré");
  }
  if (payload.purpose !== "github-link") {
    throw httpError(400, "OAUTH_STATE_INVALID", "State OAuth invalide");
  }
  return payload.sub;
}

async function exchangeCodeForToken(code: string): Promise<{ accessToken: string; scope?: string }> {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri(),
    }),
  });
  if (!res.ok) throw httpError(502, "OAUTH_EXCHANGE_FAILED", `Échange du code OAuth GitHub échoué (${res.status})`);
  const data = (await res.json()) as GithubTokenResponse;
  if (!data.access_token) {
    throw httpError(502, "OAUTH_EXCHANGE_FAILED", data.error_description ?? "GitHub n'a pas renvoyé de token");
  }
  return { accessToken: data.access_token, scope: data.scope };
}

async function fetchGithubIdentity(accessToken: string): Promise<GithubUserResponse> {
  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok)
    throw httpError(502, "OAUTH_EXCHANGE_FAILED", `Impossible de récupérer l'identité GitHub (${res.status})`);
  return (await res.json()) as GithubUserResponse;
}

/** Callback OAuth complet : vérifie le state, échange le code, chiffre et lie le token (PLAN.md §10). */
export async function completeLink(code: string, state: string): Promise<{ userId: number; login: string }> {
  assertConfigured();
  const userId = verifyState(state);
  const { accessToken, scope } = await exchangeCodeForToken(code);
  const identity = await fetchGithubIdentity(accessToken);

  await repo.upsertOAuthAccount(userId, "github", String(identity.id), encrypt(accessToken), scope);
  void logAudit(userId, AUDIT_ACTIONS.OAUTH_GITHUB_LINKED, { login: identity.login });

  return { userId, login: identity.login };
}

export async function isLinked(userId: number): Promise<boolean> {
  const row = await repo.findOAuthAccount(userId, "github");
  return row !== null;
}

export async function unlink(userId: number): Promise<void> {
  await repo.deleteOAuthAccount(userId, "github");
}
