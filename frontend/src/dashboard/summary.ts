import i18n from '../i18n';
import { formatNumber } from '../i18n/format';

export interface WidgetSummary {
  /** Petite ligne au-dessus du titre (ville, dépôt, flux…). */
  kicker: string;
  /** Valeur principale, affichée en grand. */
  title: string;
  /** Détails (2 à 3 lignes max). */
  lines: string[];
  /** Vignette (pochette, photo de profil). */
  image?: string | null;
  /** Lecteur Spotify intégré (URL déjà validée). */
  embedUrl?: string;
  /** Bouton d'action sur la tuile (ex. partager sur LinkedIn). */
  action?: { label: string; href: string };
}

/** N'autorise que le lecteur officiel Spotify dans une iframe — le payload vient de l'API, jamais de confiance aveugle. */
export function safeSpotifyEmbed(url: unknown): string | null {
  return typeof url === 'string' && /^https:\/\/open\.spotify\.com\/embed\/[a-z]+\/[A-Za-z0-9]+$/.test(url) ? url : null;
}

/** Lien externe restreint à un préfixe d'origine connu. */
export function safeLink(url: unknown, prefix: string): string | null {
  return typeof url === 'string' && url.startsWith(prefix) ? url : null;
}

/** Images distantes : https uniquement. */
export function safeImage(url: unknown): string | null {
  return typeof url === 'string' && url.startsWith('https://') ? url : null;
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

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: string;
  album: string;
  cover: string | null;
  url: string;
  durationMs: number;
}
export interface SpotifyEmbed {
  kind: string;
  id: string;
  embedUrl: string;
  url: string;
}
export interface LinkedinJobSearch {
  keywords: string;
  location: string;
  jobType: string;
  period: string;
  url: string;
}
export interface LinkedinHashtag {
  tag: string;
  url: string;
}
export interface YoutubeVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
  thumbnail: string | null;
  url: string;
}
export interface YoutubeVideoStats {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string | null;
  viewCount: number;
  likeCount: number | null;
  commentCount: number | null;
  publishedAt: string;
  url: string;
}
export interface MonitorStatus {
  name: string;
  url: string;
  status: string;
  uptimeRatio: number;
  period: string;
}
export interface DirectionsResult {
  from: string;
  to: string;
  mode: string;
  distanceKm: number;
  durationMin: number;
}
export interface MailMessage {
  id: string;
  subject: string;
  from: string;
  snippet?: string;
  receivedAt?: string;
}
export interface MailUnreadSummary {
  count: number;
  messages: MailMessage[];
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
    case 'player': {
      const d = data as SpotifyEmbed;
      return { kicker: d.kind, title: i18n.t('dashboard.summary.playerTitle'), lines: [], embedUrl: safeSpotifyEmbed(d.embedUrl) ?? undefined };
    }
    case 'job_search': {
      const d = data as LinkedinJobSearch;
      const href = safeLink(d.url, 'https://www.linkedin.com/jobs/search/');
      return {
        kicker: d.location || i18n.t('dashboard.summary.anywhere'),
        title: d.keywords,
        lines: [
          i18n.t(`wizard.options.${d.jobType}`),
          d.period !== 'any' ? i18n.t('dashboard.summary.postedSince', { period: i18n.t(`wizard.options.${d.period}`) }) : '',
        ].filter(Boolean),
        action: href ? { label: i18n.t('dashboard.summary.seeJobs'), href } : undefined,
      };
    }
    case 'hashtag_watch': {
      const tags = data as LinkedinHashtag[];
      const href = tags.length ? safeLink(tags[0].url, 'https://www.linkedin.com/feed/hashtag/') : null;
      return {
        kicker: i18n.t('dashboard.summary.hashtags', { count: tags.length }),
        title: tags.length ? `#${tags[0].tag}` : '—',
        lines: tags.slice(0, 4).map((x) => `#${x.tag}`),
        action: href ? { label: i18n.t('dashboard.summary.seeHashtag', { tag: tags[0].tag }), href } : undefined,
      };
    }
    case 'channel_latest_videos': {
      const videos = data as YoutubeVideo[];
      if (!videos.length) return { kicker: '', title: i18n.t('dashboard.summary.noVideo'), lines: [] };
      const href = safeLink(videos[0].url, 'https://www.youtube.com/watch?v=');
      return {
        kicker: i18n.t('dashboard.summary.videos', { count: videos.length }),
        title: videos[0].title,
        lines: videos.slice(1, 3).map((v) => v.title),
        image: safeImage(videos[0].thumbnail) ?? undefined,
        action: href ? { label: i18n.t('dashboard.summary.watchVideo'), href } : undefined,
      };
    }
    case 'video_stats': {
      const d = data as YoutubeVideoStats;
      const href = safeLink(d.url, 'https://www.youtube.com/watch?v=');
      return {
        kicker: d.channelTitle,
        title: d.title,
        lines: [
          `${formatNumber(d.viewCount, currentLng())} ${i18n.t('dashboard.summary.viewsUnit')}`,
          d.likeCount != null ? `${formatNumber(d.likeCount, currentLng())} ${i18n.t('dashboard.summary.likesUnit')}` : '',
        ].filter(Boolean),
        image: safeImage(d.thumbnail) ?? undefined,
        action: href ? { label: i18n.t('dashboard.summary.watchVideo'), href } : undefined,
      };
    }
    case 'monitor_status': {
      const d = data as MonitorStatus;
      const href = /^https?:\/\//i.test(d.url) ? d.url : null;
      return {
        kicker: d.name,
        title: i18n.t(`dashboard.summary.monitorStatus.${d.status}`, { defaultValue: d.status }),
        lines: [i18n.t('dashboard.summary.uptimeRatio', { ratio: d.uptimeRatio, days: d.period })],
        action: href ? { label: i18n.t('dashboard.summary.seeMonitor'), href } : undefined,
      };
    }
    case 'directions': {
      const d = data as DirectionsResult;
      return {
        kicker: `${d.from} → ${d.to}`,
        title: i18n.t('dashboard.summary.durationMin', { count: d.durationMin }),
        lines: [i18n.t('dashboard.summary.distanceKm', { km: d.distanceKm })],
      };
    }
    case 'gmail_unread':
    case 'outlook_unread': {
      const d = data as MailUnreadSummary;
      if (!d.messages.length) return { kicker: '', title: i18n.t('dashboard.summary.noMail'), lines: [] };
      return {
        kicker: i18n.t('dashboard.summary.unreadCount', { count: d.count }),
        title: d.messages[0].subject,
        lines: d.messages.slice(1, 3).map((m) => m.subject),
      };
    }
    default:
      return EMPTY;
  }
}
