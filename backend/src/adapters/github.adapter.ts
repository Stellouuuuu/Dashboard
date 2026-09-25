import { eq, and } from "drizzle-orm";
import { env } from "../config/env.js";
import { db } from "../db/db.js";
import { oauthAccounts } from "../db/schema.js";
import { decrypt } from "../lib/crypto.js";
import { httpError } from "../lib/httpError.js";
import type { WidgetContext } from "../widgets/registry.js";

interface SecurityAlertsConfig {
  repository: string;
  severity?: string;
}

// Aligné sur les noms de paramètres du sujet : "repository" (owner/repo) et "limit".
interface RecentCommitsConfig {
  repository: string;
  limit: number;
}

interface GithubCommit {
  sha: string;
  commit: { message: string; author: { name: string; date: string } };
  html_url: string;
}

export interface CommitSummary {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

/**
 * Token GitHub à utiliser pour un widget : celui de l'utilisateur s'il a lié son
 * compte via OAuth (PLAN.md §10, autorisation déléguée aux widgets). Sans compte lié,
 * le widget échoue explicitement en production (compte requis) ; en développement
 * uniquement, on retombe sur le token serveur optionnel (`GITHUB_TOKEN`) pour ne pas
 * bloquer le dev sans OAuth App GitHub configurée.
 */
async function resolveGithubToken(userId: number): Promise<string | undefined> {
  const [row] = await db
    .select()
    .from(oauthAccounts)
    .where(and(eq(oauthAccounts.userId, userId), eq(oauthAccounts.provider, "github")));
  if (row) return decrypt(row.accessToken);
  if (env.NODE_ENV !== "production") return env.GITHUB_TOKEN;
  throw httpError(400, "SERVICE_OAUTH_REQUIRED", "Lie ton compte GitHub pour utiliser ce widget");
}

function githubHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

/** Adaptateur recent_commits — derniers commits d'un dépôt public (PLAN.md §5). */
export async function fetchRecentCommits(
  config: RecentCommitsConfig,
  ctx: WidgetContext,
): Promise<CommitSummary[]> {
  const limit = Math.min(Math.max(config.limit, 1), 20);
  const token = await resolveGithubToken(ctx.userId);
  const url = `https://api.github.com/repos/${config.repository}/commits?per_page=${limit}`;
  const res = await fetch(url, { headers: githubHeaders(token) });

  if (res.status === 404) throw new Error(`Dépôt introuvable: ${config.repository}`);
  if (!res.ok) throw new Error(`GitHub API error ${res.status}: ${await res.text()}`);

  const commits = (await res.json()) as GithubCommit[];
  return commits.map((c) => ({
    sha: c.sha.slice(0, 7),
    message: c.commit.message.split("\n")[0],
    author: c.commit.author.name,
    date: c.commit.author.date,
    url: c.html_url,
  }));
}

interface GithubDependabotAlert {
  number: number;
  html_url: string;
  created_at: string;
  dependency: { package: { name: string } };
  security_advisory: { summary: string; severity: string; cve_id: string | null };
}

export interface SecurityAlertSummary {
  number: number;
  package: string;
  summary: string;
  severity: string;
  cve: string | null;
  url: string;
  createdAt: string;
}

/**
 * Adaptateur security_alerts – Membre B
 * Récupère les alertes Dependabot d'un repo GitHub
 * Paramètres : repository ("owner/repo"), severity (optionnel : "low"|"medium"|"high"|"critical")
 */
export async function fetchSecurityAlerts(
  config: SecurityAlertsConfig,
  ctx: WidgetContext,
): Promise<SecurityAlertSummary[]> {
  const token = await resolveGithubToken(ctx.userId);
  const url = `https://api.github.com/repos/${config.repository}/dependabot/alerts?state=open&per_page=30`;
  const res = await fetch(url, { headers: githubHeaders(token) });

  // 404 = repo not found ou pas d'accès
  if (res.status === 404) {
    return [];
  }
  // 403 = Dependabot non activé sur ce repo (repos publics souvent sans Dependabot)
  if (res.status === 403) {
    return [];
  }
  if (!res.ok) {
    throw new Error(`GitHub API error ${res.status}: ${await res.text()}`);
  }

  const alerts = (await res.json()) as GithubDependabotAlert[];
  const filtered = config.severity
    ? alerts.filter(
        (a) => a.security_advisory.severity.toLowerCase() === config.severity!.toLowerCase(),
      )
    : alerts;

  return filtered.map((a) => ({
    number: a.number,
    package: a.dependency.package.name,
    summary: a.security_advisory.summary,
    severity: a.security_advisory.severity,
    cve: a.security_advisory.cve_id,
    url: a.html_url,
    createdAt: a.created_at,
  }));
}
