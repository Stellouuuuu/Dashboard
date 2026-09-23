import {
  SESSION_TTL_MS,
  clearSession,
  createConfirmToken,
  createToken,
  deleteUser,
  getUserByEmail,
  getUserById,
  getUsers,
  readSession,
  toPublicUser,
  upsertUser,
  writeSession,
  type PublicUser,
  type User,
} from '../auth/session';

export function delay(ms = 500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type AuthErrorCode = 'INVALID_CREDENTIALS' | 'UNCONFIRMED' | 'EMAIL_TAKEN' | 'INVALID_TOKEN' | 'EXPIRED_SESSION' | 'WEAK_PASSWORD';

export class AuthError extends Error {
  code: AuthErrorCode;
  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export async function apiLogin(
  email: string,
  password: string,
): Promise<{ token: string; expiresAt: number; user: PublicUser }> {
  await delay(700);
  const user = getUserByEmail(email);
  if (!user || user.password !== password) {
    throw new AuthError('INVALID_CREDENTIALS', 'Email ou mot de passe incorrect.');
  }
  if (!user.confirmed) {
    throw new AuthError(
      'UNCONFIRMED',
      'Ton compte n’est pas encore confirmé. Vérifie ta boîte mail avant de te connecter.',
    );
  }
  const token = createToken();
  const expiresAt = Date.now() + SESSION_TTL_MS;
  writeSession({ token, expiresAt, userId: user.id });
  return { token, expiresAt, user: toPublicUser(user) };
}

export async function apiRegister(
  name: string,
  email: string,
  password: string,
): Promise<{ confirmToken: string; email: string }> {
  await delay(800);
  if (getUserByEmail(email)) {
    throw new AuthError('EMAIL_TAKEN', 'Un compte existe déjà avec cet email.');
  }
  const confirmToken = createConfirmToken();
  const user: User = {
    id: `u_${Date.now()}`,
    name,
    email,
    password,
    confirmed: false,
    role: 'user',
    confirmToken,
    createdAt: new Date().toISOString().slice(0, 10),
    serviceCredentials: {},
  };
  upsertUser(user);
  return { confirmToken, email };
}

export async function apiConfirm(token: string): Promise<{
  token: string;
  expiresAt: number;
  user: PublicUser;
}> {
  await delay(600);
  const users = getUsers();
  const user = users.find((u) => u.confirmToken === token);
  if (!user) {
    throw new AuthError('INVALID_TOKEN', 'Lien de confirmation invalide ou déjà utilisé.');
  }
  user.confirmed = true;
  user.confirmToken = null;
  upsertUser(user);
  const sessionToken = createToken();
  const expiresAt = Date.now() + SESSION_TTL_MS;
  writeSession({ token: sessionToken, expiresAt, userId: user.id });
  return { token: sessionToken, expiresAt, user: toPublicUser(user) };
}

export async function apiLogout(): Promise<void> {
  await delay(200);
  clearSession();
}

export async function apiRestoreSession(): Promise<{
  token: string;
  expiresAt: number;
  user: PublicUser;
} | null> {
  await delay(400);
  const session = readSession();
  if (!session) return null;
  const user = getUserById(session.userId);
  if (!user || !user.confirmed) {
    clearSession();
    return null;
  }
  return { token: session.token, expiresAt: session.expiresAt, user: toPublicUser(user) };
}

export async function apiUpdateProfile(
  userId: string,
  patch: Partial<Pick<User, 'name' | 'serviceCredentials'>>,
): Promise<PublicUser> {
  await delay(600);
  const user = getUserById(userId);
  if (!user) throw new AuthError('EXPIRED_SESSION', 'Session invalide.');
  if (patch.name) user.name = patch.name;
  if (patch.serviceCredentials) {
    user.serviceCredentials = { ...user.serviceCredentials, ...patch.serviceCredentials };
  }
  upsertUser(user);
  return toPublicUser(user);
}

export async function apiChangePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await delay(700);
  const user = getUserById(userId);
  if (!user) throw new AuthError('EXPIRED_SESSION', 'Session invalide.');
  if (user.password !== currentPassword) {
    throw new AuthError('INVALID_CREDENTIALS', 'Mot de passe actuel incorrect.');
  }
  if (newPassword.length < 8) {
    throw new AuthError('WEAK_PASSWORD', 'Le mot de passe doit contenir au moins 8 caractères.');
  }
  user.password = newPassword;
  upsertUser(user);
}

export async function apiDeleteAccount(userId: string, password: string): Promise<void> {
  await delay(700);
  const user = getUserById(userId);
  if (!user) throw new AuthError('EXPIRED_SESSION', 'Session invalide.');
  if (user.password !== password) {
    throw new AuthError('INVALID_CREDENTIALS', 'Mot de passe incorrect.');
  }
  deleteUser(userId);
  clearSession();
}

export async function apiConnectGithub(_token: string): Promise<{ username: string }> {
  await delay(900);
  if (Math.random() < 0.08) {
    throw new Error('Impossible de joindre GitHub pour le moment. Réessaie.');
  }
  return { username: 'stella-dev' };
}

export async function apiSubscribeRss(url: string): Promise<{ url: string }> {
  await delay(700);
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    if (!parsed.hostname.includes('.')) throw new Error('bad');
  } catch {
    throw new Error('URL de flux RSS invalide.');
  }
  return { url };
}

export async function apiFetchWidgets(): Promise<void> {
  await delay(900);
}

export async function apiRefreshWidget(widgetId: string): Promise<void> {
  await delay(350);
  // Demo: intentional failure for a known bad city
  if (widgetId === 'fail_demo') {
    throw new Error('Le service météo a renvoyé une erreur (ville introuvable).');
  }
}
