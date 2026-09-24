import type { ServiceId } from './catalog';

/**
 * Toutes les images de l'interface, à un seul endroit.
 * Les fichiers vivent dans `public/img/` ; voir `IMAGES.md` pour la liste à télécharger.
 */
export const IMG = {
  background: '/img/bg.jpg',
  auth: '/img/auth.jpg',
  hero: {
    weather: '/img/hero-weather.jpg',
    github: '/img/hero-github.jpg',
    rss: '/img/hero-rss.jpg',
    finance: '/img/hero-finance.jpg',
    hackernews: '/img/hero-hackernews.jpg',
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
  } satisfies Record<ServiceId, string>,
  widget: (widgetId: string) => `/img/widget-${widgetId}.jpg`,
};
