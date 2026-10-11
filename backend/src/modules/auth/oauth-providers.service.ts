import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { encrypt, decrypt } from "../../lib/crypto.js";
import { httpError } from "../../lib/httpError.js";
import { logAudit, AUDIT_ACTIONS } from "../../lib/audit.js";
import * as repo from "./auth.repository.js";

/**
 * OAuth 2.0 « authorization code » générique pour Spotify et LinkedIn (GitHub garde son
 * service dédié, github-oauth.service.ts). Le token est stocké chiffré sous forme de JSON
 * { accessToken, refreshToken?, expiresAt? } dans oauth_accounts.access_token : pas de
 * migration de schéma, et Spotify (token d'1 h + refresh token) est supporté.
 */
export type OAuthProvider = "spotify" | "linkedin" | "gmail" | "outlook";
export const OAUTH_PROVIDERS: OAuthProvider[] = ["spotify", "linkedin", "gmail", "outlook"];

export function isOAuthProvider(name: string): name is OAuthProvider {
  return (OAUTH_PROVIDERS as string[]).includes(name);
}

interface ProviderConfig {
  authorizeUrl: string;
  tokenUrl: string;
  scope: string;
  clientId: () => string | undefined;
  clientSecret: () => string | undefined;
  /** Identité du compte lié → id fournisseur + libellé pour le journal d'audit. */
  identity: (accessToken: string) => Promise<{ id: string; label: string }>;
  basicAuthToken: boolean;
}

const PROVIDERS: Record<OAuthProvider, ProviderConfig> = {
  spotify: {
    authorizeUrl: "https://accounts.spotify.com/authorize",
    tokenUrl: "https://accounts.spotify.com/api/token",
    scope: "user-read-private user-read-currently-playing user-read-playback-state user-read-recently-played user-top-read",
    clientId: () => env.SPOTIFY_CLIENT_ID,
    clientSecret: () => env.SPOTIFY_CLIENT_SECRET,
    basicAuthToken: true,
    identity: async (token) => {
      const res = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        console.error("[oauth:spotify] /me failed", res.status, detail);
        if (res.status === 403 && /not be registered/i.test(detail)) {
          throw httpError(502, "OAUTH_USER_NOT_REGISTERED", "Spotify account not registered in the app's User Management");
        }
        if (res.status === 403 && /premium/i.test(detail)) {
          throw httpError(502, "OAUTH_PREMIUM_REQUIRED", "Spotify requires an active Premium subscription for the app owner");
        }
      }
      if (!res.ok) throw httpError(502, "OAUTH_EXCHANGE_FAILED", `Identité Spotify indisponible (${res.status})`);
      const me = (await res.json()) as { id: string; display_name?: string };
      return { id: me.id, label: me.display_name ?? me.id };
    },
  },
  linkedin: {
    authorizeUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    // « Sign In with LinkedIn using OpenID Connect » : seul produit accessible sans validation partenaire.
    scope: "openid profile email",
    clientId: () => env.LINKEDIN_CLIENT_ID,
    clientSecret: () => env.LINKEDIN_CLIENT_SECRET,
    basicAuthToken: false,
    identity: async (token) => {
      const res = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw httpError(502, "OAUTH_EXCHANGE_FAILED", `Identité LinkedIn indisponible (${res.status})`);
      const me = (await res.json()) as { sub: string; name?: string };
      return { id: me.sub, label: me.name ?? me.sub };
    },
  },
  gmail: {
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    // Même projet Google Cloud que "Se connecter avec Google" (GOOGLE_CLIENT_ID/SECRET) —
    // juste une App "Threshold" avec l'API Gmail activée en plus, pas de nouvelle app.
    scope: "https://www.googleapis.com/auth/gmail.readonly openid email",
    clientId: () => env.GOOGLE_CLIENT_ID,
    clientSecret: () => env.GOOGLE_CLIENT_SECRET,
    basicAuthToken: false,
    identity: async (token) => {
      const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw httpError(502, "OAUTH_EXCHANGE_FAILED", `Identité Google indisponible (${res.status})`);
      const me = (await res.json()) as { id: string; email?: string };
      return { id: me.id, label: me.email ?? me.id };
    },
  },
  outlook: {
    authorizeUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    scope: "openid email offline_access Mail.Read",
    clientId: () => env.OUTLOOK_CLIENT_ID,
    clientSecret: () => env.OUTLOOK_CLIENT_SECRET,
    basicAuthToken: false,
    identity: async (token) => {
      const res = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw httpError(502, "OAUTH_EXCHANGE_FAILED", `Identité Microsoft indisponible (${res.status})`);
      const me = (await res.json()) as { id: string; mail?: string; userPrincipalName?: string };
      return { id: me.id, label: me.mail ?? me.userPrincipalName ?? me.id };
    },
  },
};

