import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PublicLayout } from '../layouts/PublicLayout';
import { useAuth } from '../auth/AuthContext';
import { IconChevron, IconFinance, IconGithub, IconHackerNews, IconRss, IconWeather } from '../components/Icons';
import type { ServiceId } from '../data/catalog';
import { IMG } from '../data/images';
import { widgetName } from '../i18n/widgets';
import { apiListWidgetCatalog, type ApiWidgetDefinition } from '../api/client';

// Noms de paramètres alignés sur le registre back (backend/src/widgets/registry.ts).
const WIDGETS_PREVIEW: { id: string; service: ServiceId; params: string[] }[] = [
  { id: 'city_temperature', service: 'weather', params: ['city', 'unit'] },
  { id: 'precipitation_forecast', service: 'weather', params: ['city', 'days'] },
  { id: 'recent_commits', service: 'github', params: ['repository', 'limit'] },
  { id: 'security_alerts', service: 'github', params: ['repository', 'severity'] },
  { id: 'article_list', service: 'rss', params: ['link', 'number'] },
  { id: 'feed_summary', service: 'rss', params: ['links', 'number'] },
  { id: 'exchange_rate', service: 'finance', params: ['base', 'target'] },
  { id: 'crypto_price', service: 'finance', params: ['coin', 'currency'] },
  { id: 'top_stories', service: 'hackernews', params: ['number'] },
  { id: 'story_search', service: 'hackernews', params: ['query', 'number'] },
];

const SERVICE_ICON: Record<ServiceId, ReactNode> = {
  weather: <IconWeather />,
  github: <IconGithub />,
  rss: <IconRss />,
  finance: <IconFinance />,
  hackernews: <IconHackerNews />,
};

