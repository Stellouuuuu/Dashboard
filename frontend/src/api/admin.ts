// Appels réels vers /api/v1/admin/users (PLAN.md §6.4).

export interface ApiAdminUser {
  id: number;
  email: string;
  role: 'user' | 'admin';
  emailConfirmed: boolean;
  suspended: boolean;
  createdAt: string;
}

export class AdminApiError extends Error {
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
    throw new AdminApiError(res.status, body.error ?? `Erreur API (${res.status})`, body.code ?? 'INTERNAL_ERROR');
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function apiListAdminUsers(): Promise<ApiAdminUser[]> {
  return request('/admin/users');
}

export function apiUpdateAdminUser(
  id: number,
  patch: { suspended?: boolean; role?: 'user' | 'admin' },
): Promise<ApiAdminUser> {
  return request(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
}

export function apiDeleteAdminUser(id: number): Promise<void> {
  return request(`/admin/users/${id}`, { method: 'DELETE' });
}

export interface ApiAdminStats {
  totalWidgets: number;
  activeUsers: number;
  byWidget: { widgetName: string; count: number }[];
  byStatus: { status: string; count: number }[];
}

export function apiGetAdminStats(): Promise<ApiAdminStats> {
  return request('/admin/stats');
}

export interface ApiAuditLogEntry {
  id: number;
  action: string;
  payload: Record<string, unknown> | null;
  createdAt: string;
  userEmail: string | null;
}

export function apiGetAuditLog(): Promise<ApiAuditLogEntry[]> {
  return request('/admin/audit-log');
}
