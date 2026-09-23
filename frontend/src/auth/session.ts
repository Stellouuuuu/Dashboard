export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  confirmed: boolean;
  role: 'user' | 'admin';
  confirmToken: string | null;
  createdAt: string;
  serviceCredentials: {
    githubUsername?: string;
    weatherDefaultCity?: string;
    rssDefaultFeed?: string;
  };
}

export interface SessionPayload {
  token: string;
  expiresAt: number;
  userId: string;
}

const SESSION_KEY = 'threshold-session';
const USERS_KEY = 'threshold-users';
/** Session TTL: 2 hours */
export const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

const SEED_USERS: User[] = [
  {
    id: 'u1',
    name: 'Stella G.',
    email: 'stella@epitech.eu',
    password: 'password123',
    confirmed: true,
    role: 'admin',
    confirmToken: null,
    createdAt: '2025-09-16',
    serviceCredentials: {
      githubUsername: 'stella-dev',
      weatherDefaultCity: 'Cotonou',
      rssDefaultFeed: 'https://blog.example.com/feed',
    },
  },
  {
    id: 'u2',
    name: 'Aichath R.',
    email: 'aichath@epitech.eu',
    password: 'password123',
    confirmed: true,
    role: 'user',
    confirmToken: null,
    createdAt: '2025-09-16',
    serviceCredentials: {},
  },
  {
    id: 'u3',
    name: 'Yao K.',
    email: 'yao.k@mail.com',
    password: 'password123',
    confirmed: false,
    role: 'user',
    confirmToken: 'pending-yao-token',
    createdAt: '2025-09-15',
    serviceCredentials: {},
  },
  {
    id: 'u4',
    name: 'Nadia B.',
    email: 'nadia.b@mail.com',
    password: 'password123',
    confirmed: true,
    role: 'user',
    confirmToken: null,
    createdAt: '2025-09-14',
    serviceCredentials: {},
  },
  {
    id: 'u5',
    name: 'Marc O.',
    email: 'marc.o@mail.com',
    password: 'password123',
    confirmed: false,
    role: 'user',
    confirmToken: 'pending-marc-token',
    createdAt: '2025-09-13',
    serviceCredentials: {},
  },
];

function loadUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) return JSON.parse(raw) as User[];
  } catch {
    /* ignore */
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(SEED_USERS));
  return [...SEED_USERS];
}

function saveUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getUsers(): User[] {
  return loadUsers();
}

export function getUserById(id: string): User | undefined {
  return loadUsers().find((u) => u.id === id);
}

export function getUserByEmail(email: string): User | undefined {
  return loadUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function upsertUser(user: User) {
  const users = loadUsers();
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx >= 0) users[idx] = user;
  else users.push(user);
  saveUsers(users);
}

export function deleteUser(userId: string) {
  saveUsers(loadUsers().filter((u) => u.id !== userId));
}

export function readSession(): SessionPayload | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as SessionPayload;
    if (Date.now() >= session.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function writeSession(session: SessionPayload) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function createToken(): string {
  return `tok_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

export function createConfirmToken(): string {
  return `confirm_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

export type PublicUser = Omit<User, 'password' | 'confirmToken'>;

export function toPublicUser(user: User): PublicUser {
  const { password: _p, confirmToken: _c, ...rest } = user;
  return rest;
}
