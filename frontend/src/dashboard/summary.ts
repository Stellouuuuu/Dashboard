import i18n from '../i18n';
import { formatNumber } from '../i18n/format';

export interface WidgetSummary {
  /** Petite ligne au-dessus du titre (ville, dépôt, flux…). */
  kicker: string;
  /** Valeur principale, affichée en grand. */
  title: string;
  /** Détails (2 à 3 lignes max). */
  lines: string[];
}

// Formes renvoyées par les adaptateurs backend (backend/src/adapters/*.ts) —
// dupliquées ici côté front car le payload de GET .../data est `unknown` par design.
export interface CityTemperature {
  city: string;
  temperature: number;
  unit: string;
  description: string;
}
export interface PrecipitationDay {
  day: string;
  precipitation_mm: number;
}
export interface CommitSummary {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
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
export interface FeedItem {
  title: string;
  link: string;
  pubDate: string | null;
  description: string | null;
  source: string;
}
export interface ExchangeRate {
  base: string;
  target: string;
  rate: number;
  date: string;
}
export interface CryptoPrice {
  coin: string;
  currency: string;
  price: number;
  change24h: number | null;
}
export interface HnStory {
  objectID: string;
  title: string;
  url: string | null;
  points: number;
  author: string;
  commentsCount: number;
  createdAt: string;
}

const EMPTY: WidgetSummary = { kicker: '', title: '—', lines: [] };

function currentLng(): string {
  return i18n.resolvedLanguage ?? i18n.language ?? 'fr';
}

/** Résumé textuel du payload réel de GET /dashboard/widgets/:id/data, par type de widget. */
export function summarizeData(widgetId: string, data: unknown): WidgetSummary {
  if (data == null) return EMPTY;

  switch (widgetId) {
    case 'city_temperature': {
      const d = data as CityTemperature;
      return { kicker: d.city, title: `${d.temperature}°${d.unit}`, lines: [d.description] };
    }
    case 'precipitation_forecast': {
      const days = data as PrecipitationDay[];
      if (!days.length) return EMPTY;
      return {
        kicker: i18n.t('dashboard.summary.days', { count: days.length }),
        title: `${days[0].precipitation_mm} mm`,
        lines: days.slice(0, 3).map((d) => `${d.day} · ${d.precipitation_mm} mm`),
      };
    }
    case 'recent_commits': {
      const commits = data as CommitSummary[];
      if (!commits.length) return { kicker: '', title: i18n.t('dashboard.summary.noCommit'), lines: [] };
      return {
        kicker: i18n.t('dashboard.summary.commits', { count: commits.length }),
        title: commits[0].message,
        lines: commits.slice(0, 2).map((c) => `${c.sha} — ${c.author}`),
      };
    }
    case 'security_alerts': {
      const alerts = data as SecurityAlertSummary[];
      if (!alerts.length) return { kicker: '', title: i18n.t('dashboard.summary.noAlert'), lines: [] };
      return {
        kicker: i18n.t('dashboard.summary.alerts', { count: alerts.length }),
        title: alerts[0].summary,
        lines: alerts.slice(0, 2).map((a) => `${a.package} · ${a.severity}`),
      };
    }
    case 'article_list':
    case 'feed_summary': {
      const items = data as FeedItem[];
      if (!items.length) return { kicker: '', title: i18n.t('dashboard.summary.noArticle'), lines: [] };
      return {
        kicker: items[0].source,
        title: items[0].title,
        lines: items.slice(1, 3).map((a) => a.title),
      };
    }
    case 'exchange_rate': {
      const d = data as ExchangeRate;
      return {
        kicker: `${d.base} → ${d.target}`,
        title: formatNumber(d.rate, currentLng(), { maximumFractionDigits: 4 }),
        lines: [d.date],
      };
    }
    case 'crypto_price': {
      const d = data as CryptoPrice;
      const changeLine =
        d.change24h == null
          ? []
          : [`${d.change24h >= 0 ? '+' : ''}${formatNumber(d.change24h, currentLng(), { maximumFractionDigits: 2 })}% (24h)`];
      return {
        kicker: d.coin,
        title: `${formatNumber(d.price, currentLng(), { maximumFractionDigits: 2 })} ${d.currency.toUpperCase()}`,
        lines: changeLine,
      };
    }
    case 'top_stories':
    case 'story_search': {
      const stories = data as HnStory[];
      if (!stories.length) return { kicker: '', title: i18n.t('dashboard.summary.noStory'), lines: [] };
      return {
        kicker: i18n.t('dashboard.summary.stories', { count: stories.length }),
        title: stories[0].title,
        lines: stories.slice(1, 3).map((s) => s.title),
      };
    }
    default:
      return EMPTY;
  }
}
