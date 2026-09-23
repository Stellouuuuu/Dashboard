import { catalogOf, SERVICE_LABEL, type WidgetInstance } from '../data/catalog';

const CARD_IMGS = [
  '/dash/card-1.jpg',
  '/dash/card-2.jpg',
  '/dash/card-3.jpg',
  '/dash/card-4.jpg',
];

const CARD_FALLBACKS = [
  '/dash/card-1.svg',
  '/dash/card-2.svg',
  '/dash/card-3.svg',
  '/dash/card-4.svg',
];

interface DashWidgetStripProps {
  instances: WidgetInstance[];
  onOpen?: (uid: number) => void;
}

export function DashWidgetStrip({ instances, onOpen }: DashWidgetStripProps) {
  if (instances.length === 0) return null;

  return (
    <section className="dash-strip" aria-label="Widgets en vedette">
      <div className="dash-strip-head">
        <h2>Mes widgets</h2>
        <span className="dash-strip-count">{instances.length}</span>
      </div>
      <div className="dash-strip-track">
        {instances.map((inst, i) => {
          const cat = catalogOf(inst.widgetId);
          const img = CARD_IMGS[i % CARD_IMGS.length];
          const fallback = CARD_FALLBACKS[i % CARD_FALLBACKS.length];
          return (
            <button
              key={inst.uid}
              type="button"
              className="dash-strip-card"
              onClick={() => onOpen?.(inst.uid)}
            >
              <img
                src={img}
                alt=""
                className="dash-strip-img"
                loading="lazy"
                onError={(e) => {
                  const el = e.currentTarget;
                  if (el.src !== fallback) el.src = fallback;
                }}
              />
              <div className="dash-strip-shade" />
              <div className="dash-strip-meta">
                <b>{cat?.name ?? inst.widgetId}</b>
                <span>
                  {cat ? SERVICE_LABEL[cat.service] : '—'} · {inst.refresh}s
                </span>
              </div>
              <span className="dash-spot-play" aria-hidden="true">
                ▶
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
