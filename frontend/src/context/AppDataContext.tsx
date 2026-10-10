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
import { useTranslation } from 'react-i18next';
import type { ServiceId, WidgetInstance } from '../data/catalog';
import type { ToastItem } from '../components/Toasts';
import {
  apiListDashboard,
  apiListWidgetCatalog,
  apiMoveDashboardWidget,
  ApiError,
  type ApiWidgetDefinition,
  type ApiWidgetInstance,
} from '../api/client';
import { apiListServices, apiSubscribeService, ServiceApiError } from '../api/services';
import { apiUnlinkGithub, apiRefresh, ApiAuthError } from '../api/auth';

export type ModalId = 'oauth' | 'wizard' | null;

/** Partagé avec WizardModal (POST/PATCH renvoient la même forme de ligne). */
export function toWidgetInstance(row: ApiWidgetInstance): WidgetInstance {
  return {
    uid: row.id,
    widgetId: row.widgetName,
    config: row.config,
    refresh: row.refreshRate,
    position: row.position,
    status: row.status === 'pending' ? 'loading' : row.status,
  };
}

interface AppDataContextValue {
  modal: ModalId;
  openModal: (m: ModalId) => void;
  closeModal: () => void;
  instances: WidgetInstance[];
  setInstances: React.Dispatch<React.SetStateAction<WidgetInstance[]>>;
  /** Réordonne localement puis persiste la position de chaque instance (PATCH .../position). */
  reorderInstances: (list: WidgetInstance[]) => Promise<void>;
  widgetsLoading: boolean;
  widgetsError: string | null;
  loadWidgets: () => Promise<void>;
  catalog: ApiWidgetDefinition[];
  catalogError: string | null;
  setWidgetStatus: (
    uid: number,
    status: WidgetInstance['status'],
    errorMessage?: string,
  ) => void;
  setWidgetData: (uid: number, data: unknown) => void;
  lastRefreshSec: number;
  resetLastRefresh: () => void;
  tickLastRefresh: () => void;
  toast: (msg: string) => void;
  toasts: ToastItem[];
  dismissToast: (id: number) => void;
  githubConnected: boolean;
  githubUsername: string | null;
  githubError: string | null;
  githubLoading: boolean;
  connectGithub: () => Promise<void>;
  disconnectGithub: () => Promise<void>;
  loadServices: () => Promise<void>;
  completeGithubLink: () => Promise<void>;
  isSubscribed: (service: ServiceId) => boolean;
  wizardEditUid: number | null;
  /** Widget présélectionné à l'ouverture de l'assistant (ex. depuis « Widgets disponibles »). */
  wizardPresetId: string | null;
  openWizard: (editUid?: number | null, presetWidgetId?: string | null) => void;
  nextUid: () => number;
  flashUid: number | null;
  setFlashUid: (uid: number | null) => void;
  addedUid: number | null;
  setAddedUid: (uid: number | null) => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [modal, setModal] = useState<ModalId>(null);
  const [instances, setInstances] = useState<WidgetInstance[]>([]);
  const [widgetsLoading, setWidgetsLoading] = useState(true);
  const [widgetsError, setWidgetsError] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<ApiWidgetDefinition[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [lastRefreshSec, setLastRefreshSec] = useState(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubUsername, setGithubUsername] = useState<string | null>(null);
  const [githubError, setGithubError] = useState<string | null>(null);
  const [githubLoading, setGithubLoading] = useState(false);
  const [wizardEditUid, setWizardEditUid] = useState<number | null>(null);
  const [wizardPresetId, setWizardPresetId] = useState<string | null>(null);
  const [flashUid, setFlashUid] = useState<number | null>(null);
  const [addedUid, setAddedUid] = useState<number | null>(null);
  const uidSeq = useRef(100);
  const toastSeq = useRef(0);

  const openModal = useCallback((m: ModalId) => setModal(m), []);
  const closeModal = useCallback(() => setModal(null), []);

  const loadWidgets = useCallback(async () => {
    setWidgetsLoading(true);
    setWidgetsError(null);
    try {
      const rows = await apiListDashboard();
      setInstances(rows.map(toWidgetInstance));
    } catch (e) {
      setWidgetsError(
        e instanceof ApiError ? t(`errors.${e.code}`, { defaultValue: t('dashboard.grid.loadError') }) : t('dashboard.grid.loadError'),
      );
    } finally {
      setWidgetsLoading(false);
    }
  }, [t]);

  const loadCatalog = useCallback(async () => {
    try {
      const rows = await apiListWidgetCatalog();
      setCatalog(rows);
      setCatalogError(null);
    } catch (e) {
      setCatalogError(e instanceof ApiError ? t(`errors.${e.code}`, { defaultValue: t('errors.INTERNAL_ERROR') }) : t('errors.INTERNAL_ERROR'));
    }
  }, [t]);

  // Registre back : source de vérité pour les widgets/paramètres (PLAN.md §4.2),
  // chargé une fois pour tout le dashboard (hero, grille, assistant).
  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const setWidgetStatus = useCallback(
    (uid: number, status: WidgetInstance['status'], errorMessage?: string) => {
      setInstances((list) =>
        list.map((w) =>
          w.uid === uid
            ? { ...w, status, errorMessage: errorMessage ?? undefined }
            : w,
        ),
      );
    },
    [],
  );

  const setWidgetData = useCallback((uid: number, data: unknown) => {
    setInstances((list) => list.map((w) => (w.uid === uid ? { ...w, data } : w)));
  }, []);

  /** Réordonne localement puis persiste chaque position (PATCH .../position, PLAN.md §6.3). */
  const reorderInstances = useCallback(async (list: WidgetInstance[]) => {
    setInstances(list);
    await Promise.all(
      list.map((inst, index) =>
        inst.position === index
          ? null
          : apiMoveDashboardWidget(inst.uid, index).catch(() => {
              /* best-effort : l'ordre local reste correct même si une requête échoue */
            }),
      ),
    );
    setInstances((list2) => list2.map((w, index) => ({ ...w, position: index })));
  }, []);

  const resetLastRefresh = useCallback(() => setLastRefreshSec(0), []);
  const tickLastRefresh = useCallback(() => setLastRefreshSec((s) => s + 1), []);

  const toast = useCallback((msg: string) => {
    toastSeq.current += 1;
    setToasts((t) => [...t, { id: toastSeq.current, message: msg }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const openWizard = useCallback((editUid: number | null = null, presetWidgetId: string | null = null) => {
    setWizardEditUid(editUid);
    setWizardPresetId(presetWidgetId);
    setModal('wizard');
  }, []);

  const nextUid = useCallback(() => {
    uidSeq.current += 1;
    return uidSeq.current;
  }, []);

  const loadServices = useCallback(async () => {
    try {
      const services = await apiListServices();
      const github = services.find((s) => s.name === 'github');
      setGithubConnected(Boolean(github?.subscribed));
    } catch {
      // API indisponible (dev sans Docker, ou pas encore connecté) : on garde l'état
      // local par défaut plutôt que de bloquer la page Services.
    }
  }, []);

  // Vraie redirection OAuth (PLAN.md §6.1) : on quitte la page vers GitHub, impossible
  // à faire dans une modale. `state` signé côté serveur, pas de code client à saisir.
  const connectGithub = useCallback(async () => {
    // Navigation plein-page : contrairement aux appels via api/client.ts, elle ne passe
    // pas par le retry-on-401 qui rafraîchit l'access token (15 min) silencieusement.
    // Sans ça, une session restée ouverte plus de 15 min tombe en AUTH_UNAUTHENTICATED
    // alors que le refresh cookie (30 jours) est encore valide.
    try {
      await apiRefresh();
    } catch {
      // Refresh cookie lui-même expiré : on navigue quand même, l'utilisateur sera
      // redirigé vers le login par le même AUTH_UNAUTHENTICATED qu'avant ce correctif.
    }
    window.location.assign('/api/v1/auth/oauth/github');
  }, []);

  const disconnectGithub = useCallback(async () => {
    setGithubLoading(true);
    setGithubError(null);
    try {
      await apiUnlinkGithub();
      setGithubConnected(false);
      setGithubUsername(null);
      toast(t('services.github.disconnected'));
    } catch (e) {
      setGithubError(e instanceof ApiAuthError ? t(`errors.${e.code}`, { defaultValue: t('errors.INTERNAL_ERROR') }) : t('errors.INTERNAL_ERROR'));
    } finally {
      setGithubLoading(false);
    }
  }, [toast, t]);

  /** Complète le lien OAuth (redirigé depuis /services?github=linked) : s'abonne au service. */
  const completeGithubLink = useCallback(async () => {
    try {
      await apiSubscribeService('github');
      toast(t('services.github.connectedToast'));
    } catch (e) {
      setGithubError(e instanceof ServiceApiError ? t(`errors.${e.code}`, { defaultValue: t('errors.INTERNAL_ERROR') }) : t('errors.INTERNAL_ERROR'));
    } finally {
      await loadServices();
    }
  }, [loadServices, toast, t]);

  // weather et rss sont disponibles par défaut, sans abonnement (PLAN.md §5) —
  // seul github exige une liaison OAuth avant de pouvoir s'y abonner.
  const isSubscribed = useCallback(
    (service: ServiceId) => {
      if (service === 'github') return githubConnected;
      return true;
    },
    [githubConnected],
  );

  const value = useMemo(
    () => ({
      modal,
      openModal,
      closeModal,
      instances,
      setInstances,
      reorderInstances,
      widgetsLoading,
      widgetsError,
      loadWidgets,
      catalog,
      catalogError,
      setWidgetStatus,
      setWidgetData,
      lastRefreshSec,
      resetLastRefresh,
      tickLastRefresh,
      toast,
      toasts,
      dismissToast,
      githubConnected,
      githubUsername,
      githubError,
      githubLoading,
      connectGithub,
      disconnectGithub,
      loadServices,
      completeGithubLink,
      isSubscribed,
      wizardEditUid,
      wizardPresetId,
      openWizard,
      nextUid,
      flashUid,
      setFlashUid,
      addedUid,
      setAddedUid,
    }),
    [
      modal,
      openModal,
      closeModal,
      instances,
      reorderInstances,
      widgetsLoading,
      widgetsError,
      loadWidgets,
      catalog,
      catalogError,
      setWidgetStatus,
      setWidgetData,
      lastRefreshSec,
      resetLastRefresh,
      tickLastRefresh,
      toast,
      toasts,
      dismissToast,
      githubConnected,
      githubUsername,
      githubError,
      githubLoading,
      connectGithub,
      disconnectGithub,
      loadServices,
      completeGithubLink,
      isSubscribed,
      wizardEditUid,
      wizardPresetId,
      openWizard,
      nextUid,
      flashUid,
      addedUid,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}

/** @deprecated use useAppData */
export const useDashboard = useAppData;
