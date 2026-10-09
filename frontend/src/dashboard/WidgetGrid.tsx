import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppData } from '../context/AppDataContext';
import type { WidgetInstance } from '../data/catalog';
import { EmptyState } from '../components/EmptyState';
import { DashboardSkeleton } from '../components/Skeleton';
import { IconPlus } from '../components/Icons';
import { WidgetCard } from './WidgetCard';

interface WidgetGridProps {
  previewCount?: number;
  /** When set, render this list instead of all instances (e.g. service filter). */
  instancesOverride?: WidgetInstance[];
  /** Grille du dashboard principal (colonnes adaptées au mobile). */
  masonry?: boolean;
}

export function WidgetGrid({
  previewCount,
  instancesOverride,
  masonry,
}: WidgetGridProps) {
  const { t } = useTranslation();
  const {
    instances,
    reorderInstances,
    openWizard,
    toast,
    widgetsLoading,
    widgetsError,
    loadWidgets,
  } = useAppData();
  const [dragUid, setDragUid] = useState<number | null>(null);
  const [overUid, setOverUid] = useState<number | null>(null);

  const source = instancesOverride ?? instances;
  const list = previewCount === undefined ? source : source.slice(0, previewCount);
  const isPreview = previewCount !== undefined;

  if (!isPreview && widgetsLoading) return <DashboardSkeleton />;

  // Erreur bloquante seulement s'il n'y a rien à afficher ; sinon on garde la grille
  // (données de démo ou dernière version chargée) avec un avertissement discret.
  if (!isPreview && widgetsError && list.length === 0) {
    return (
      <div className="form-banner error" role="alert">
        {widgetsError}{' '}
        <button type="button" className="link-btn" onClick={() => void loadWidgets()}>
          {t('dashboard.grid.retry')}
        </button>
      </div>
    );
  }

  if (!isPreview && list.length === 0) {
    const filteredEmpty = instancesOverride !== undefined && instances.length > 0;
    return (
      <EmptyState
        title={t(filteredEmpty ? 'dashboard.grid.emptyFilteredTitle' : 'dashboard.grid.emptyTitle')}
        description={t(filteredEmpty ? 'dashboard.grid.emptyFilteredDesc' : 'dashboard.grid.emptyDesc')}
        action={
          <button type="button" className="btn btn-primary" onClick={() => openWizard()}>
            <IconPlus />
            {t(filteredEmpty ? 'dashboard.grid.addWidget' : 'dashboard.grid.addFirstWidget')}
          </button>
        }
      />
    );
  }

  const handleDrop = (targetUid: number) => {
    if (dragUid === null || dragUid === targetUid) {
      setDragUid(null);
      setOverUid(null);
      return;
    }
    const next = [...instances];
    const from = next.findIndex((w) => w.uid === dragUid);
    const to = next.findIndex((w) => w.uid === targetUid);
    if (from >= 0 && to >= 0) {
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      void reorderInstances(next);
      toast(t('dashboard.grid.moved'));
    }
    setDragUid(null);
    setOverUid(null);
  };

  return (
    <>
      {!isPreview && widgetsError && (
        <p className="grid-notice" role="status">
          {widgetsError}{' '}
          <button type="button" className="link-btn" onClick={() => void loadWidgets()}>
            {t('dashboard.grid.retry')}
          </button>
        </p>
      )}
      <div className={`grid-widgets${masonry ? ' grid-widgets--masonry' : ''}`}>
        {list.map((inst) => (
          <WidgetCard
            key={inst.uid}
            inst={inst}
            preview={isPreview}
            isDragging={dragUid === inst.uid}
            isDropTarget={overUid === inst.uid && dragUid !== inst.uid}
            onDragStart={(uid) => setDragUid(uid)}
            onDragOver={(uid) => setOverUid(uid)}
            onDrop={handleDrop}
            onDragEnd={() => {
              setDragUid(null);
              setOverUid(null);
            }}
          />
        ))}

        {!isPreview && (
          <button type="button" className="add-card" onClick={() => openWizard()}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>{t('dashboard.grid.addWidget')}</span>
          </button>
        )}
      </div>
    </>
  );
}
