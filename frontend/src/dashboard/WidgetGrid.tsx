import { useState } from 'react';
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
  /** Mobile My Home: 2-col masonry, first card full-width. */
  masonry?: boolean;
}

export function WidgetGrid({
  previewCount,
  instancesOverride,
  masonry,
}: WidgetGridProps) {
  const {
    instances,
    setInstances,
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

  if (!isPreview && widgetsError) {
    return (
      <div className="form-banner error" role="alert">
        {widgetsError}{' '}
        <button type="button" className="link-btn" onClick={() => void loadWidgets()}>
          Réessayer
        </button>
      </div>
    );
  }

  if (!isPreview && list.length === 0) {
    const filteredEmpty = instancesOverride !== undefined && instances.length > 0;
    return (
      <EmptyState
        title={filteredEmpty ? 'Aucun widget ici' : 'Ton dashboard est encore vide'}
        description={
          filteredEmpty
            ? 'Aucun widget pour ce service — change de filtre ou ajoute-en un.'
            : 'Ajoute ton premier widget pour ouvrir une porte vers un service — météo, GitHub ou RSS.'
        }
        action={
          <button type="button" className="btn btn-primary" onClick={() => openWizard()}>
            <IconPlus />
            {filteredEmpty ? 'Ajouter un widget' : 'Ajouter mon premier widget'}
          </button>
        }
      />
    );
  }

  const pairFlagUid =
    !isPreview && list.filter((w) => w.pair).length >= 2
      ? list.filter((w) => w.pair)[1]?.uid
      : undefined;

  const handleDrop = (targetUid: number) => {
    if (dragUid === null || dragUid === targetUid) {
      setDragUid(null);
      setOverUid(null);
      return;
    }
    setInstances((prev) => {
      const next = [...prev];
      const from = next.findIndex((w) => w.uid === dragUid);
      const to = next.findIndex((w) => w.uid === targetUid);
      if (from < 0 || to < 0) return prev;
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    toast('Widget déplacé');
    setDragUid(null);
    setOverUid(null);
  };

  return (
    <div className={`grid-widgets${masonry ? ' grid-widgets--masonry' : ''}`}>
      {list.flatMap((inst, index) => {
        const card = (
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
        );

        const wrapped =
          masonry && index === 0 ? (
            <div key={inst.uid} className="grid-widgets-span">
              {card}
            </div>
          ) : (
            card
          );

        if (inst.uid === pairFlagUid) {
          return [
            wrapped,
            <div key="pair-flag" className="pair-flag">
              <span className="line" />
              <span>Même widget, configuration différente → données distinctes</span>
              <span className="line" />
            </div>,
          ];
        }
        return [wrapped];
      })}

      {!isPreview && (
        <button type="button" className="add-card" onClick={() => openWizard()}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>Ajouter un widget</span>
        </button>
      )}
    </div>
  );
}
