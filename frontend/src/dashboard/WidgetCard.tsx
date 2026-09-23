import { useEffect, useState } from 'react';
import {
  ACCENT,
  SERVICE_LABEL,
  catalogOf,
  coverVariantFor,
  type WidgetInstance,
} from '../data/catalog';
import { useAppData } from '../context/AppDataContext';
import { IconGrip, IconMore, ServiceIcon } from '../components/Icons';
import { WidgetBody } from './WidgetBody';
import { TimerRing } from './TimerRing';
import { CardCover } from './CardCover';
import { apiRefreshWidget } from '../api/demo';
import { Skeleton } from '../components/Skeleton';

interface WidgetCardProps {
  inst: WidgetInstance;
  preview?: boolean;
  onDragStart?: (uid: number) => void;
  onDragOver?: (uid: number) => void;
  onDrop?: (uid: number) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  isDropTarget?: boolean;
}

export function WidgetCard({
  inst,
  preview,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
  isDropTarget,
}: WidgetCardProps) {
  const {
    frameIdx,
    bumpFrame,
    resetLastRefresh,
    openWizard,
    setInstances,
    toast,
    flashUid,
    addedUid,
    setFlashUid,
    setAddedUid,
    setWidgetStatus,
  } = useAppData();
  const [menuOpen, setMenuOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [bodyKey, setBodyKey] = useState(0);
  const [animateBody, setAnimateBody] = useState(false);
  const [canDrag, setCanDrag] = useState(true);

  const cat = catalogOf(inst.widgetId);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px), (hover: none)');
    const update = () => setCanDrag(!mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (flashUid === inst.uid) {
      const t = window.setTimeout(() => setFlashUid(null), 700);
      return () => window.clearTimeout(t);
    }
  }, [flashUid, inst.uid, setFlashUid]);

  useEffect(() => {
    if (addedUid === inst.uid) {
      const t = window.setTimeout(() => setAddedUid(null), 500);
      return () => window.clearTimeout(t);
    }
  }, [addedUid, inst.uid, setAddedUid]);

  useEffect(() => {
    if (!menuOpen || preview) return;
    const close = () => setMenuOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [menuOpen, preview]);

  if (!cat) return null;
  const accent = ACCENT[cat.service];
  const cfgTag = Object.values(inst.config).slice(0, 2).join(' · ');

  const onRefresh = async () => {
    setWidgetStatus(inst.uid, 'loading');
    try {
      const failKey =
        String(inst.config.city || '').toLowerCase() === 'erreur'
          ? 'fail_demo'
          : inst.widgetId;
      await apiRefreshWidget(failKey);
      bumpFrame(inst.uid);
      setAnimateBody(true);
      setBodyKey((k) => k + 1);
      setWidgetStatus(inst.uid, 'ok');
      resetLastRefresh();
    } catch (e) {
      setWidgetStatus(
        inst.uid,
        'error',
        e instanceof Error ? e.message : 'Échec du rafraîchissement.',
      );
    }
  };

  const handleAction = (act: string) => {
    setMenuOpen(false);
    if (act === 'delete') {
      setRemoving(true);
      window.setTimeout(() => {
        setInstances((list) => list.filter((w) => w.uid !== inst.uid));
        toast('Widget supprimé');
      }, 220);
    } else if (act === 'move-start') {
      setInstances((list) => {
        const idx = list.findIndex((w) => w.uid === inst.uid);
        if (idx < 0) return list;
        const next = [...list];
        const [m] = next.splice(idx, 1);
        next.unshift(m);
        return next;
      });
      toast('Widget déplacé au début');
    } else if (act === 'move-end') {
      setInstances((list) => {
        const idx = list.findIndex((w) => w.uid === inst.uid);
        if (idx < 0) return list;
        const next = [...list];
        const [m] = next.splice(idx, 1);
        next.push(m);
        return next;
      });
      toast('Widget déplacé à la fin');
    } else if (act === 'reconfigure') {
      openWizard(inst.uid);
    }
  };

  const classes = [
    'wcard',
    `accent-${accent}`,
    isDragging ? 'dragging' : '',
    isDropTarget ? 'drop-target' : '',
    removing ? 'removing' : '',
    addedUid === inst.uid ? 'added' : '',
    flashUid === inst.uid ? 'flash' : '',
    preview ? 'preview-card-static' : '',
    inst.status === 'error' ? 'has-error' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      data-uid={inst.uid}
      draggable={!preview && canDrag}
      onDragStart={() => {
        if (!canDrag) return;
        onDragStart?.(inst.uid);
      }}
      onDragEnd={() => onDragEnd?.()}
      onDragOver={(e) => {
        if (preview || !canDrag) return;
        e.preventDefault();
        onDragOver?.(inst.uid);
      }}
      onDrop={(e) => {
        if (preview || !canDrag) return;
        e.preventDefault();
        onDrop?.(inst.uid);
      }}
    >
      <div className="wcard-media">
        <CardCover service={cat.service} variant={coverVariantFor(cat.id)} />
        <div className="wcard-media-actions">
          {!preview && canDrag && <IconGrip />}
          <div className="wcard-top-actions">
            <TimerRing seconds={inst.refresh} onCycle={() => void onRefresh()} />
            {!preview && (
              <div className="dropdown">
                <button
                  type="button"
                  className="wcard-menu-btn"
                  aria-label="Options du widget"
                  aria-expanded={menuOpen}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen((o) => !o);
                  }}
                >
                  <IconMore />
                </button>
                <div className={`menu${menuOpen ? ' open' : ''}`}>
                  <button type="button" onClick={() => handleAction('reconfigure')}>
                    Reconfigurer
                  </button>
                  <button type="button" onClick={() => handleAction('move-start')}>
                    Déplacer en premier
                  </button>
                  <button type="button" onClick={() => handleAction('move-end')}>
                    Déplacer en dernier
                  </button>
                  <button type="button" className="danger" onClick={() => handleAction('delete')}>
                    Supprimer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="wcard-media-badge">
          <ServiceIcon service={cat.service} />
        </div>
      </div>

      <div className="wcard-meta">
        <div className="wcard-titles">
          <b>{cat.name}</b>
        </div>
        <div className="wcard-creator">
          <span className="wcard-creator-av" aria-hidden="true">
            <ServiceIcon service={cat.service} />
          </span>
          <span>{SERVICE_LABEL[cat.service]}</span>
        </div>
      </div>

      {inst.status === 'loading' ? (
        <div className="wcard-body">
          <Skeleton style={{ width: '45%', height: 28, marginBottom: 10 }} />
          <Skeleton style={{ width: '70%', height: 12 }} />
        </div>
      ) : inst.status === 'error' ? (
        <div className="wcard-body widget-error" role="alert">
          <p>{inst.errorMessage ?? 'Erreur de chargement'}</p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => void onRefresh()}>
            Réessayer
          </button>
          <p className="field-hint">Astuce démo : ville « Erreur » provoque un échec.</p>
        </div>
      ) : (
        <WidgetBody
          key={bodyKey}
          inst={inst}
          frameIndex={frameIdx[inst.uid] || 0}
          animate={animateBody}
        />
      )}

      <div className="wcard-foot">
        <span className="cfg-tag">{cfgTag}</span>
      </div>
    </div>
  );
}
