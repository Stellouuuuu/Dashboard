import { useEffect, useState } from 'react';
import { SERVICE_LABEL, catalogOf, type WidgetInstance } from '../data/catalog';
import { IMG } from '../data/images';
import { useAppData } from '../context/AppDataContext';
import { IconMore, IconPlay } from '../components/Icons';
import { TimerRing } from './TimerRing';
import { summarize } from './summary';
import { useWidgetRefresh } from './useWidgetRefresh';

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

/** Carte de widget au format « tuile image » du modèle. */
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
  const { frameIdx, openWizard, setInstances, toast, flashUid, addedUid, setFlashUid, setAddedUid } =
    useAppData();
  const refresh = useWidgetRefresh();
  const [menuOpen, setMenuOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
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
    if (flashUid !== inst.uid) return;
    const t = window.setTimeout(() => setFlashUid(null), 900);
    return () => window.clearTimeout(t);
  }, [flashUid, inst.uid, setFlashUid]);

  useEffect(() => {
    if (addedUid !== inst.uid) return;
    const t = window.setTimeout(() => setAddedUid(null), 500);
    return () => window.clearTimeout(t);
  }, [addedUid, inst.uid, setAddedUid]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [menuOpen]);

  if (!cat) return null;
  const data = summarize(inst, frameIdx[inst.uid] || 0);

  const move = (toStart: boolean) =>
    setInstances((list) => {
      const idx = list.findIndex((w) => w.uid === inst.uid);
      if (idx < 0) return list;
      const next = [...list];
      const [m] = next.splice(idx, 1);
      if (toStart) next.unshift(m);
      else next.push(m);
      return next;
    });

  const handleAction = (act: 'reconfigure' | 'start' | 'end' | 'delete') => {
    setMenuOpen(false);
    if (act === 'reconfigure') openWizard(inst.uid);
    if (act === 'start') {
      move(true);
      toast('Widget déplacé au début');
    }
    if (act === 'end') {
      move(false);
      toast('Widget déplacé à la fin');
    }
    if (act === 'delete') {
      setRemoving(true);
      window.setTimeout(() => {
        setInstances((list) => list.filter((w) => w.uid !== inst.uid));
        toast('Widget supprimé');
      }, 220);
    }
  };

  const classes = [
    'wtile',
    isDragging ? 'dragging' : '',
    isDropTarget ? 'drop-target' : '',
    removing ? 'removing' : '',
    addedUid === inst.uid ? 'added' : '',
    flashUid === inst.uid ? 'flash' : '',
    inst.status === 'error' ? 'has-error' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article
      className={classes}
      id={`widget-${inst.uid}`}
      aria-label={`${cat.name} — ${data.kicker}`}
      draggable={!preview && canDrag}
      onDragStart={() => canDrag && onDragStart?.(inst.uid)}
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
      <img className="wtile-img" src={IMG.widget(inst.widgetId)} alt="" loading="lazy" />
      <div className="wtile-shade" aria-hidden="true" />

      <div className="wtile-top">
        <span className="wtile-chip" title={`Rafraîchi toutes les ${inst.refresh} s`}>
          <TimerRing seconds={inst.refresh} onCycle={() => void refresh(inst)} />
          {SERVICE_LABEL[cat.service]}
        </span>
        {!preview && (
          <div className="dropdown">
            <button
              type="button"
              className="wtile-menu-btn"
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
              <button type="button" onClick={() => handleAction('start')}>
                Déplacer en premier
              </button>
              <button type="button" onClick={() => handleAction('end')}>
                Déplacer en dernier
              </button>
              <button type="button" className="danger" onClick={() => handleAction('delete')}>
                Supprimer
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="wtile-bottom">
        <small className="wtile-kicker" title={data.kicker}>
          {cat.name} · {data.kicker}
        </small>
        {inst.status === 'error' ? (
          <p className="wtile-error" role="alert">
            {inst.errorMessage ?? 'Erreur de chargement'}
          </p>
        ) : (
          <div
            className={`wtile-data${inst.status === 'loading' ? ' is-loading' : ''}`}
            aria-busy={inst.status === 'loading'}
          >
            <b className="wtile-title">{data.title}</b>
            {data.lines.slice(0, 2).map((l) => (
              <span key={l}>{l}</span>
            ))}
          </div>
        )}
        {!preview && (
          <button
            type="button"
            className="play-btn wtile-play"
            aria-label={inst.status === 'error' ? 'Réessayer' : 'Rafraîchir maintenant'}
            onClick={() => void refresh(inst)}
          >
            <IconPlay />
          </button>
        )}
      </div>
    </article>
  );
}
