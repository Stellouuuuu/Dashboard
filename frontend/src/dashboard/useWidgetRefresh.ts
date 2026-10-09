import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppData } from '../context/AppDataContext';
import { apiGetDashboardWidgetData, ApiError } from '../api/client';
import type { WidgetInstance } from '../data/catalog';

/** Rafraîchit une instance : GET /dashboard/widgets/:id/data (Timer, PLAN.md §4.3). */
export function useWidgetRefresh() {
  const { t } = useTranslation();
  const { setWidgetStatus, setWidgetData, resetLastRefresh } = useAppData();
  return useCallback(
    async (inst: WidgetInstance, force = false) => {
      setWidgetStatus(inst.uid, 'loading');
      try {
        const res = await apiGetDashboardWidgetData(inst.uid, force);
        setWidgetData(inst.uid, res.data);
        setWidgetStatus(inst.uid, 'ok');
        resetLastRefresh();
      } catch (e) {
        const message =
          e instanceof ApiError
            ? t(`errors.${e.code}`, { defaultValue: t('dashboard.card.loadError') })
            : t('dashboard.card.loadError');
        setWidgetStatus(inst.uid, 'error', message);
      }
    },
    [setWidgetStatus, setWidgetData, resetLastRefresh, t],
  );
}