export interface StoredToken {
  accessToken: string;
  refreshToken?: string;
  /** epoch ms */
  expiresAt?: number;
}

interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

function assertConfigured(provider: OAuthProvider): ProviderConfig {
  const cfg = PROVIDERS[provider];
  if (!cfg.clientId() || !cfg.clientSecret()) {
    throw httpError(
      503,
      "OAUTH_NOT_CONFIGURED",
      `${provider} OAuth is disabled. Set ${provider.toUpperCase()}_CLIENT_ID and ${provider.toUpperCase()}_CLIENT_SECRET to enable it.`,
    );
  }
  return cfg;
}

function redirectUri(provider: OAuthProvider): string {
  return `${env.APP_URL}/api/v1/auth/oauth/${provider}/callback`;
}

export function buildAuthorizeUrl(provider: OAuthProvider, userId: number): string {
  const cfg = assertConfigured(provider);
  const state = jwt.sign({ sub: userId, purpose: `${provider}-link` }, env.JWT_SECRET, { expiresIn: "10m" });
  const params = new URLSearchParams({
    client_id: cfg.clientId()!,
    response_type: "code",
    redirect_uri: redirectUri(provider),
    scope: cfg.scope,
    state,
  });
  // Spotify saute la page de consentement si elle a déjà été acceptée : on la force pour choisir le compte.
  if (provider === "spotify") params.set("show_dialog", "true");
  // LinkedIn : redemande l'identification pour pouvoir choisir un autre compte.
  if (provider === "linkedin") params.set("prompt", "login");
  // Gmail : Google ne renvoie un refresh_token qu'avec access_type=offline, et seulement
  // à la première autorisation — prompt=consent force l'écran à chaque liaison.
  if (provider === "gmail") {
    params.set("access_type", "offline");
    params.set("prompt", "consent");
  }
  // Outlook : laisse choisir un autre compte Microsoft à chaque liaison.
  if (provider === "outlook") params.set("prompt", "select_account");
  return `${cfg.authorizeUrl}?${params.toString()}`;
}

function verifyState(provider: OAuthProvider, state: string): number {
  try {
    const payload = jwt.verify(state, env.JWT_SECRET) as unknown as { sub: number; purpose: string };
    if (payload.purpose === `${provider}-link`) return payload.sub;
  } catch {
    /* tombe sur l'erreur ci-dessous */
  }
  throw httpError(400, "OAUTH_STATE_INVALID", "State OAuth invalide ou expiré");
}

