import type { ReactNode } from 'react';
import { IconGithub, IconRss, IconWeather } from '../components/Icons';
import { useReducedMotion } from '../hooks/useReducedMotion';

type StackItem = {
  name: string;
  accent: 'cyan' | 'violet' | 'amber';
  icon: ReactNode;
};

const ITEMS: StackItem[] = [
  { name: 'Weather', accent: 'cyan', icon: <IconWeather /> },
  { name: 'OpenWeather', accent: 'cyan', icon: <IconWeather /> },
  { name: 'City temperature', accent: 'cyan', icon: <IconWeather /> },
  { name: 'Precipitation', accent: 'cyan', icon: <IconWeather /> },
  { name: 'GitHub', accent: 'violet', icon: <IconGithub /> },
  { name: 'Recent commits', accent: 'violet', icon: <IconGithub /> },
  { name: 'Security alerts', accent: 'violet', icon: <IconGithub /> },
  { name: 'OAuth 2.0', accent: 'violet', icon: <IconGithub /> },
  { name: 'RSS', accent: 'amber', icon: <IconRss /> },
  { name: 'Atom feeds', accent: 'amber', icon: <IconRss /> },
  { name: 'Article list', accent: 'amber', icon: <IconRss /> },
  { name: 'Feed summary', accent: 'amber', icon: <IconRss /> },
];

function LogoRow({ items }: { items: StackItem[] }) {
  return (
    <>
      {items.map((item, i) => (
        <div key={`${item.name}-${i}`} className={`stack-logo accent-${item.accent}`}>
          <span className="stack-logo-icon">{item.icon}</span>
          <span className="stack-logo-name">{item.name}</span>
        </div>
      ))}
    </>
  );
}

export function ServicesStack() {
  const reduced = useReducedMotion();

  return (
    <section className="services-stack" aria-label="Services intégrables">
      <div className="wrap">
        <div className="services-stack-inner">
          <h2 className="services-stack-title">
            Intégré à ton
            <br />
            stack d&apos;outils
          </h2>

          {reduced ? (
            <ul className="services-stack-static">
              {ITEMS.map((item) => (
                <li key={item.name} className={`stack-logo accent-${item.accent}`}>
                  <span className="stack-logo-icon">{item.icon}</span>
                  <span className="stack-logo-name">{item.name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="services-stack-marquee" aria-hidden="true">
              <div className="stack-track">
                <div className="stack-group">
                  <LogoRow items={ITEMS} />
                </div>
                <div className="stack-group">
                  <LogoRow items={ITEMS} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
