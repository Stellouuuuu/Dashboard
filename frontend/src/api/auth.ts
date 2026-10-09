// Appels réels vers le backend d'authentification (PLAN.md §6.1). Session portée
// par des cookies httpOnly (access_token/refresh_token) posés par l'API — jamais
// lus ni stockés côté JS.

export interface RealUser {
  id: number;
  email: string;
  name: string | null;
  role: 'user' | 'admin';
  emailConfirmed: boolean;
  language: 'fr' | 'en';
  createdAt: string;
}

export class ApiAuthError extends Error {
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
    throw new ApiAuthError(res.status, body.error ?? `Erreur API (${res.status})`, body.code ?? 'INTERNAL_ERROR');
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function apiRegister(
  name: string,
  email: string,
  password: string,
  confirmPassword: string,
  language: 'fr' | 'en',
): Promise<{ message: string }> {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, confirmPassword, language }),
  });
}

export function apiConfirm(email: string, code: string): Promise<{ message: string }> {
  return request('/auth/confirm', { method: 'POST', body: JSON.stringify({ email, code }) });
}

export function apiResendConfirm(email: string): Promise<{ message: string }> {
  return request('/auth/resend-confirm', { method: 'POST', body: JSON.stringify({ email }) });
}

export function apiForgotPassword(email: string): Promise<{ message: string }> {
  return request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
}

export function apiResetPassword(
  email: string,
  code: string,
  newPassword: string,
): Promise<{ message: string }> {
  return request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, code, newPassword }),
  });
}

export function apiLogin(email: string, password: string): Promise<{ user: RealUser }> {
  return request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export function apiLogout(): Promise<void> {
  return request('/auth/logout', { method: 'POST' });
}

export function apiMe(): Promise<RealUser> {
  return request('/auth/me');
}

export function apiRefresh(): Promise<{ ok: boolean }> {
  return request('/auth/refresh', { method: 'POST' });
}

export function apiUnlinkGithub(): Promise<void> {
  return request('/auth/oauth/github', { method: 'DELETE' });
}

export function apiChangePassword(currentPassword: string, newPassword: string): Promise<void> {
  return request('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export function apiDeleteAccount(password: string): Promise<void> {
  return request('/auth/me', { method: 'DELETE', body: JSON.stringify({ password }) });
}

export function apiSetLanguage(language: 'fr' | 'en'): Promise<void> {
  return request('/auth/language', { method: 'PATCH', body: JSON.stringify({ language }) });
}

export function apiUpdateProfile(name: string): Promise<RealUser> {
  return request('/auth/profile', { method: 'PATCH', body: JSON.stringify({ name }) });
}

/** GET /api/v1/auth/oauth/github — pas un appel fetch, une vraie navigation. */
export function githubOAuthStartUrl(): string {
  return '/api/v1/auth/oauth/github';
}
