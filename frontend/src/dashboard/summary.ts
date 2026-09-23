import type { WidgetInstance } from '../data/catalog';
import { FRAMES } from '../data/frames';

export interface WidgetSummary {
  /** Petite ligne au-dessus du titre (ville, dépôt, flux…). */
  kicker: string;
  /** Valeur principale, affichée en grand. */
  title: string;
  /** Détails (2 à 3 lignes max). */
  lines: string[];
}

/**
 * Résumé textuel des données d'une instance, utilisé par les cartes et la bannière.
 * Données de démo (frames) en attendant le backend : même forme que la réponse de /data.
 */
export function summarize(inst: WidgetInstance, frame: number): WidgetSummary {
  const c = inst.config;
  switch (inst.widgetId) {
    case 'city_temperature': {
      const key = (inst.frameKey || 'temp_cotonou') as 'temp_cotonou' | 'temp_paris';
      const f = FRAMES[key][frame % FRAMES[key].length];
      return { kicker: String(c.city ?? ''), title: f.big, lines: [f.meta] };
    }
    case 'precipitation_forecast': {
      const f = FRAMES.precip[frame % FRAMES.precip.length];
      const days = f.days.map((d) => d.replace('j ', ' j · '));
      return { kicker: String(c.city ?? ''), title: `Pluie ${days[1]?.split(' · ')[1] ?? ''}`.trim(), lines: days };
    }
    case 'recent_commits': {
      const list = FRAMES.commits[frame % FRAMES.commits.length].slice(0, Number(c.limit) || 3);
      return {
        kicker: String(c.repo ?? ''),
        title: `${list.length} commits récents`,
        lines: list.map((x) => `${x.m} — ${x.a}, ${x.t}`),
      };
    }
    case 'security_alerts': {
      const f = FRAMES.alerts[frame % FRAMES.alerts.length];
      return {
        kicker: String(c.repo ?? ''),
        title: `${f.high + f.medium} alertes`,
        lines: [`${f.high} de sévérité haute`, `${f.medium} de sévérité moyenne`],
      };
    }
    case 'article_list': {
      const list = FRAMES.articles[frame % FRAMES.articles.length].slice(0, Number(c.number) || 3);
      return { kicker: String(c.feed_url ?? ''), title: `${list.length} articles`, lines: list.map((a) => a.t) };
    }
    case 'feed_summary':
      return {
        kicker: String(c.feed_url ?? ''),
        title: 'À la une',
        lines: ['« Threshold : construire un dashboard vivant »'],
      };
    default:
      return { kicker: '', title: '', lines: [] };
  }
}
