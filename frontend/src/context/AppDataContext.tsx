import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  INITIAL_INSTANCES,
  type ServiceId,
  type WidgetInstance,
} from '../data/catalog';
import type { ToastItem } from '../components/Toasts';
import { apiConnectGithub, apiFetchWidgets, apiSubscribeRss } from '../api/demo';

export type ModalId = 'oauth' | 'wizard' | null;

interface AppDataContextValue {
  modal: ModalId;
  openModal: (m: ModalId) => void;
  closeModal: () => void;
  instances: WidgetInstance[];
  setInstances: React.Dispatch<React.SetStateAction<WidgetInstance[]>>;
  widgetsLoading: boolean;
  widgetsError: string | null;
  loadWidgets: () => Promise<void>;
  frameIdx: Record<number, number>;
  bumpFrame: (uid: number) => void;
  setWidgetStatus: (
    uid: number,
    status: WidgetInstance['status'],
    errorMessage?: string,
  ) => void;
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
  disconnectGithub: () => void;
  rssUrl: string | null;
  rssError: string | null;
  rssLoading: boolean;
  subscribeRss: (url: string) => Promise<void>;
  unsubscribeRss: () => void;
  isSubscribed: (service: ServiceId) => boolean;
  wizardEditUid: number | null;
  openWizard: (editUid?: number | null) => void;
  nextUid: () => number;
  flashUid: number | null;
  setFlashUid: (uid: number | null) => void;
  addedUid: number | null;
  setAddedUid: (uid: number | null) => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalId>(null);
  const [instances, setInstances] = useState<WidgetInstance[]>([]);
  const [widgetsLoading, setWidgetsLoading] = useState(true);
  const [widgetsError, setWidgetsError] = useState<string | null>(null);
  const [frameIdx, setFrameIdx] = useState<Record<number, number>>({});
  const [lastRefreshSec, setLastRefreshSec] = useState(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubUsername, setGithubUsername] = useState<string | null>(null);
  const [githubError, setGithubError] = useState<string | null>(null);
  const [githubLoading, setGithubLoading] = useState(false);
  const [rssUrl, setRssUrl] = useState<string | null>(null);
  const [rssError, setRssError] = useState<string | null>(null);
  const [rssLoading, setRssLoading] = useState(false);
  const [wizardEditUid, setWizardEditUid] = useState<number | null>(null);
  const [flashUid, setFlashUid] = useState<number | null>(null);
  const [addedUid, setAddedUid] = useState<number | null>(null);
  const uidSeq = useRef(100);
  const toastSeq = useRef(0);
  const hydrated = useRef(false);

  const openModal = useCallback((m: ModalId) => setModal(m), []);
  const closeModal = useCallback(() => setModal(null), []);

  const loadWidgets = useCallback(async () => {
    setWidgetsLoading(true);
    setWidgetsError(null);
    try {
      await apiFetchWidgets();
      if (!hydrated.current) {
        setInstances(INITIAL_INSTANCES.map((w) => ({ ...w, status: 'ok' as const })));
        hydrated.current = true;
      }
    } catch {
      setWidgetsError('Impossible de charger le dashboard. Réessaie.');
    } finally {
      setWidgetsLoading(false);
    }
  }, []);

  const bumpFrame = useCallback((uid: number) => {
    setFrameIdx((prev) => ({ ...prev, [uid]: (prev[uid] || 0) + 1 }));
  }, []);

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

  const resetLastRefresh = useCallback(() => setLastRefreshSec(0), []);
  const tickLastRefresh = useCallback(() => setLastRefreshSec((s) => s + 1), []);

  const toast = useCallback((msg: string) => {
    toastSeq.current += 1;
    setToasts((t) => [...t, { id: toastSeq.current, message: msg }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const openWizard = useCallback((editUid: number | null = null) => {
    setWizardEditUid(editUid);
    setModal('wizard');
  }, []);

  const nextUid = useCallback(() => {
    uidSeq.current += 1;
    return uidSeq.current;
  }, []);

  const connectGithub = useCallback(async () => {
    setGithubLoading(true);
    setGithubError(null);
    try {
      const res = await apiConnectGithub('demo');
      setGithubConnected(true);
      setGithubUsername(res.username);
      toast('GitHub connecté');
      closeModal();
    } catch (e) {
      setGithubError(e instanceof Error ? e.message : 'Connexion GitHub échouée.');
    } finally {
      setGithubLoading(false);
    }
  }, [closeModal, toast]);

  const disconnectGithub = useCallback(() => {
    setGithubConnected(false);
    setGithubUsername(null);
    setGithubError(null);
    toast('GitHub déconnecté');
  }, [toast]);

  const subscribeRss = useCallback(
    async (url: string) => {
      setRssLoading(true);
      setRssError(null);
      try {
        const res = await apiSubscribeRss(url);
        setRssUrl(res.url);
        toast('Flux RSS ajouté');
      } catch (e) {
        setRssError(e instanceof Error ? e.message : 'Abonnement RSS échoué.');
        throw e;
      } finally {
        setRssLoading(false);
      }
    },
    [toast],
  );

  const unsubscribeRss = useCallback(() => {
    setRssUrl(null);
    setRssError(null);
    toast('Désabonnement effectué');
  }, [toast]);

  const isSubscribed = useCallback(
    (service: ServiceId) => {
      if (service === 'weather') return true;
      if (service === 'github') return githubConnected;
      if (service === 'rss') return Boolean(rssUrl);
      return false;
    },
    [githubConnected, rssUrl],
  );

  const value = useMemo(
    () => ({
      modal,
      openModal,
      closeModal,
      instances,
      setInstances,
      widgetsLoading,
      widgetsError,
      loadWidgets,
      frameIdx,
      bumpFrame,
      setWidgetStatus,
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
      rssUrl,
      rssError,
      rssLoading,
      subscribeRss,
      unsubscribeRss,
      isSubscribed,
      wizardEditUid,
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
      widgetsLoading,
      widgetsError,
      loadWidgets,
      frameIdx,
      bumpFrame,
      setWidgetStatus,
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
      rssUrl,
      rssError,
      rssLoading,
      subscribeRss,
      unsubscribeRss,
      isSubscribed,
      wizardEditUid,
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
