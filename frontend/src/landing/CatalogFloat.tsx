import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { IconGithub, IconRss, IconSpotify, IconWeather, IconWhatsapp } from '../components/Icons';
import { ACCENT, CATALOG, type Accent, type ServiceId } from '../data/catalog';
import { useReducedMotion } from '../hooks/useReducedMotion';

const ICONS: Record<ServiceId, () => ReactNode> = {
  weather: IconWeather,
  github: IconGithub,
  rss: IconRss,
  spotify: IconSpotify,
  whatsapp: IconWhatsapp,
};

const LAYOUT = [
  { side: 'left', offset: '4%' },
  { side: 'right', offset: '6%' },
  { side: 'left', offset: '14%' },
  { side: 'right', offset: '2%' },
  { side: 'left', offset: '8%' },
  { side: 'right', offset: '12%' },
] as const;

export function CatalogFloat() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [active, setActive] = useState(0);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setInView(true);
        });
      },
      { threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const nodes = cardRefs.current.filter(Boolean) as HTMLElement[];
    if (!nodes.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          const idx = Number((visible[0].target as HTMLElement).dataset.i);
          if (!Number.isNaN(idx)) setActive(idx);
        }
      },
      { threshold: [0.4, 0.65, 0.85], rootMargin: '-28% 0px -40% 0px' },
    );

    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  const widgets = CATALOG.filter((w) => !w.comingSoon).slice(0, 6);

  return (
    <section
      id="services"
      ref={sectionRef}
      className={`catalog-float${inView ? ' is-in' : ''}${reduced ? ' reduced' : ''}`}
      aria-labelledby="catalog-title"
    >
      <div className="catalog-float-pin" aria-hidden={false}>
        <div className="catalog-float-copy">
          <p className="eyebrow">Le catalogue</p>
          <h2 id="catalog-title">
            Des services, des widgets -- chacun avec ses vrais paramètres
          </h2>
          <p>
            Chaque widget expose les paramètres qu&apos;il faut configurer pour
            l&apos;ajouter au dashboard. Spotify et WhatsApp arrivent bientôt.
          </p>
        </div>
      </div>

      <div className="catalog-float-stream" aria-label="Widgets du catalogue">
        {widgets.map((widget, i) => {
          const layout = LAYOUT[i] ?? LAYOUT[0];
          const accent: Accent = ACCENT[widget.service];
          const Icon = ICONS[widget.service];
          const params = widget.params.map((p) => p.name).join(', ');

          return (
            <article
              key={widget.id}
              data-i={i}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className={`catalog-wcard accent-${accent}${active === i ? ' is-active' : ''}`}
              style={
                {
                  ['--i']: i,
                  [layout.side === 'left' ? 'marginRight' : 'marginLeft']: 'auto',
                  [layout.side === 'left' ? 'marginLeft' : 'marginRight']: layout.offset,
                } as CSSProperties
              }
            >
              <div className="catalog-wcard-icon" aria-hidden="true">
                <Icon />
              </div>
              <h3>{widget.name}</h3>
              <p>{widget.desc}</p>
              <span className="catalog-wcard-params">{params}</span>
            </article>
          );
        })}
      </div>
    </section>
  );
}
