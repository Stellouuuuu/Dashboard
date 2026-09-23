export type ServiceId = 'weather' | 'github' | 'rss' | 'spotify' | 'whatsapp';
export type Accent = 'cyan' | 'violet' | 'amber' | 'green' | 'mint';
export type ParamType = 'string' | 'integer';

export interface WidgetParam {
  name: string;
  type: ParamType;
  label: string;
}

export interface CatalogWidget {
  id: string;
  service: ServiceId;
  name: string;
  desc: string;
  params: WidgetParam[];
  /** Optional: hide from wizard until service is live. */
  comingSoon?: boolean;
}

export type WidgetStatus = 'ok' | 'loading' | 'error';

export interface WidgetInstance {
  uid: number;
  widgetId: string;
  config: Record<string, string | number>;
  refresh: number;
  frameKey?: string;
  pair?: boolean;
  status?: WidgetStatus;
  errorMessage?: string;
}

export const ACCENT: Record<ServiceId, Accent> = {
  weather: 'cyan',
  github: 'violet',
  rss: 'amber',
  spotify: 'green',
  whatsapp: 'mint',
};

export const SERVICE_LABEL: Record<ServiceId, string> = {
  weather: 'Weather',
  github: 'GitHub',
  rss: 'RSS',
  spotify: 'Spotify',
  whatsapp: 'WhatsApp',
};

export const CATALOG: CatalogWidget[] = [
  {
    id: 'city_temperature',
    service: 'weather',
    name: 'City temperature',
    desc: 'Température et ciel actuels pour une ville.',
    params: [
      { name: 'city', type: 'string', label: 'Ville' },
      { name: 'unit', type: 'string', label: 'Unité' },
    ],
  },
  {
    id: 'precipitation_forecast',
    service: 'weather',
    name: 'Precipitation forecast',
    desc: 'Chances de pluie sur les prochains jours.',
    params: [
      { name: 'city', type: 'string', label: 'Ville' },
      { name: 'days', type: 'integer', label: 'Jours' },
    ],
  },
  {
    id: 'recent_commits',
    service: 'github',
    name: 'Recent commits',
    desc: "Derniers commits d'un dépôt.",
    params: [
      { name: 'repo', type: 'string', label: 'Dépôt' },
      { name: 'limit', type: 'integer', label: 'Limite' },
    ],
  },
  {
    id: 'security_alerts',
    service: 'github',
    name: 'Security alerts',
    desc: 'Alertes de sécurité ouvertes.',
    params: [
      { name: 'repo', type: 'string', label: 'Dépôt' },
      { name: 'severity', type: 'string', label: 'Sévérité min.' },
    ],
  },
  {
    id: 'article_list',
    service: 'rss',
    name: 'Article list',
    desc: "Derniers articles d'un flux.",
    params: [
      { name: 'feed_url', type: 'string', label: 'URL du flux' },
      { name: 'number', type: 'integer', label: 'Nombre' },
    ],
  },
  {
    id: 'feed_summary',
    service: 'rss',
    name: 'Feed summary',
    desc: 'Un titre qui tourne depuis un flux.',
    params: [
      { name: 'feed_url', type: 'string', label: 'URL du flux' },
      { name: 'label', type: 'string', label: 'Étiquette' },
    ],
  },
  {
    id: 'now_playing',
    service: 'spotify',
    name: 'Now playing',
    desc: 'Titre en cours d’écoute sur Spotify.',
    comingSoon: true,
    params: [{ name: 'account', type: 'string', label: 'Compte' }],
  },
  {
    id: 'playlist_pulse',
    service: 'spotify',
    name: 'Playlist pulse',
    desc: 'Aperçu d’une playlist favorite.',
    comingSoon: true,
    params: [{ name: 'playlist', type: 'string', label: 'Playlist' }],
  },
  {
    id: 'unread_chats',
    service: 'whatsapp',
    name: 'Unread chats',
    desc: 'Conversations non lues.',
    comingSoon: true,
    params: [{ name: 'filter', type: 'string', label: 'Filtre' }],
  },
  {
    id: 'last_message',
    service: 'whatsapp',
    name: 'Last message',
    desc: 'Dernier message reçu.',
    comingSoon: true,
    params: [{ name: 'contact', type: 'string', label: 'Contact' }],
  },
];

/** Stable variant index so each widget id gets a distinct cover shade. */
export function coverVariantFor(widgetId: string): number {
  let h = 0;
  for (let i = 0; i < widgetId.length; i++) h = (h + widgetId.charCodeAt(i) * (i + 1)) % 3;
  return h;
}

export function catalogOf(id: string): CatalogWidget | undefined {
  return CATALOG.find((c) => c.id === id);
}

export const INITIAL_INSTANCES: WidgetInstance[] = [
  {
    uid: 1,
    widgetId: 'city_temperature',
    config: { city: 'Cotonou', unit: '°C' },
    refresh: 9,
    frameKey: 'temp_cotonou',
    pair: true,
  },
  {
    uid: 2,
    widgetId: 'city_temperature',
    config: { city: 'Paris', unit: '°C' },
    refresh: 9,
    frameKey: 'temp_paris',
    pair: true,
  },
  {
    uid: 3,
    widgetId: 'recent_commits',
    config: { repo: 'team/dashboard', limit: 3 },
    refresh: 13,
  },
  {
    uid: 4,
    widgetId: 'security_alerts',
    config: { repo: 'team/dashboard', severity: 'medium' },
    refresh: 17,
  },
  {
    uid: 5,
    widgetId: 'article_list',
    config: { feed_url: 'blog.example.com/feed', number: 3 },
    refresh: 15,
  },
  {
    uid: 6,
    widgetId: 'precipitation_forecast',
    config: { city: 'Cotonou', days: 3 },
    refresh: 20,
  },
];

export const REFRESH_RATES = [10, 15, 30, 60, 300] as const;

export const AUDIT_EVENTS = [
  'GitHub connecté par Stella G.',
  'Widget ajouté : Recent commits',
  'Compte confirmé : Nadia B.',
  'Widget supprimé : Feed summary',
  'Flux RSS ajouté par Aichath R.',
  'Nouvel utilisateur inscrit : Marc O.',
];

export const ADMIN_USERS = [
  { name: 'Stella G.', email: 'stella@epitech.eu', status: 'confirmed' as const, date: '16 sept.' },
  { name: 'Aichath R.', email: 'aichath@epitech.eu', status: 'confirmed' as const, date: '16 sept.' },
  { name: 'Yao K.', email: 'yao.k@mail.com', status: 'pending' as const, date: '15 sept.' },
  { name: 'Nadia B.', email: 'nadia.b@mail.com', status: 'confirmed' as const, date: '14 sept.' },
  { name: 'Marc O.', email: 'marc.o@mail.com', status: 'pending' as const, date: '13 sept.' },
];
