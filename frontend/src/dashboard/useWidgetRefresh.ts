import { useCallback } from 'react';
import { useAppData } from '../context/AppDataContext';
import { apiRefreshWidget } from '../api/demo';
import type { WidgetInstance } from '../data/catalog';

/** Rafraîchit une instance (appel au serveur, puis nouvelle frame de données). */
export function useWidgetRefresh() {
  const { setWidgetStatus, bumpFrame, resetLastRefresh } = useAppData();
  return useCallback(
    async (inst: WidgetInstance) => {
      setWidgetStatus(inst.uid, 'loading');
      try {
        const failKey =
          String(inst.config.city || '').toLowerCase() === 'erreur' ? 'fail_demo' : inst.widgetId;
        await apiRefreshWidget(failKey);
        bumpFrame(inst.uid);
        setWidgetStatus(inst.uid, 'ok');
        resetLastRefresh();
      } catch (e) {
        setWidgetStatus(inst.uid, 'error', e instanceof Error ? e.message : 'Échec du rafraîchissement.');
      }
    },
    [setWidgetStatus, bumpFrame, resetLastRefresh],
  );
}
