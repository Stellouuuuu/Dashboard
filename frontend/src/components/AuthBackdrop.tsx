import type { CSSProperties, ReactNode } from 'react';
import {
  IconGithub,
  IconRss,
  IconWeather,
  ServiceIcon,
} from './Icons';

function IconTimer() {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function IconCommit() {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v6M12 15v6" />
    </svg>
  );
}

const FLOATERS: {
  id: string;
  accent: 'cyan' | 'violet' | 'amber';
  style: CSSProperties;
  delay: string;
  icon: ReactNode;
  label: string;
}[] = [
  {
    id: 'weather',
    accent: 'cyan',
    style: { top: '12%', left: '8%' },
    delay: '0s',
    icon: <IconWeather />,
    label: 'Weather',
  },
  {
    id: 'github',
    accent: 'violet',
    style: { top: '18%', right: '10%' },
    delay: '0.8s',
    icon: <IconGithub />,
    label: 'GitHub',
  },
  {
    id: 'rss',
    accent: 'amber',
    style: { bottom: '22%', left: '12%' },
    delay: '1.4s',
    icon: <IconRss />,
    label: 'RSS',
  },
  {
    id: 'timer',
    accent: 'cyan',
    style: { bottom: '16%', right: '14%' },
    delay: '0.4s',
    icon: <IconTimer />,
    label: 'Timer',
  },
  {
    id: 'commits',
    accent: 'violet',
    style: { top: '42%', left: '4%' },
    delay: '1.1s',
    icon: <IconCommit />,
    label: 'Commits',
  },
  {
    id: 'temp',
    accent: 'amber',
    style: { top: '48%', right: '5%' },
    delay: '1.7s',
    icon: <ServiceIcon service="weather" />,
    label: 'Température',
  },
];

export function AuthBackdrop() {
  return (
    <div className="auth-backdrop" aria-hidden="true">
      <div className="auth-backdrop-glow auth-backdrop-glow--a" />
      <div className="auth-backdrop-glow auth-backdrop-glow--b" />
      <div className="auth-backdrop-glow auth-backdrop-glow--c" />
      <div className="auth-backdrop-grid" />
      <div className="auth-portal">
        <span className="auth-portal-ring pr-outer" />
        <span className="auth-portal-ring pr-mid" />
        <span className="auth-portal-ring pr-inner" />
      </div>
      {FLOATERS.map((f) => (
        <div
          key={f.id}
          className={`auth-floater accent-${f.accent}`}
          style={{ ...f.style, animationDelay: f.delay }}
        >
          <div className="auth-floater-icon">{f.icon}</div>
          <span className="auth-floater-label">{f.label}</span>
        </div>
      ))}
    </div>
  );
}
