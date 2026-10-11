import type { ServiceId } from './catalog';

/**
 * Toutes les images de l'interface, à un seul endroit.
 * Les fichiers vivent dans `public/img/` ; voir `IMAGES.md` pour la liste à télécharger.
 */
/** Widgets sans photo fournie : illustrations vectorielles générées. */
const NEW_WIDGET_IMAGES = new Set([
  'player',
  'job_search',
  'hashtag_watch',
  'channel_latest_videos',
  'video_stats',
  'monitor_status',
  'directions',
  'gmail_unread',
  'outlook_unread',
]);

export const IMG = {
  background: '/img/bg.jpg',
  auth: '/img/auth.jpg',
  hero: {
    weather: '/img/hero-weather.jpg',
    github: '/img/hero-github.jpg',
    rss: '/img/hero-rss.jpg',
    finance: '/img/hero-finance.jpg',
    hackernews: '/img/hero-hackernews.jpg',
    spotify: '/img/hero-spotify.svg',
    linkedin: '/img/hero-linkedin.svg',
    youtube: '/img/hero-youtube.svg',
    uptimerobot: '/img/hero-uptimerobot.svg',
    maps: '/img/hero-maps.svg',
    gmail: '/img/hero-gmail.svg',
    outlook: '/img/hero-outlook.svg',
  } satisfies Record<ServiceId, string>,
  /** Ambiances en rotation sur la colonne gauche auth (login / inscription). */
  atmosphere: [
    '/img/auth.jpg',
    '/img/hero-weather.jpg',
    '/img/hero-github.jpg',
    '/img/hero-rss.jpg',
    '/img/bg.jpg',
  ] as const,
  service: {
    weather: '/img/svc-weather.jpg',
    github: '/img/svc-github.jpg',
    rss: '/img/svc-rss.jpg',
    finance: '/img/svc-finance.jpg',
    hackernews: '/img/svc-hackernews.jpg',
    spotify: '/img/svc-spotify.svg',
    linkedin: '/img/svc-linkedin.svg',
    youtube: '/img/svc-youtube.svg',
    uptimerobot: '/img/svc-uptimerobot.svg',
    maps: '/img/svc-maps.svg',
    gmail: '/img/svc-gmail.svg',
    outlook: '/img/svc-outlook.svg',
  } satisfies Record<ServiceId, string>,
  widget: (widgetId: string) =>
    NEW_WIDGET_IMAGES.has(widgetId) ? `/img/widget-${widgetId}.svg` : `/img/widget-${widgetId}.jpg`,
};
