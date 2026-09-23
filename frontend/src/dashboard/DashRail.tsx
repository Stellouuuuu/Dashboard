import { Link } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { SERVICE_LABEL, catalogOf, type ServiceId } from '../data/catalog';

const SPOTLIGHTS: {
  id: ServiceId;
  title: string;
  subtitle: string;
  image: string;
}[] = [
  {
    id: 'weather',
    title: 'Weather',
    subtitle: 'Météo live',
    image: '/dash/rail-1.jpg',
  },
  {
    id: 'github',
    title: 'GitHub',
    subtitle: 'Repos & commits',
    image: '/dash/rail-2.jpg',
  },
  {
    id: 'rss',
    title: 'RSS',
    subtitle: 'Flux & articles',
    image: '/dash/rail-3.jpg',
  },
];

const THUMBS = ['/dash/thumb-1.jpg', '/dash/thumb-2.jpg', '/dash/thumb-3.jpg'];
const THUMB_FALLBACKS = ['/dash/thumb-1.svg', '/dash/thumb-2.svg', '/dash/thumb-3.svg'];
const RAIL_FALLBACKS: Record<ServiceId, string> = {
  weather: '/dash/rail-1.svg',
  github: '/dash/rail-2.svg',
  rss: '/dash/rail-3.svg',
  spotify: '/dash/rail-1.svg',
  whatsapp: '/dash/rail-2.svg',
};

/** Demo weekly activity heights (stable visual). */
const WEEK_BARS = [42, 68, 55, 80, 48, 72, 90];
const WEEK_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export function DashRail() {
  const { instances, isSubscribed, openWizard, lastRefreshSec } = useAppData();

  const recent = instances.slice(0, 3);

  return (
    <aside className="dash-rail" aria-label="Services et activité">
      <div className="dash-rail-block">
        <div className="dash-rail-head">
          <h2>Services</h2>
          <Link to="/services" className="dash-rail-more">
            Voir tout
          </Link>
        </div>
        <div className="dash-rail-spots">
          {SPOTLIGHTS.map((spot) => {
            const on = isSubscribed(spot.id);
            return (
              <Link
                key={spot.id}
                to="/services"
                className={`dash-spot${on ? ' is-live' : ''}`}
              >
                <img
                  src={spot.image}
                  alt=""
                  className="dash-spot-img"
                  loading="lazy"
                  onError={(e) => {
                    const el = e.currentTarget;
                    const fb = RAIL_FALLBACKS[spot.id];
                    if (fb && !el.src.endsWith('.svg')) el.src = fb;
                  }}
                />
                <div className="dash-spot-shade" />
                <div className="dash-spot-meta">
                  <b>{spot.title}</b>
                  <span>{on ? spot.subtitle : 'Non connecté'}</span>
                </div>
                <span className="dash-spot-play" aria-hidden="true">
                  ▶
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="dash-rail-block dash-rail-glass">
        <div className="dash-rail-head">
          <h2>Activité</h2>
          <span className="dash-rail-hint">7 jours</span>
        </div>
        <div className="dash-mini-graph" role="img" aria-label="Activité des widgets sur 7 jours">
          <svg viewBox="0 0 200 88" className="dash-mini-svg" aria-hidden="true">
            {WEEK_BARS.map((h, i) => {
              const x = 14 + i * 26;
              const barH = (h / 100) * 64;
              const y = 72 - barH;
              const active = i === WEEK_BARS.length - 1;
              return (
                <g key={WEEK_LABELS[i] + i}>
                  <rect
                    x={x}
                    y={y}
                    width={14}
                    height={barH}
                    rx={5}
                    fill={active ? 'var(--dash-sky)' : 'rgba(255,255,255,0.18)'}
                  />
                  <text
                    x={x + 7}
                    y={84}
                    textAnchor="middle"
                    fontSize="8"
                    fill="var(--text-faint)"
                  >
                    {WEEK_LABELS[i]}
                  </text>
                </g>
              );
            })}
          </svg>
          <p className="dash-mini-caption">
            {instances.length} widgets · refresh il y a {lastRefreshSec}s
          </p>
        </div>
      </div>

      <div className="dash-rail-block dash-rail-glass">
        <div className="dash-rail-head">
          <h2>Récents</h2>
          <button type="button" className="dash-rail-more" onClick={() => openWizard()}>
            + Ajouter
          </button>
        </div>
        <ul className="dash-recent">
          {recent.length === 0 ? (
            <li className="dash-recent-empty">Aucun widget pour l’instant</li>
          ) : (
            recent.map((inst, i) => {
              const cat = catalogOf(inst.widgetId);
              return (
                <li key={inst.uid}>
                  <button
                    type="button"
                    className="dash-recent-row"
                    onClick={() => openWizard(inst.uid)}
                  >
                    <img
                      src={THUMBS[i % THUMBS.length]}
                      alt=""
                      className="dash-recent-thumb"
                      loading="lazy"
                      onError={(e) => {
                        const el = e.currentTarget;
                        const fb = THUMB_FALLBACKS[i % THUMB_FALLBACKS.length];
                        if (!el.src.endsWith('.svg')) el.src = fb;
                      }}
                    />
                    <span className="dash-recent-text">
                      <b>{cat?.name ?? inst.widgetId}</b>
                      <small>
                        {cat ? SERVICE_LABEL[cat.service] : '—'} · {inst.refresh}s
                      </small>
                    </span>
                    <span className="dash-spot-play dash-spot-play--sm" aria-hidden="true">
                      ▶
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </aside>
  );
}
