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
  /** Grille du dashboard principal (colonnes adaptées au mobile). */
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

  // Erreur bloquante seulement s'il n'y a rien à afficher ; sinon on garde la grille
  // (données de démo ou dernière version chargée) avec un avertissement discret.
  if (!isPreview && widgetsError && list.length === 0) {
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
    <>
      {!isPreview && widgetsError && (
        <p className="grid-notice" role="status">
          {widgetsError}{' '}
          <button type="button" className="link-btn" onClick={() => void loadWidgets()}>
            Réessayer
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
            <span>Ajouter un widget</span>
          </button>
        )}
      </div>
    </>
  );
}
