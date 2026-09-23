import { useReveal } from '../hooks/useReveal';
import { CatalogFloat } from '../landing/CatalogFloat';
import { HeroWidgets } from '../landing/HeroWidgets';
import { JourneyPanel } from '../landing/JourneyPanel';
import { PublicLayout } from '../layouts/PublicLayout';
import { BrandMark } from '../components/Icons';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { ReactNode } from 'react';

function RevealSection({ id, children }: { id?: string; children: ReactNode }) {
  const { ref, className } = useReveal<HTMLElement>();
  return (
    <section id={id} ref={ref} className={className}>
      {children}
    </section>
  );
}

export function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <PublicLayout>
      <div id="landing">
        <section className="hero-stage" aria-label="Accueil">
          <div className="wrap">
            <div className="hero hero--widgets">
              <div className="hero-copy">
                <div className="hero-mark" aria-hidden="true">
                  <BrandMark size={22} />
                </div>
                <h1>
                  <span className="hero-line">Construis ton meilleur</span>
                  <span className="hero-line hero-line--sub">tableau de bord.</span>
                </h1>
                <p>
                  Abonne-toi aux services que tu utilises déjà, ajoute un widget pour ce
                  qui compte, et laisse un timer le garder à jour -- sans changer
                  d&apos;onglet.
                </p>
                <div className="hero-pill">
                  {isAuthenticated ? (
                    <Link to="/dashboard" className="btn btn-primary">
                      Ouvrir mon dashboard
                    </Link>
                  ) : (
                    <Link to="/register" className="btn btn-primary">
                      Créer mon dashboard
                    </Link>
                  )}
                  <Link
                    to={isAuthenticated ? '/dashboard' : '/login'}
                    className="btn btn-ghost"
                  >
                    Voir un dashboard en direct
                  </Link>
                </div>
                <div className="hero-quick">
                  <a href="/#how" className="hero-quick-link">
                    <span className="hero-quick-ico" aria-hidden="true">↓</span>
                    Comment ça marche
                  </a>
                  <a href="/#services" className="hero-quick-link">
                    <span className="hero-quick-ico" aria-hidden="true">↓</span>
                    Services &amp; widgets
                  </a>
                </div>
              </div>
              <HeroWidgets />
            </div>
          </div>
        </section>

        <JourneyPanel />

        <CatalogFloat />

        <div className="divider" />

        <div className="wrap">
          <RevealSection id="preview">
            <div className="section-head">
              <p className="eyebrow">En direct</p>
              <h2>Ce n&apos;est pas une maquette figée</h2>
              <p>Connecte-toi pour voir ton dashboard vivre avec de vrais timers.</p>
            </div>
            <div className="preview-promo preview-promo--no-img">
              <div className="preview-promo-schema" aria-hidden="true">
                <div className="promo-chip accent-cyan">
                  <span className="promo-chip-dot" />
                  Timer 30s
                </div>
                <div className="promo-chip accent-violet">
                  <span className="promo-chip-dot" />
                  OAuth GitHub
                </div>
                <div className="promo-chip accent-amber">
                  <span className="promo-chip-dot" />
                  Flux RSS
                </div>
              </div>
              <div className="preview-promo-copy">
                <p>
                  Les widgets live sont dans l&apos;application authentifiée -- ouvre ton
                  dashboard pour les voir tourner.
                </p>
                <Link
                  to={isAuthenticated ? '/dashboard' : '/login'}
                  className="btn btn-primary"
                >
                  {isAuthenticated ? 'Ouvrir le dashboard' : 'Se connecter pour l’aperçu'}
                </Link>
              </div>
            </div>
          </RevealSection>
        </div>

        <div className="wrap">
          <section>
            <CtaBand authenticated={isAuthenticated} />
          </section>
          <div className="footer">
            <span>Threshold</span>
            <span>Projet Dashboard · module G-WEB-500</span>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

function CtaBand({ authenticated }: { authenticated: boolean }) {
  const { ref, className } = useReveal<HTMLDivElement>();
  return (
    <div className={`cta-band ${className}`} ref={ref}>
      <div className="cta-band-copy">
        <h2>Prêt à ouvrir ta première porte ?</h2>
        <p>
          Abonne-toi aux services, configure tes widgets, et laisse les timers garder
          tout à jour.
        </p>
        <Link to={authenticated ? '/dashboard' : '/register'} className="btn btn-primary">
          {authenticated ? 'Retour au dashboard' : 'Créer mon dashboard'}
        </Link>
      </div>
    </div>
  );
}