export function LandingPage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const primary = isAuthenticated
    ? { to: '/dashboard', label: t('landing.hero.ctaAuthenticated') }
    : { to: '/register', label: t('landing.hero.ctaGuest') };

  // Compte réel de services/widgets depuis GET /widgets (public, pas de mock) —
  // la landing n'est pas sous AppDataProvider (réservé aux routes protégées).
  const [catalog, setCatalog] = useState<ApiWidgetDefinition[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    apiListWidgetCatalog()
      .then((rows) => {
        if (!cancelled) setCatalog(rows);
      })
      .catch(() => {
        if (!cancelled) setCatalog([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const SERVICES: { id: ServiceId; image: string }[] = [
    { id: 'weather', image: IMG.service.weather },
    { id: 'github', image: IMG.service.github },
    { id: 'rss', image: IMG.service.rss },
    { id: 'finance', image: IMG.service.finance },
    { id: 'hackernews', image: IMG.service.hackernews },
  ];

  const serviceCount = catalog ? new Set(catalog.map((w) => w.service)).size : null;
  const widgetCount = catalog ? catalog.length : null;

  const STATS = [
    { value: serviceCount == null ? '—' : String(serviceCount), label: t('landing.stats.servicesConnected') },
    { value: widgetCount == null ? '—' : String(widgetCount), label: t('landing.stats.widgetsConfigurable') },
  ];

  const STEPS = [
    { title: t('landing.steps.step1.title'), text: t('landing.steps.step1.text') },
    { title: t('landing.steps.step2.title'), text: t('landing.steps.step2.text') },
    { title: t('landing.steps.step3.title'), text: t('landing.steps.step3.text') },
    { title: t('landing.steps.step4.title'), text: t('landing.steps.step4.text') },
  ];

  return (
    <PublicLayout>
      {/* ---------- Hero ---------- */}
      <section className="lp-hero" aria-labelledby="lp-hero-title">
        <img src={IMG.hero.weather} alt="" className="lp-hero-bg" fetchPriority="high" />
        <div className="lp-hero-copy">
          <p className="lp-eyebrow">
            <span className="lp-live" aria-hidden="true" />
            {t('landing.hero.eyebrow', { services: STATS[0].value, widgets: STATS[1].value })}
          </p>
          <h1 id="lp-hero-title">
            {t('landing.hero.title')} <span className="lp-grad">{t('landing.hero.titleHighlight')}</span>
          </h1>
          <p className="lp-lead">{t('landing.hero.lead')}</p>
          <div className="lp-actions">
            <Link to={primary.to} className="btn btn-primary lp-btn-lg lp-btn-circled">
              {primary.label}
              <span className="lp-btn-circle" aria-hidden="true">
                <IconChevron dir="right" />
              </span>
            </Link>
            {!isAuthenticated && (
              <Link to="/login" className="btn btn-ghost lp-btn-lg">
                {t('landing.hero.login')}
              </Link>
            )}
          </div>
          <ol className="lp-hero-highlights" aria-label={t('landing.hero.inBrief')}>
            <li>
              <b>01</b>
              <span>{t('landing.hero.step1')}</span>
            </li>
            <li>
              <b>02</b>
              <span>{t('landing.hero.step2')}</span>
            </li>
            <li>
              <b>03</b>
              <span>{t('landing.hero.step3')}</span>
            </li>
          </ol>
        </div>

        <div className="lp-hero-visual">
          <span className="lp-accent lp-accent--a" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c.9 5.6 2.9 7.6 8.5 8.5-5.6.9-7.6 2.9-8.5 8.5-.9-5.6-2.9-7.6-8.5-8.5C9.1 7.6 11.1 5.6 12 0Z" />
            </svg>
          </span>
          <span className="lp-accent lp-accent--b" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c.9 5.6 2.9 7.6 8.5 8.5-5.6.9-7.6 2.9-8.5 8.5-.9-5.6-2.9-7.6-8.5-8.5C9.1 7.6 11.1 5.6 12 0Z" />
            </svg>
          </span>
          <div className="lp-float lp-float--temp" aria-hidden="true">
            <span className="lp-float-ico">
              <IconWeather />
            </span>
            <div>
              <small>{t('landing.hero.floatTemp')}</small>
              <b>31°C</b>
              <span>{t('landing.hero.floatTempDesc')}</span>
            </div>
          </div>
          <div className="lp-float lp-float--commit" aria-hidden="true">
            <span className="lp-float-ico">
              <IconGithub />
            </span>
            <div>
              <small>{t('landing.hero.floatCommits')}</small>
              <span className="lp-float-strong">{t('landing.hero.floatCommitMsg')}</span>
              <span>{t('landing.hero.floatCommitMeta')}</span>
            </div>
          </div>
          <div className="lp-float lp-float--timer" aria-hidden="true">
            <span className="lp-timer-ring" />
            <span>{t('landing.hero.floatTimer')}</span>
          </div>
        </div>
      </section>

      {/* ---------- Stats ---------- */}
      <section className="lp-stats-band" aria-label={t('landing.stats.label')}>
        <div className="lp-stats-row">
          {STATS.map((s) => (
            <div key={s.label} className="lp-stat">
              <b>{s.value}</b>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Services ---------- */}
      <section id="services" className="lp-section" aria-labelledby="lp-services-title">
        <header className="lp-section-head">
          <p className="lp-kicker">{t('landing.services.kicker')}</p>
          <h2 id="lp-services-title">{t('landing.services.title')}</h2>
          <p>{t('landing.services.lead')}</p>
        </header>
        <div className="lp-svc-grid">
          {SERVICES.map((svc) => (
            <article key={svc.id} className="lp-svc">
              <div className="lp-svc-media">
                <img src={svc.image} alt="" loading="lazy" />
                <span className="lp-svc-access">{t(`landing.services.${svc.id}.access`)}</span>
              </div>
              <div className="lp-svc-body">
                <h3>
                  <span className="lp-svc-ico" aria-hidden="true">
                    {SERVICE_ICON[svc.id]}
                  </span>
                  {t(`common.services.${svc.id}`)}
                </h3>
                <p>{t(`landing.services.${svc.id}.pitch`)}</p>
                <ul>
                  {WIDGETS_PREVIEW.filter((w) => w.service === svc.id).map((w) => (
                    <li key={w.id}>
                      <b>{widgetName(t, w.id)}</b>
                      <code>{w.params.join(' · ')}</code>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ---------- Fonctionnement ---------- */}
      <section id="fonctionnement" className="lp-section" aria-labelledby="lp-steps-title">
        <header className="lp-section-head">
          <p className="lp-kicker">{t('landing.steps.kicker')}</p>
          <h2 id="lp-steps-title">{t('landing.steps.title')}</h2>
        </header>
        <ol className="lp-steps">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <span className="lp-step-num">{String(i + 1).padStart(2, '0')}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- Aperçu ---------- */}
      <section id="apercu" className="lp-section" aria-labelledby="lp-preview-title">
        <header className="lp-section-head">
          <p className="lp-kicker">{t('landing.preview.kicker')}</p>
          <h2 id="lp-preview-title">{t('landing.preview.title')}</h2>
          <p>{t('landing.preview.lead')}</p>
        </header>
        <figure className="lp-preview">
          <img
            src="/img/dashboard-preview.jpg"
            alt={t('landing.preview.alt')}
            loading="lazy"
            width={1600}
            height={1000}
          />
        </figure>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="lp-cta" aria-labelledby="lp-cta-title">
        <div className="lp-cta-copy">
          <h2 id="lp-cta-title">{t('landing.cta.title')}</h2>
          <p>{t('landing.cta.lead')}</p>
          <Link to={primary.to} className="btn btn-primary lp-btn-lg lp-btn-circled">
            {primary.label}
            <span className="lp-btn-circle" aria-hidden="true">
              <IconChevron dir="right" />
            </span>
          </Link>
        </div>
        <img src={IMG.hero.rss} alt="" className="lp-cta-img" loading="lazy" />
      </section>
    </PublicLayout>
  );
}