async function requestToken(provider: OAuthProvider, form: Record<string, string>): Promise<StoredToken> {
  const cfg = assertConfigured(provider);
  const headers: Record<string, string> = { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" };
  const body = new URLSearchParams(form);
  if (cfg.basicAuthToken) {
    headers.Authorization = `Basic ${Buffer.from(`${cfg.clientId()}:${cfg.clientSecret()}`).toString("base64")}`;
  } else {
    body.set("client_id", cfg.clientId()!);
    body.set("client_secret", cfg.clientSecret()!);
  }
  const res = await fetch(cfg.tokenUrl, { method: "POST", headers, body, signal: AbortSignal.timeout(10_000) });
  const data = (await res.json().catch(() => ({}))) as TokenResponse;
  if (!res.ok || !data.access_token) {
    console.error(`[oauth:${provider}] token exchange failed`, res.status, data.error, data.error_description, `redirect_uri=${redirectUri(provider)}`);
    throw httpError(502, "OAUTH_EXCHANGE_FAILED", data.error_description ?? `Échange OAuth ${provider} échoué (${res.status})`);
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
  };
}

export async function completeLink(provider: OAuthProvider, code: string, state: string): Promise<void> {
  assertConfigured(provider);
  const userId = verifyState(provider, state);
  const token = await requestToken(provider, {
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri(provider),
  });
  const identity = await PROVIDERS[provider].identity(token.accessToken);
  await repo.upsertOAuthAccount(userId, provider, identity.id, encrypt(JSON.stringify(token)), PROVIDERS[provider].scope);
  void logAudit(userId, AUDIT_ACTIONS.OAUTH_LINKED, { provider, account: identity.label });
}

export async function isLinked(userId: number, provider: string): Promise<boolean> {
  return (await repo.findOAuthAccount(userId, provider)) !== null;
}

export async function unlink(userId: number, provider: string): Promise<void> {
  await repo.deleteOAuthAccount(userId, provider);
}

/** Token d'accès valide pour les adaptateurs ; rafraîchi (et re-stocké) s'il expire dans moins d'une minute. */
export async function getAccessToken(userId: number, provider: OAuthProvider): Promise<string> {
  const row = await repo.findOAuthAccount(userId, provider);
  if (!row) throw httpError(400, "SERVICE_OAUTH_REQUIRED", `Lie ton compte ${provider} pour utiliser ce widget`);

  let stored: StoredToken;
  try {
    stored = JSON.parse(decrypt(row.accessToken)) as StoredToken;
  } catch {
    throw httpError(400, "SERVICE_OAUTH_REQUIRED", `Reconnecte ton compte ${provider}`);
  }

  if (stored.expiresAt && stored.expiresAt - Date.now() < 60_000) {
    if (!stored.refreshToken) {
      throw httpError(400, "SERVICE_OAUTH_REQUIRED", `Session ${provider} expirée, reconnecte ton compte`);
    }
    const fresh = await requestToken(provider, { grant_type: "refresh_token", refresh_token: stored.refreshToken });
    stored = { ...fresh, refreshToken: fresh.refreshToken ?? stored.refreshToken };
    await repo.upsertOAuthAccount(userId, provider, row.providerUserId, encrypt(JSON.stringify(stored)), row.scope ?? undefined);
  }
  return stored.accessToken;
}

/**
 * Services liés par clé API collée par l'utilisateur plutôt que par redirection OAuth
 * (UptimeRobot n'expose pas de flux OAuth) — "credentials" au sens du sujet ("fill in
 * their username and password from their profile page"). Même table `oauth_accounts`
 * que les vrais fournisseurs OAuth (colonne access_token générique, chiffrée) : pas de
 * migration de schéma, `isLinked`/`unlink` déjà génériques fonctionnent tels quels.
 */
export type CredentialProvider = "uptimerobot";
export const CREDENTIAL_PROVIDERS: CredentialProvider[] = ["uptimerobot"];

export function isCredentialProvider(name: string): name is CredentialProvider {
  return (CREDENTIAL_PROVIDERS as string[]).includes(name);
}

export function isKnownProvider(name: string): boolean {
  return isOAuthProvider(name) || isCredentialProvider(name);
}

interface CredentialConfig {
  /** Valide la clé auprès du fournisseur et renvoie une identité à journaliser. */
  validate: (apiKey: string) => Promise<{ id: string; label: string }>;
}

const CREDENTIALS: Record<CredentialProvider, CredentialConfig> = {
  uptimerobot: {
    validate: async (apiKey) => {
      const res = await fetch("https://api.uptimerobot.com/v2/getAccountDetails", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
        body: new URLSearchParams({ api_key: apiKey, format: "json" }),
        signal: AbortSignal.timeout(10_000),
      });
      const data = (await res.json().catch(() => ({}))) as { stat?: string; account?: { email?: string } };
      if (data.stat !== "ok") throw httpError(400, "OAUTH_EXCHANGE_FAILED", "Clé API UptimeRobot invalide");
      const label = data.account?.email ?? "UptimeRobot";
      return { id: label, label };
    },
  },
};

export async function connectCredential(userId: number, provider: CredentialProvider, apiKey: string): Promise<void> {
  const identity = await CREDENTIALS[provider].validate(apiKey);
  await repo.upsertOAuthAccount(userId, provider, identity.id, encrypt(JSON.stringify({ accessToken: apiKey })), undefined);
  void logAudit(userId, AUDIT_ACTIONS.OAUTH_LINKED, { provider, account: identity.label });
}

/** Lit une clé API stockée — pas de notion d'expiration/refresh, contrairement à `getAccessToken`. */
export async function getStoredCredential(userId: number, provider: string): Promise<string> {
  const row = await repo.findOAuthAccount(userId, provider);
  if (!row) throw httpError(400, "SERVICE_OAUTH_REQUIRED", `Connecte ton compte ${provider} pour utiliser ce widget`);
  try {
    const stored = JSON.parse(decrypt(row.accessToken)) as { accessToken: string };
    return stored.accessToken;
  } catch {
    throw httpError(400, "SERVICE_OAUTH_REQUIRED", `Reconnecte ton compte ${provider}`);
  }
}
