import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { WidgetInstance } from '../data/catalog';
import { IMG } from '../data/images';
import { widgetName } from '../i18n/widgets';
import { useAppData } from '../context/AppDataContext';
import { apiDeleteDashboardWidget, ApiError } from '../api/client';
import { IconMore } from '../components/Icons';
import { TimerRing } from './TimerRing';
import { summarizeData } from './summary';
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
  const { t } = useTranslation();
  const {
    catalog,
    instances,
    setInstances,
    reorderInstances,
    toast,
    flashUid,
    addedUid,
    setFlashUid,
    setAddedUid,
    openWizard,
  } = useAppData();
  const refresh = useWidgetRefresh();
  const [menuOpen, setMenuOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [canDrag, setCanDrag] = useState(true);
  const def = catalog.find((w) => w.name === inst.widgetId);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px), (hover: none)');
    const update = () => setCanDrag(!mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Premier chargement des vraies données — sinon la carte resterait vide jusqu'au
  // premier cycle du Timer (jusqu'à `refresh` secondes, voir TimerRing).
  useEffect(() => {
    if (inst.data === undefined && inst.status !== 'error') void refresh(inst);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inst.uid]);

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

  if (!def) return null;
  const data = summarizeData(inst.widgetId, inst.data);

  const move = (toStart: boolean) => {
    const idx = instances.findIndex((w) => w.uid === inst.uid);
    if (idx < 0) return;
    const next = [...instances];
    const [m] = next.splice(idx, 1);
    if (toStart) next.unshift(m);
    else next.push(m);
    void reorderInstances(next);
  };

  const handleAction = (act: 'reconfigure' | 'refresh' | 'start' | 'end' | 'delete') => {
    setMenuOpen(false);
    if (act === 'reconfigure') openWizard(inst.uid);
    if (act === 'refresh') void refresh(inst);
    if (act === 'start') {
      move(true);
      toast(t('dashboard.card.movedFirst'));
    }
    if (act === 'end') {
      move(false);
      toast(t('dashboard.card.movedLast'));
    }
    if (act === 'delete') {
      setRemoving(true);
      apiDeleteDashboardWidget(inst.uid)
        .then(() => {
          window.setTimeout(() => {
            setInstances((list) => list.filter((w) => w.uid !== inst.uid));
            toast(t('dashboard.card.deleted'));
          }, 220);
        })
        .catch((e) => {
          setRemoving(false);
          toast(e instanceof ApiError ? t(`errors.${e.code}`, { defaultValue: t('dashboard.card.deleteFailed') }) : t('dashboard.card.deleteFailed'));
        });
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

  const displayName = widgetName(t, def.name);

  const svcLabel = t(`common.services.${def.service}`);

  return (
    <article
      className={classes}
      id={`widget-${inst.uid}`}
      aria-label={`${displayName} — ${data.kicker}`}
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
        <span className="wtile-chip" title={t('dashboard.card.refreshedEvery', { count: inst.refresh })}>
          <TimerRing seconds={inst.refresh} onCycle={() => void refresh(inst)} />
          {svcLabel}
        </span>
        {!preview && (
          <div className="dropdown">
            <button
              type="button"
              className="wtile-menu-btn"
              aria-label={t('dashboard.card.optionsLabel')}
              aria-expanded={menuOpen}
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((o) => !o);
              }}
            >
              <IconMore />
            </button>
            <div className={`menu${menuOpen ? ' open' : ''}`}>
              <button type="button" onClick={() => handleAction('refresh')}>
                {inst.status === 'error' ? t('dashboard.card.retry') : t('dashboard.card.refresh')}
              </button>
              <button type="button" onClick={() => handleAction('reconfigure')}>
                {t('dashboard.card.reconfigure')}
              </button>
              <button type="button" onClick={() => handleAction('start')}>
                {t('dashboard.card.moveFirst')}
              </button>
              <button type="button" onClick={() => handleAction('end')}>
                {t('dashboard.card.moveLast')}
              </button>
              <button type="button" className="danger" onClick={() => handleAction('delete')}>
                {t('dashboard.card.delete')}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="wtile-bottom">
        <small className="wtile-kicker" title={data.kicker}>
          {displayName} · {data.kicker}
        </small>
        {inst.status === 'error' ? (
          <p className="wtile-error" role="alert">
            {inst.errorMessage ?? t('dashboard.card.loadError')}
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
      </div>
    </article>
  );
}
