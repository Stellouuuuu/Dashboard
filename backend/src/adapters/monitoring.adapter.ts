import { getStoredCredential } from "../modules/auth/oauth-providers.service.js";
import type { WidgetContext } from "../widgets/registry.js";

export const UPTIME_PERIODS = ["1", "7", "30"] as const;

export interface MonitorStatus {
  name: string;
  url: string;
  status: string;
  uptimeRatio: number;
  period: string;
}

interface UptimeRobotMonitor {
  friendly_name: string;
  url: string;
  status: number;
  custom_uptime_ratio?: string;
}

interface UptimeRobotMonitorsResponse {
  stat: string;
  monitors?: UptimeRobotMonitor[];
  error?: { message?: string };
}

// https://uptimerobot.com/api/ — codes de statut numériques du monitor.
const STATUS_LABELS: Record<number, string> = {
  0: "paused",
  1: "not_checked_yet",
  2: "up",
  8: "seems_down",
  9: "down",
};

interface MonitorStatusConfig {
  search: string;
  period: string;
}

/**
 * Adaptateur monitor_status — UptimeRobot, via la clé API personnelle collée par
 * l'utilisateur sur la page Services (pas d'OAuth disponible côté UptimeRobot).
 */
export async function fetchMonitorStatus(config: MonitorStatusConfig, ctx: WidgetContext): Promise<MonitorStatus> {
  const apiKey = await getStoredCredential(ctx.userId, "uptimerobot");
  const res = await fetch("https://api.uptimerobot.com/v2/getMonitors", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      api_key: apiKey,
      search: config.search,
      custom_uptime_ratios: config.period,
      format: "json",
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`UptimeRobot indisponible (${res.status})`);
  const data = (await res.json()) as UptimeRobotMonitorsResponse;
  if (data.stat !== "ok") throw new Error(data.error?.message ?? "Erreur UptimeRobot");
  const monitor = data.monitors?.[0];
  if (!monitor) throw new Error(`Aucun moniteur ne correspond à: ${config.search}`);

  return {
    name: monitor.friendly_name,
    url: monitor.url,
    status: STATUS_LABELS[monitor.status] ?? "unknown",
    uptimeRatio: Number(monitor.custom_uptime_ratio ?? 0),
    period: config.period,
  };
}
