// Appels réels vers l'API backend (PLAN.md §6.3). Même origine que le front via
// nginx (`/api/v1/*` proxifié), donc pas de CORS à gérer. Toutes les routes
// dashboard sont protégées par `requireAuth` (session par cookie httpOnly).

import { apiRefresh } from './auth';

export interface ApiWidgetParam {
  name: string;
  type: 'string' | 'integer';
  label: string;
}

export interface ApiWidgetDefinition {
  name: string;
  service: 'weather' | 'github' | 'rss' | 'finance' | 'hackernews';
  description: string;
  params: ApiWidgetParam[];
}

export interface ApiWidgetInstance {
  id: number;
  userId: number;
  widgetName: string;
  config: Record<string, string | number>;
  position: number;
  refreshRate: number;
  lastRefreshedAt: string | null;
  status: 'pending' | 'ok' | 'error';
  widget: { service: string; description: string; params: ApiWidgetParam[] } | null;
}

export interface ApiWidgetData {
  data: unknown;
  cached: boolean;
  lastRefreshedAt: string;
}

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, message: string, code: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// Le timer des widgets tourne en continu tant que la page reste ouverte : l'access
// token (15 min) expire souvent pendant cette période alors que le refresh cookie
// est encore valide. Sans ce retry, chaque appel tombe en AUTH_TOKEN_INVALID au lieu
// de se rafraîchir silencieusement. `refreshInFlight` déduplique les refresh
// concurrents quand plusieurs widgets expirent au même moment.
let refreshInFlight: Promise<void> | null = null;

function refreshAccessToken(): Promise<void> {
  if (!refreshInFlight) {
    refreshInFlight = apiRefresh()
      .then(() => undefined)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

async function request<T>(path: string, init?: RequestInit, retryOn401 = true): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (res.status === 401 && retryOn401) {
    try {
      await refreshAccessToken();
    } catch {
      // Refresh cookie lui-même expiré/absent : on retente quand même une fois pour
      // remonter l'erreur d'origine (AUTH_TOKEN_INVALID/AUTH_UNAUTHENTICATED) via le
      // chemin normal ci-dessous, plutôt que de la dupliquer ici.
    }
    return request<T>(path, init, false);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body.error ?? `Erreur API (${res.status})`, body.code ?? 'INTERNAL_ERROR');
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function apiListWidgetCatalog(): Promise<ApiWidgetDefinition[]> {
  return request('/widgets');
}

export function apiListDashboard(): Promise<ApiWidgetInstance[]> {
  return request('/dashboard');
}

export function apiAddDashboardWidget(input: {
  widgetName: string;
  config: Record<string, string | number>;
  refreshRate?: number;
  position?: number;
}): Promise<ApiWidgetInstance> {
  return request('/dashboard/widgets', { method: 'POST', body: JSON.stringify(input) });
}

export function apiReconfigureDashboardWidget(
  id: number,
  input: { config: Record<string, string | number>; refreshRate?: number },
): Promise<ApiWidgetInstance> {
  return request(`/dashboard/widgets/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export function apiMoveDashboardWidget(id: number, position: number): Promise<ApiWidgetInstance> {
  return request(`/dashboard/widgets/${id}/position`, {
    method: 'PATCH',
    body: JSON.stringify({ position }),
  });
}

export function apiDeleteDashboardWidget(id: number): Promise<void> {
  return request(`/dashboard/widgets/${id}`, { method: 'DELETE' });
}

export function apiGetDashboardWidgetData(id: number): Promise<ApiWidgetData> {
  return request(`/dashboard/widgets/${id}/data`);
}
