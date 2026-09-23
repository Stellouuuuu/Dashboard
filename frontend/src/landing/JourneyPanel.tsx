import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

type Step = {
  title: string;
  body: string;
  accent: 'cyan' | 'violet' | 'amber' | 'green';
  icon: ReactNode;
};

const EYEBROW = 'Le parcours';
const TITLE = 'Quatre étapes, ensuite tout tourne tout seul';
const LEAD =
  "Après ça, c'est un mécanisme central -- le timer -- qui garde chaque widget à jour à son propre rythme.";

const STEPS: Step[] = [
  {
    title: 'Crée ton compte',
    body: "Inscription puis confirmation par email -- indispensable avant d'accéder à la plateforme.",
    accent: 'cyan',
    icon: (
      <svg className="icon" viewBox="0 0 24 24">
        <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    title: 'Abonne-toi à un service',
    body: 'Weather est prêt immédiatement. GitHub se connecte en OAuth, RSS avec une simple URL.',
    accent: 'violet',
    icon: (
      <svg className="icon" viewBox="0 0 24 24">
        <path d="M8 12l3 3 6-7" />
        <rect x="3" y="4" width="18" height="16" rx="3" />
      </svg>
    ),
  },
  {
    title: 'Ajoute un widget',
    body: 'Choisis-le, configure ses paramètres, fixe sa fréquence de rafraîchissement.',
    accent: 'amber',
    icon: (
      <svg className="icon" viewBox="0 0 24 24">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    title: 'Regarde-le vivre',
    body: "Le timer déclenche les mises à jour en arrière-plan, à l'intervalle que tu as choisi.",
    accent: 'green',
    icon: (
      <svg className="icon" viewBox="0 0 24 24">
        <path d="M12 6v6l4 2" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
  },
];

function useTypewriter(full: string, enabled: boolean, reduced: boolean, msPerChar = 14) {
  const [text, setText] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setText('');
      setDone(false);
      return;
    }
    if (reduced) {
      setText(full);
      setDone(true);
      return;
    }

    setText('');
    setDone(false);
    let i = 0;
    let timer = 0;

    const tick = () => {
      i += 1;
      setText(full.slice(0, i));
      if (i < full.length) {
        timer = window.setTimeout(tick, msPerChar);
      } else {
        setDone(true);
      }
    };

    timer = window.setTimeout(tick, 40);
    return () => window.clearTimeout(timer);
  }, [enabled, full, reduced, msPerChar]);

  return { text, done };
}

export function JourneyPanel() {
  const reduced = useReducedMotion();
  const sheetRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [sheetIn, setSheetIn] = useState(false);
  const [active, setActive] = useState(0);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  const eyebrow = useTypewriter(EYEBROW, sheetIn, reduced, 28);
  const title = useTypewriter(TITLE, sheetIn && eyebrow.done, reduced, 22);
  const lead = useTypewriter(LEAD, sheetIn && title.done, reduced, 18);

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setSheetIn(true);
        });
      },
      { threshold: 0.12 },
    );
    io.observe(sheet);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const root = listRef.current;
    const nodes = itemRefs.current.filter(Boolean) as HTMLElement[];
    if (!root || !nodes.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          const idx = Number((visible[0].target as HTMLElement).dataset.step);
          if (!Number.isNaN(idx)) setActive(idx);
        }
      },
      { root, threshold: [0.45, 0.7, 0.9], rootMargin: '-12% 0px -35% 0px' },
    );

    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  const typing = sheetIn && !lead.done && !reduced;

  return (
    <section
      id="how"
      ref={sheetRef}
      className={`journey${sheetIn ? ' is-in' : ''}${reduced ? ' reduced' : ''}`}
      aria-labelledby="journey-title"
    >
      <div className="journey-sheet">
        <div className="journey-glow" aria-hidden="true" />
        <div className="wrap journey-wrap">
          <div className="journey-layout">
            <aside className="journey-sticky">
              <p className="eyebrow" aria-label={EYEBROW}>
                {eyebrow.text}
                {typing && !eyebrow.done ? <span className="type-caret" aria-hidden="true" /> : null}
              </p>
              <h2 id="journey-title" aria-label={TITLE}>
                {title.text}
                {typing && eyebrow.done && !title.done ? (
                  <span className="type-caret" aria-hidden="true" />
                ) : null}
              </h2>
              <p className="journey-lead" aria-label={LEAD}>
                {lead.text}
                {typing && title.done && !lead.done ? (
                  <span className="type-caret" aria-hidden="true" />
                ) : null}
              </p>
            </aside>

            <div className="journey-card-shell">
              <div
                className="journey-list"
                ref={listRef}
                role="list"
                tabIndex={0}
                aria-label="Les quatre étapes du parcours"
              >
                {STEPS.map((step, i) => (
                  <article
                    key={step.title}
                    role="listitem"
                    data-step={i}
                    ref={(el) => {
                      itemRefs.current[i] = el;
                    }}
                    className={`journey-item accent-${step.accent}${active === i ? ' is-active' : ''}`}
                    style={{ ['--i' as string]: i }}
                  >
                    <div className="journey-item-icon" aria-hidden="true">
                      {step.icon}
                    </div>
                    <div className="journey-item-copy">
                      <h3>{step.title}</h3>
                      <p>{step.body}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
