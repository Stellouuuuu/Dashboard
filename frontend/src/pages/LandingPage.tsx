import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout';
import { useAuth } from '../auth/AuthContext';
import { IconGithub, IconRss, IconWeather } from '../components/Icons';
import { CATALOG, SERVICE_LABEL, type ServiceId } from '../data/catalog';
import { IMG } from '../data/images';

const SERVICES: {
  id: ServiceId;
  image: string;
  icon: ReactNode;
  access: string;
  pitch: string;
}[] = [
  {
    id: 'weather',
    image: IMG.service.weather,
    icon: <IconWeather />,
    access: 'Sans compte',
    pitch: 'La température et la pluie des villes qui comptent pour toi.',
  },
  {
    id: 'github',
    image: IMG.service.github,
    icon: <IconGithub />,
    access: 'OAuth 2.0',
    pitch: 'Les commits et les alertes de sécurité de tes dépôts.',
  },
  {
    id: 'rss',
    image: IMG.service.rss,
    icon: <IconRss />,
    access: 'Une URL suffit',
    pitch: 'Les derniers articles de tes blogs et médias préférés.',
  },
];

const STEPS = [
  { title: 'Crée ton compte', text: 'Inscription par email, confirmée avant le premier accès.' },
  { title: 'Connecte tes services', text: 'La météo est incluse. GitHub se lie en OAuth, RSS avec une URL.' },
  { title: 'Compose ton dashboard', text: 'Choisis un widget, règle ses paramètres et sa fréquence.' },
  { title: 'Laisse tourner', text: 'Le timer rafraîchit chaque widget à son propre rythme.' },
];

export function LandingPage() {
  const { isAuthenticated } = useAuth();
  const primary = isAuthenticated
    ? { to: '/dashboard', label: 'Ouvrir mon dashboard' }
    : { to: '/register', label: 'Créer mon dashboard' };

  return (
    <PublicLayout>
      {/* ---------- Hero ---------- */}
      <section className="lp-hero" aria-labelledby="lp-hero-title">
        <img src={IMG.hero.weather} alt="" className="lp-hero-bg" fetchPriority="high" />
        <div className="lp-hero-copy">
          <p className="lp-eyebrow">
            <span className="lp-live" aria-hidden="true" />
            3 services · 6 widgets · actualisés en direct
          </p>
          <h1 id="lp-hero-title">
            Ouvre le seuil vers <span className="lp-grad">tout ce qui compte.</span>
          </h1>
          <p className="lp-lead">
            Météo, dépôts GitHub, flux RSS : Threshold réunit tes sources dans un seul tableau
            de bord, que tu composes widget par widget et qu&apos;un timer garde à jour.
          </p>
          <div className="lp-actions">
            <Link to={primary.to} className="btn btn-primary lp-btn-lg">
              {primary.label}
            </Link>
            {!isAuthenticated && (
              <Link to="/login" className="btn btn-ghost lp-btn-lg">
                Se connecter
              </Link>
            )}
          </div>
          <ol className="lp-hero-steps" aria-label="En bref">
            <li>
              <b>01</b>
              <span>Abonne-toi aux services</span>
            </li>
            <li>
              <b>02</b>
              <span>Configure tes widgets</span>
            </li>
            <li>
              <b>03</b>
              <span>Le timer fait le reste</span>
            </li>
          </ol>
        </div>

        <div className="lp-hero-visual">
          <div className="lp-float lp-float--temp" aria-hidden="true">
            <span className="lp-float-ico">
              <IconWeather />
            </span>
            <div>
              <small>Température · Cotonou</small>
              <b>31°C</b>
              <span>Partiellement nuageux</span>
            </div>
          </div>
          <div className="lp-float lp-float--commit" aria-hidden="true">
            <span className="lp-float-ico">
              <IconGithub />
            </span>
            <div>
              <small>Commits récents</small>
              <span className="lp-float-strong">Fix widget refresh</span>
              <span>team/dashboard · il y a 2 min</span>
            </div>
          </div>
          <div className="lp-float lp-float--timer" aria-hidden="true">
            <span className="lp-timer-ring" />
            <span>Prochain rafraîchissement dans 9 s</span>
          </div>
        </div>
      </section>

      {/* ---------- Services ---------- */}
      <section id="services" className="lp-section" aria-labelledby="lp-services-title">
        <header className="lp-section-head">
          <p className="lp-kicker">Services</p>
          <h2 id="lp-services-title">Trois portes, six widgets.</h2>
          <p>Chaque widget a ses propres paramètres : deux instances du même widget peuvent suivre deux villes, deux dépôts ou deux flux différents.</p>
        </header>
        <div className="lp-svc-grid">
          {SERVICES.map((svc) => (
            <article key={svc.id} className="lp-svc">
              <div className="lp-svc-media">
                <img src={svc.image} alt="" loading="lazy" />
                <span className="lp-svc-access">{svc.access}</span>
              </div>
              <div className="lp-svc-body">
                <h3>
                  <span className="lp-svc-ico" aria-hidden="true">
                    {svc.icon}
                  </span>
                  {SERVICE_LABEL[svc.id]}
                </h3>
                <p>{svc.pitch}</p>
                <ul>
                  {CATALOG.filter((w) => w.service === svc.id).map((w) => (
                    <li key={w.id}>
                      <b>{w.name}</b>
                      <code>{w.params.map((p) => p.name).join(' · ')}</code>
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
          <p className="lp-kicker">Fonctionnement</p>
          <h2 id="lp-steps-title">Quatre étapes, puis tout tourne seul.</h2>
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
          <p className="lp-kicker">Aperçu</p>
          <h2 id="lp-preview-title">Ton dashboard, en vrai.</h2>
          <p>Ajoute, reconfigure, déplace ou supprime tes widgets. Chacun se met à jour à sa propre fréquence.</p>
        </header>
        <figure className="lp-preview">
          <img
            src="/img/dashboard-preview.jpg"
            alt="Aperçu du dashboard Threshold avec des widgets météo, GitHub et RSS"
            loading="lazy"
            width={1600}
            height={1000}
          />
        </figure>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="lp-cta" aria-labelledby="lp-cta-title">
        <div className="lp-cta-copy">
          <h2 id="lp-cta-title">Prêt à franchir le seuil&nbsp;?</h2>
          <p>Ton premier widget est à trois clics.</p>
          <Link to={primary.to} className="btn btn-primary lp-btn-lg">
            {primary.label}
          </Link>
        </div>
        <img src={IMG.hero.rss} alt="" className="lp-cta-img" loading="lazy" />
      </section>
    </PublicLayout>
  );
}
