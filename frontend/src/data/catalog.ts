export type ServiceId = 'weather' | 'github' | 'rss' | 'finance' | 'hackernews';
export type Accent = 'cyan' | 'violet' | 'amber' | 'emerald' | 'coral';
export type ParamType = 'string' | 'integer';

export interface WidgetParam {
  name: string;
  type: ParamType;
  label: string;
}

export type WidgetStatus = 'ok' | 'loading' | 'error';

export interface WidgetInstance {
  uid: number;
  widgetId: string;
  config: Record<string, string | number>;
  refresh: number;
  position: number;
  /** Dernier payload reçu de GET /dashboard/widgets/:id/data (PLAN.md §4.3). */
  data?: unknown;
  status?: WidgetStatus;
  errorMessage?: string;
}

/** "city_temperature" -> "City temperature" — le registre back ne fournit pas de libellé humain. */
export function prettifyWidgetName(name: string): string {
  const s = name.replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const ACCENT: Record<ServiceId, Accent> = {
  weather: 'cyan',
  github: 'violet',
  rss: 'amber',
  finance: 'emerald',
  hackernews: 'coral',
};

export const SERVICES: ServiceId[] = ['weather', 'github', 'rss', 'finance', 'hackernews'];

/** Stable variant index so each widget id gets a distinct cover shade. */
export function coverVariantFor(widgetId: string): number {
  let h = 0;
  for (let i = 0; i < widgetId.length; i++) h = (h + widgetId.charCodeAt(i) * (i + 1)) % 3;
  return h;
}

// Le back impose un minimum de 30 s (CONSTANTS.REFRESH_RATE_MIN, PLAN.md §4.3) —
// toute fréquence en dessous serait de toute façon relevée à 30 s côté serveur.
export const REFRESH_RATES = [30, 60, 120, 300, 900] as const;

