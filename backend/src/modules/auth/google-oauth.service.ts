import jwt from "jsonwebtoken";
import { env, isGoogleOAuthConfigured } from "../../config/env.js";
import { httpError } from "../../lib/httpError.js";

const STATE_TTL = "10m";
const CALLBACK_PATH = "/api/v1/auth/oauth/google/callback";
const SCOPE = "openid email profile";

// "google-login" : flux connexion/inscription (pas de session requise au départ).
// "google-link" : un utilisateur déjà connecté lie son compte Google depuis Services
// (demande explicite : "meme si l'user ne le fait pas depuis l'inscription, il peut
// connecter ça depuis services").
interface GoogleStatePayload {
  purpose: "google-login" | "google-link";
  sub?: number; // présent seulement pour "google-link"
}

interface GoogleTokenResponse {
  access_token?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
}

export interface GoogleProfile {
  sub: string;
  email: string;
  emailVerified: boolean;
  name?: string;
}

interface GoogleUserInfoResponse {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
}

function assertConfigured(): void {
  if (!isGoogleOAuthConfigured) {
    throw httpError(
      503,
      "AUTH_GOOGLE_NOT_CONFIGURED",
      "Google sign-in is disabled. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable it.",
    );
  }
}

function redirectUri(): string {
  return `${env.APP_URL}${CALLBACK_PATH}`;
}

/**
 * `linkUserId` présent → l'utilisateur est déjà connecté et veut juste lier son
 * compte Google (depuis Services) ; absent → flux connexion/inscription classique.
 */
export function buildAuthorizeUrl(linkUserId?: number): string {
  assertConfigured();
  const payload: GoogleStatePayload = linkUserId
    ? { purpose: "google-link", sub: linkUserId }
    : { purpose: "google-login" };
  const state = jwt.sign(payload, env.JWT_SECRET, { expiresIn: STATE_TTL });
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: SCOPE,
    state,
    // "consent" force Google à redemander l'accord à chaque fois plutôt que de
    // silencieusement réutiliser une session Google déjà ouverte dans le navigateur
    // — utile en dev/démo pour pouvoir re-tester le flux avec le même compte Google.
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

function verifyState(state: string): GoogleStatePayload {
  try {
    return jwt.verify(state, env.JWT_SECRET) as unknown as GoogleStatePayload;
  } catch {
    throw httpError(400, "OAUTH_STATE_INVALID", "State OAuth invalide ou expiré");
  }
}

async function exchangeCodeForToken(code: string): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID!,
      client_secret: env.GOOGLE_CLIENT_SECRET!,
      code,
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw httpError(502, "OAUTH_EXCHANGE_FAILED", `Échange du code OAuth Google échoué (${res.status})`);
  const data = (await res.json()) as GoogleTokenResponse;
  if (!data.access_token) {
    throw httpError(502, "OAUTH_EXCHANGE_FAILED", data.error_description ?? "Google n'a pas renvoyé de token");
  }
  return data.access_token;
}

async function fetchGoogleProfile(accessToken: string): Promise<GoogleProfile> {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok)
    throw httpError(502, "OAUTH_EXCHANGE_FAILED", `Impossible de récupérer l'identité Google (${res.status})`);
  const data = (await res.json()) as GoogleUserInfoResponse;
  if (!data.email) throw httpError(502, "OAUTH_EXCHANGE_FAILED", "Google n'a pas renvoyé d'email");
  return { sub: data.sub, email: data.email, emailVerified: Boolean(data.email_verified), name: data.name };
}

/** Échange le code contre le profil Google + le `state` décodé (purpose/sub). */
export async function completeAuth(
  code: string,
  state: string,
): Promise<{ profile: GoogleProfile; statePayload: GoogleStatePayload }> {
  assertConfigured();
  const statePayload = verifyState(state);
  const accessToken = await exchangeCodeForToken(code);
  const profile = await fetchGoogleProfile(accessToken);
  return { profile, statePayload };
}
