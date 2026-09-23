import { type CSSProperties } from 'react';
import { ServiceIcon } from '../components/Icons';
import { WidgetBody } from '../dashboard/WidgetBody';
import { CardCover } from '../dashboard/CardCover';
import {
  ACCENT,
  SERVICE_LABEL,
  catalogOf,
  coverVariantFor,
  type WidgetInstance,
} from '../data/catalog';
import { useReducedMotion } from '../hooks/useReducedMotion';

const ORBIT_INSTANCES: WidgetInstance[] = [
  {
    uid: 101,
    widgetId: 'city_temperature',
    config: { city: 'San Francisco', unit: '°C' },
    refresh: 30,
    frameKey: 'temp_paris',
  },
  {
    uid: 102,
    widgetId: 'recent_commits',
    config: { repo: 'org/threshold', limit: 3 },
    refresh: 45,
  },
  {
    uid: 103,
    widgetId: 'article_list',
    config: { feed_url: 'tech.rss/feed', number: 2 },
    refresh: 60,
  },
  {
    uid: 104,
    widgetId: 'security_alerts',
    config: { repo: 'org/threshold', severity: 'medium' },
    refresh: 50,
  },
  {
    uid: 105,
    widgetId: 'now_playing',
    config: { account: 'demo' },
    refresh: 20,
  },
  {
    uid: 106,
    widgetId: 'unread_chats',
    config: { filter: 'all' },
    refresh: 15,
  },
];

function OrbitPreview({ inst }: { inst: WidgetInstance }) {
  if (inst.widgetId === 'now_playing') {
    return (
      <div className="orbit-preview orbit-preview--music">
        <p className="orbit-preview-title">Therefore I Am</p>
        <p className="orbit-preview-sub">Billie Eilish</p>
        <div className="orbit-neumorph-controls" aria-hidden="true">
          <span />
          <span className="orbit-neumorph-play" />
          <span />
        </div>
        <div className="orbit-wave" aria-hidden="true" />
      </div>
    );
  }
  if (inst.widgetId === 'unread_chats') {
    return (
      <div className="orbit-preview orbit-preview--chat">
        <div className="orbit-chat-row">
          <span className="orbit-chat-av" />
          <div>
            <b>Alex</b>
            <small>On se voit demain ?</small>
          </div>
        </div>
        <div className="orbit-chat-row">
          <span className="orbit-chat-av" />
          <div>
            <b>Équipe</b>
            <small>3 messages non lus</small>
          </div>
        </div>
      </div>
    );
  }
  return <WidgetBody inst={inst} frameIndex={0} />;
}

export function HeroWidgets() {
  const reduced = useReducedMotion();
  const count = ORBIT_INSTANCES.length;

  return (
    <div
      className={`hero-widgets hero-widgets--orbit${reduced ? ' reduced' : ''}`}
      aria-hidden="true"
    >
      <div className="hero-widgets-backdrop" />
      <div className="hero-widgets-glow" />
      <div className="hero-orbit" style={{ ['--orbit-n' as string]: count }}>
        {ORBIT_INSTANCES.map((inst, i) => {
          const cat = catalogOf(inst.widgetId);
          if (!cat) return null;
          const accent = ACCENT[cat.service];
          return (
            <article
              key={inst.uid}
              className={`wcard preview-card-static accent-${accent} hero-orbit-card`}
              style={
                {
                  ['--i']: i,
                  ['--orbit-delay']: `${(-(i / count) * 36).toFixed(3)}s`,
                } as CSSProperties
              }
            >
              <div className="wcard-media">
                <CardCover service={cat.service} variant={coverVariantFor(cat.id)} />
                <div className="wcard-media-actions">
                  <span className="hero-wcard-timer">{inst.refresh}s</span>
                </div>
                <div className="wcard-media-badge">
                  <ServiceIcon service={cat.service} />
                </div>
              </div>
              <div className="wcard-meta">
                <div className="wcard-titles">
                  <b>{cat.name}</b>
                </div>
                <div className="wcard-creator">
                  <span className="wcard-creator-av" aria-hidden="true">
                    <ServiceIcon service={cat.service} />
                  </span>
                  <span>{SERVICE_LABEL[cat.service]}</span>
                </div>
              </div>
              <OrbitPreview inst={inst} />
            </article>
          );
        })}
      </div>
    </div>
  );
}
