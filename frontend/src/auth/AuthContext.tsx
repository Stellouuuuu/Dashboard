import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  apiConfirm,
  apiDeleteAccount,
  apiLogin,
  apiLogout,
  apiRegister,
  apiRestoreSession,
  apiUpdateProfile,
  AuthError,
} from '../api/demo';
import { clearSession, type PublicUser } from './session';

interface AuthContextValue {
  user: PublicUser | null;
  token: string | null;
  expiresAt: number | null;
  bootstrapping: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ confirmToken: string; email: string }>;
  confirm: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  updateProfile: (patch: {
    name?: string;
    serviceCredentials?: PublicUser['serviceCredentials'];
  }) => Promise<void>;
  sessionRemainingMs: number;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const restored = await apiRestoreSession();
        if (cancelled) return;
        if (restored) {
          setUser(restored.user);
          setToken(restored.token);
          setExpiresAt(restored.expiresAt);
        }
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!expiresAt) return;
    if (now >= expiresAt) {
      clearSession();
      setUser(null);
      setToken(null);
      setExpiresAt(null);
    }
  }, [now, expiresAt]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    setUser(res.user);
    setToken(res.token);
    setExpiresAt(res.expiresAt);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      return apiRegister(name, email, password);
    },
    [],
  );

  const confirm = useCallback(async (confirmToken: string) => {
    const res = await apiConfirm(confirmToken);
    setUser(res.user);
    setToken(res.token);
    setExpiresAt(res.expiresAt);
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    setToken(null);
    setExpiresAt(null);
  }, []);

  const deleteAccount = useCallback(
    async (password: string) => {
      if (!user) throw new AuthError('EXPIRED_SESSION', 'Session expirée.');
      await apiDeleteAccount(user.id, password);
      setUser(null);
      setToken(null);
      setExpiresAt(null);
    },
    [user],
  );

  const updateProfile = useCallback(
    async (patch: {
      name?: string;
      serviceCredentials?: PublicUser['serviceCredentials'];
    }) => {
      if (!user) throw new AuthError('EXPIRED_SESSION', 'Session expirée.');
      const updated = await apiUpdateProfile(user.id, patch);
      setUser(updated);
    },
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      token,
      expiresAt,
      bootstrapping,
      isAuthenticated: Boolean(user && token && expiresAt && now < expiresAt),
      isAdmin: user?.role === 'admin',
      login,
      register,
      confirm,
      logout,
      deleteAccount,
      updateProfile,
      sessionRemainingMs: expiresAt ? Math.max(0, expiresAt - now) : 0,
    }),
    [
      user,
      token,
      expiresAt,
      bootstrapping,
      now,
      login,
      register,
      confirm,
      logout,
      deleteAccount,
      updateProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
