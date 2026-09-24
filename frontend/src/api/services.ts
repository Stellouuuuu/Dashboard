// Appels réels vers /api/v1/services (PLAN.md §6.2).

export interface ApiService {
  name: 'weather' | 'github' | 'rss' | 'finance' | 'hackernews';
  requiresOAuth: boolean;
  subscribed: boolean;
}

export class ServiceApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, message: string, code: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ServiceApiError(res.status, body.error ?? `Erreur API (${res.status})`, body.code ?? 'INTERNAL_ERROR');
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function apiListServices(): Promise<ApiService[]> {
  return request('/services');
}

export function apiSubscribeService(name: string): Promise<void> {
  return request(`/services/${name}/subscribe`, { method: 'POST' });
}

export function apiUnsubscribeService(name: string): Promise<void> {
  return request(`/services/${name}/subscribe`, { method: 'DELETE' });
}
