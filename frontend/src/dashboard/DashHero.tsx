import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppData } from '../context/AppDataContext';
import { IMG } from '../data/images';
import { widgetName } from '../i18n/widgets';
import { IconBook, IconBookmark, IconChevron, IconFlame, IconPlus } from '../components/Icons';
import { summarizeData } from './summary';
import { useWidgetRefresh } from './useWidgetRefresh';

/** Bannière « À la une » : fait défiler les widgets de l'utilisateur. */
export function DashHero() {
  const { t } = useTranslation();
  const { instances, catalog, openWizard, setFlashUid } = useAppData();
  const refresh = useWidgetRefresh();
  const [index, setIndex] = useState(0);

  if (instances.length === 0) {
    return (
      <section className="hero glass" aria-labelledby="hero-title">
        <img className="hero-img" src={IMG.hero.weather} alt="" />
        <div className="hero-shade" aria-hidden="true" />
        <div className="hero-content">
          <span className="hero-badge">
            <IconFlame /> {t('dashboard.hero.emptyBadge')}
          </span>
          <h1 id="hero-title">{t('dashboard.hero.emptyTitle')}</h1>
          <p>{t('dashboard.hero.emptyLead')}</p>
          <div className="hero-actions">
            <button type="button" className="btn-white" onClick={() => openWizard()}>
              <IconPlus /> {t('dashboard.hero.addWidget')}
            </button>
          </div>
        </div>
      </section>
    );
  }

  const i = index % instances.length;
  const inst = instances[i];
  const def = catalog.find((w) => w.name === inst.widgetId);
  const data = summarizeData(inst.widgetId, inst.data);
  const go = (delta: number) => setIndex((n) => (n + delta + instances.length) % instances.length);

  const showCard = () => {
    document.getElementById(`widget-${inst.uid}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setFlashUid(inst.uid);
  };

  return (
    <section className="hero glass" aria-labelledby="hero-title" aria-roledescription="carrousel">
      <img className="hero-img" src={def ? IMG.hero[def.service] : IMG.hero.weather} alt="" />
      <div className="hero-shade" aria-hidden="true" />
      <div className="hero-content">
        <span className="hero-badge">
          <IconFlame /> {t('dashboard.hero.featuredBadge')}
        </span>
        <div className="hero-tags">
          {def && <span className="tag">{t(`common.services.${def.service}`)}</span>}
          <span className="tag">{t('dashboard.hero.every', { count: inst.refresh })}</span>
        </div>
        <h1 id="hero-title">
          {def && widgetName(t, def.name)} :<br />
          {data.kicker || data.title}
        </h1>
        <p>
          {data.title}
          {data.lines.length ? ` — ${data.lines.slice(0, 2).join(' · ')}` : ''}
        </p>
        <div className="hero-actions">
          <button type="button" className="btn-white" onClick={showCard}>
            {t('dashboard.hero.view')}
          </button>
          <button type="button" className="btn-outline-white" onClick={() => openWizard(inst.uid)}>
            <IconBook /> {t('dashboard.hero.reconfigure')}
          </button>
          <button
            type="button"
            className="btn-round-white"
            aria-label={t('dashboard.hero.refreshNow')}
            title={t('dashboard.hero.refreshNow')}
            onClick={() => void refresh(inst)}
          >
            <IconBookmark />
          </button>
        </div>
      </div>
      {instances.length > 1 && (
        <div className="hero-nav">
          <button type="button" className="round-glass" aria-label={t('dashboard.hero.prev')} onClick={() => go(-1)}>
            <IconChevron dir="left" />
          </button>
          <button type="button" className="round-glass" aria-label={t('dashboard.hero.next')} onClick={() => go(1)}>
            <IconChevron dir="right" />
          </button>
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {t('dashboard.hero.counter', { current: i + 1, total: instances.length })}
      </p>
    </section>
  );
}
