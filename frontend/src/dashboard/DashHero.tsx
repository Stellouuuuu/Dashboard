import { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { SERVICE_LABEL, catalogOf } from '../data/catalog';
import { IMG } from '../data/images';
import { IconBook, IconBookmark, IconChevron, IconFlame, IconPlay, IconPlus } from '../components/Icons';
import { summarize } from './summary';
import { useWidgetRefresh } from './useWidgetRefresh';

/** Bannière « À la une » : fait défiler les widgets de l'utilisateur. */
export function DashHero() {
  const { instances, frameIdx, openWizard, setFlashUid } = useAppData();
  const refresh = useWidgetRefresh();
  const [index, setIndex] = useState(0);

  if (instances.length === 0) {
    return (
      <section className="hero glass" aria-labelledby="hero-title">
        <img className="hero-img" src={IMG.hero.weather} alt="" />
        <div className="hero-shade" aria-hidden="true" />
        <div className="hero-content">
          <span className="hero-badge">
            <IconFlame /> Bienvenue
          </span>
          <h1 id="hero-title">Ton dashboard est vide</h1>
          <p>Ajoute ton premier widget : météo, commits GitHub ou flux RSS.</p>
          <div className="hero-actions">
            <button type="button" className="btn-white" onClick={() => openWizard()}>
              <IconPlus /> Ajouter un widget
            </button>
          </div>
        </div>
      </section>
    );
  }

  const i = index % instances.length;
  const inst = instances[i];
  const cat = catalogOf(inst.widgetId);
  const data = summarize(inst, frameIdx[inst.uid] || 0);
  const go = (delta: number) => setIndex((n) => (n + delta + instances.length) % instances.length);

  const showCard = () => {
    document.getElementById(`widget-${inst.uid}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setFlashUid(inst.uid);
  };

  return (
    <section className="hero glass" aria-labelledby="hero-title" aria-roledescription="carrousel">
      <img className="hero-img" src={cat ? IMG.hero[cat.service] : IMG.hero.weather} alt="" />
      <div className="hero-shade" aria-hidden="true" />
      <div className="hero-content">
        <span className="hero-badge">
          <IconFlame /> Widget à la une
        </span>
        <div className="hero-tags">
          {cat && <span className="tag">{SERVICE_LABEL[cat.service]}</span>}
          <span className="tag">Toutes les {inst.refresh} s</span>
        </div>
        <h1 id="hero-title">
          {cat?.name} :<br />
          {data.kicker || data.title}
        </h1>
        <p>
          {data.title}
          {data.lines.length ? ` — ${data.lines.slice(0, 2).join(' · ')}` : ''}
        </p>
        <div className="hero-actions">
          <button type="button" className="btn-white" onClick={showCard}>
            <IconPlay /> Voir
          </button>
          <button type="button" className="btn-outline-white" onClick={() => openWizard(inst.uid)}>
            <IconBook /> Reconfigurer
          </button>
          <button
            type="button"
            className="btn-round-white"
            aria-label="Rafraîchir maintenant"
            title="Rafraîchir maintenant"
            onClick={() => void refresh(inst)}
          >
            <IconBookmark />
          </button>
        </div>
      </div>
      {instances.length > 1 && (
        <div className="hero-nav">
          <button type="button" className="round-glass" aria-label="Widget précédent" onClick={() => go(-1)}>
            <IconChevron dir="left" />
          </button>
          <button type="button" className="round-glass" aria-label="Widget suivant" onClick={() => go(1)}>
            <IconChevron dir="right" />
          </button>
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        Widget {i + 1} sur {instances.length}
      </p>
    </section>
  );
}
