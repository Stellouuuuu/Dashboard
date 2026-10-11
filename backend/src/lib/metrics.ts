// Valeur numérique "principale" d'un widget — utilisée par l'historique (sparkline)
// et les alertes de seuil (bonus, voir docs/TECH_CHOICES.md). Seuls les widgets qui
// ont un vrai nombre à suivre dans le temps sont concernés ; les widgets "liste"
// (commits, alertes, articles, stories) renvoient null et sont exclus des deux.
export function extractMetric(widgetName: string, data: unknown): number | null {
  if (data == null || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;

  switch (widgetName) {
    case "city_temperature":
      return typeof d.temperature === "number" ? d.temperature : null;
    case "crypto_price":
      return typeof d.price === "number" ? d.price : null;
    case "exchange_rate":
      return typeof d.rate === "number" ? d.rate : null;
    case "precipitation_forecast": {
      const days = data as { precipitation_mm?: number }[];
      return Array.isArray(days) && typeof days[0]?.precipitation_mm === "number"
        ? days[0].precipitation_mm
        : null;
    }
    default:
      return null;
  }
}

/** Résumé texte compact d'un widget, pour construire le prompt du brief IA (bonus). */
export function describeWidgetForBrief(widgetName: string, data: unknown): string | null {
  if (data == null) return null;
  const d = data as Record<string, unknown>;

  switch (widgetName) {
    case "city_temperature":
      return `Météo à ${d.city}: ${d.temperature}°${d.unit}, ${d.description}.`;
    case "precipitation_forecast": {
      const days = data as { day: string; precipitation_mm: number }[];
      if (!Array.isArray(days) || !days.length) return null;
      return `Précipitations prévues: ${days.map((x) => `${x.day} ${x.precipitation_mm}mm`).join(", ")}.`;
    }
    case "crypto_price":
      return `${String(d.coin).toUpperCase()}: ${d.price} ${String(d.currency).toUpperCase()}${
        typeof d.change24h === "number" ? ` (${d.change24h >= 0 ? "+" : ""}${d.change24h.toFixed(2)}% sur 24h)` : ""
      }.`;
    case "exchange_rate":
      return `Taux de change ${d.base}→${d.target}: ${d.rate}.`;
    case "recent_commits": {
      const commits = data as { message: string; author: string }[];
      if (!Array.isArray(commits) || !commits.length) return "Aucun commit récent.";
      return `Derniers commits: ${commits.slice(0, 3).map((c) => `"${c.message}" par ${c.author}`).join(" ; ")}.`;
    }
    case "security_alerts": {
      const alerts = data as { summary: string; severity: string }[];
      if (!Array.isArray(alerts) || !alerts.length) return "Aucune alerte de sécurité.";
      return `${alerts.length} alerte(s) de sécurité, dont: ${alerts.slice(0, 3).map((a) => `${a.summary} (${a.severity})`).join(" ; ")}.`;
    }
    case "article_list":
    case "feed_summary": {
      const items = data as { title: string; source: string }[];
      if (!Array.isArray(items) || !items.length) return null;
      return `Articles récents: ${items.slice(0, 3).map((a) => `"${a.title}" (${a.source})`).join(" ; ")}.`;
    }
    case "top_stories":
    case "story_search": {
      const stories = data as { title: string; points: number }[];
      if (!Array.isArray(stories) || !stories.length) return null;
      return `Hacker News: ${stories.slice(0, 3).map((s) => `"${s.title}" (${s.points} pts)`).join(" ; ")}.`;
    }
    default:
      return null;
  }
}
