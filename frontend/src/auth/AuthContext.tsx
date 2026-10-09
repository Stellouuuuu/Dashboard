import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  apiChangePassword,
  apiConfirm,
  apiDeleteAccount,
  apiLogin,
  apiLogout,
  apiMe,
  apiRefresh,
  apiRegister,
  apiUpdateProfile,
  type RealUser,
} from '../api/auth';
import i18n from '../i18n';
import type { PublicUser } from './types';

const LANG_STORAGE_KEY = 'threshold-lang';

// Durée de vie de l'access token côté serveur (PLAN.md §11) — utilisée uniquement
// pour l'affichage local du compte à rebours, le vrai TTL vit dans le JWT.
const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;

/** Adapte l'utilisateur réel (backend) vers la forme `PublicUser` — `name` reflète
 * `users.name` (PATCH /auth/profile réel), avec repli sur la partie locale de
 * l'email tant qu'aucun nom n'a été choisi. */
function adaptRealUser(u: RealUser): PublicUser {
  return {
    id: String(u.id),
    name: u.name ?? u.email.split('@')[0],
    email: u.email,
    confirmed: u.emailConfirmed,
    role: u.role,
    createdAt: u.createdAt.slice(0, 10),
  };
}

interface AuthContextValue {
  user: PublicUser | null;
  bootstrapping: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    confirmPassword: string,
  ) => Promise<{ message: string; email: string }>;
  confirm: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
  sessionRemainingMs: number;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [now, setNow] = useState(Date.now());
  const accessIssuedAtRef = useRef<number | null>(null);

  const applyUser = useCallback((real: RealUser | null) => {
    if (!real) {
      accessIssuedAtRef.current = null;
      setUser(null);
      return;
    }
    accessIssuedAtRef.current = Date.now();
    setUser(adaptRealUser(real));
    // Le choix explicite en localStorage prime sur la préférence du compte ;
    // sans choix local (nouvel appareil), on adopte celle mémorisée côté back.
    if (!window.localStorage.getItem(LANG_STORAGE_KEY) && real.language) {
      i18n.changeLanguage(real.language);
    }
  }, []);

  // Restaure la session depuis le cookie httpOnly (invisible en JS) : /me directement,
  // ou un /refresh puis un nouveau /me si l'access token a expiré entre deux visites.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await apiMe();
        if (!cancelled) applyUser(me);
      } catch {
        try {
          await apiRefresh();
          const me = await apiMe();
          if (!cancelled) applyUser(me);
        } catch {
          if (!cancelled) applyUser(null);
        }
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyUser]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { user: real } = await apiLogin(email, password);
      applyUser(real);
    },
    [applyUser],
  );

  const register = useCallback(
    async (name: string, email: string, password: string, confirmPassword: string) => {
      const language =
        ((i18n.resolvedLanguage ?? i18n.language ?? 'fr').split('-')[0] as 'fr' | 'en') || 'fr';
      const { message } = await apiRegister(name, email, password, confirmPassword, language);
      return { message, email };
    },
    [],
  );

  // Ne connecte pas automatiquement (le backend n'émet pas de session à la
  // confirmation) : l'utilisateur se connecte ensuite via /login, comme prévu
  // par le parcours PLAN.md §2.1 (confirmation puis authentification).
  const confirm = useCallback(async (email: string, code: string) => {
    await apiConfirm(email, code);
  }, []);

  const logout = useCallback(async () => {
    await apiLogout().catch(() => undefined);
    applyUser(null);
  }, [applyUser]);

  const updateProfile = useCallback(async (name: string) => {
    const updated = await apiUpdateProfile(name);
    setUser((prev) => (prev ? { ...prev, name: updated.name ?? prev.name } : prev));
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await apiChangePassword(currentPassword, newPassword);
  }, []);

  const deleteAccount = useCallback(
    async (password: string) => {
      await apiDeleteAccount(password);
      applyUser(null);
    },
    [applyUser],
  );

  const sessionRemainingMs = accessIssuedAtRef.current
    ? Math.max(0, ACCESS_TOKEN_TTL_MS - (now - accessIssuedAtRef.current))
    : 0;

  const value = useMemo(
    () => ({
      user,
      bootstrapping,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
      login,
      register,
      confirm,
      logout,
      changePassword,
      deleteAccount,
      updateProfile,
      sessionRemainingMs,
    }),
    [
      user,
      bootstrapping,
      login,
      register,
      confirm,
      logout,
      changePassword,
      deleteAccount,
      updateProfile,
      sessionRemainingMs,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
