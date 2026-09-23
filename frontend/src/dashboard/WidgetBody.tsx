import type { WidgetInstance } from '../data/catalog';
import { FRAMES } from '../data/frames';

interface WidgetBodyProps {
  inst: WidgetInstance;
  frameIndex: number;
  animate?: boolean;
}

export function WidgetBody({ inst, frameIndex, animate }: WidgetBodyProps) {
  const content = renderBody(inst, frameIndex);
  return (
    <div className={`wcard-body${animate ? ' fade-swap' : ''}`} data-body>
      {content}
    </div>
  );
}

function Cta({ label }: { label: string }) {
  return (
    <button type="button" className="wcard-cta" tabIndex={-1}>
      {label}
      <span aria-hidden="true">→</span>
    </button>
  );
}

function renderBody(inst: WidgetInstance, i: number) {
  if (inst.widgetId === 'city_temperature') {
    const key = (inst.frameKey || 'temp_cotonou') as 'temp_cotonou' | 'temp_paris';
    const frames = FRAMES[key];
    const f = frames[i % frames.length];
    const city = String(inst.config.city || '--');
    return (
      <>
        <div className="temp-hero">
          <div className="temp-row">
            <span className="temp-big">{f.big}</span>
          </div>
          <span className="temp-meta">{f.meta}</span>
          <div className="temp-loc">
            <span className="temp-loc-dot" aria-hidden="true" />
            {city}
          </div>
        </div>
        <div className="metric-row">
          <span>H: {f.big}</span>
          <span>Live · API météo</span>
        </div>
      </>
    );
  }

  if (inst.widgetId === 'precipitation_forecast') {
    const f = FRAMES.precip[i % FRAMES.precip.length];
    return (
      <div className="metric-chips">
        {f.days.map((d) => (
          <span className="metric-chip" key={d}>
            {d}
          </span>
        ))}
      </div>
    );
  }

  if (inst.widgetId === 'recent_commits') {
    const list = FRAMES.commits[i % FRAMES.commits.length].slice(
      0,
      Number(inst.config.limit) || 3,
    );
    const repo = String(inst.config.repo || 'org/repo');
    return (
      <>
        {list.map((c) => (
          <div className="commit-item" key={`${c.m}-${c.t}`}>
            <span className="commit-dot" />
            <div>
              <p>{c.m}</p>
              <small>
                {repo} · {c.a}
              </small>
            </div>
            <span className="commit-time">{c.t}</span>
          </div>
        ))}
        <Cta label="Voir sur GitHub" />
      </>
    );
  }

  if (inst.widgetId === 'security_alerts') {
    const f = FRAMES.alerts[i % FRAMES.alerts.length];
    return (
      <>
        <div className="alert-row">
          <span>Sévérité haute</span>
          <span className="sev sev-high">{f.high}</span>
        </div>
        <div className="alert-row">
          <span>Sévérité moyenne</span>
          <span className="sev sev-medium">{f.medium}</span>
        </div>
        <Cta label="Ouvrir les alertes" />
      </>
    );
  }

  if (inst.widgetId === 'article_list') {
    const list = FRAMES.articles[i % FRAMES.articles.length].slice(
      0,
      Number(inst.config.number) || 3,
    );
    return (
      <>
        {list.map((a, idx) => (
          <div className="article-row" key={a.t}>
            <span className="commit-dot" />
            <div>
              <p>
                {a.t}
                {'n' in a && a.n ? <span className="new-badge">nouveau</span> : null}
              </p>
              <small>Flux RSS</small>
            </div>
            <span className="article-time">{idx + 1}h</span>
          </div>
        ))}
        <Cta label="Ouvrir le flux" />
      </>
    );
  }

  if (inst.widgetId === 'feed_summary') {
    return (
      <>
        <div className="article-item" style={{ border: 'none' }}>
          « Threshold : construire un dashboard vivant »
        </div>
        <Cta label="Lire le résumé" />
      </>
    );
  }

  return null;
}
