import { env } from "../config/env.js";

type SecurityConfig = { repository: string; severity?: string };

type SecurityAlert = {
  number: number;
  state: string;
  dependency: { package: { name: string } };
  security_advisory: {
    summary: string;
    severity: string;
    cve_id: string | null;
  };
  html_url: string;
  created_at: string;
};

type AlertResult = {
  number: number;
  package: string;
  summary: string;
  severity: string;
  cve: string | null;
  url: string;
  createdAt: string;
};

/**
 * Adaptateur security_alerts – Membre B
 * Récupère les alertes Dependabot d'un repo GitHub
 * Paramètres : repository ("owner/repo"), severity (optionnel : "low"|"medium"|"high"|"critical")
 */
export async function fetchSecurityAlerts(
  config: SecurityConfig
): Promise<AlertResult[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (env.GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${env.GITHUB_TOKEN}`;
  }

  const url = `https://api.github.com/repos/${config.repository}/dependabot/alerts?state=open&per_page=30`;

  const res = await fetch(url, { headers });

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

  const alerts: SecurityAlert[] = await res.json();

  const filtered = config.severity
    ? alerts.filter(
        (a) =>
          a.security_advisory.severity.toLowerCase() ===
          config.severity!.toLowerCase()
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
