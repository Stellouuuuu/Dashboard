import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Brand, IconGithub, IconRss, IconWeather } from './Icons';
import { ImageFade } from './ImageFade';
import { SkipLink } from './SkipLink';
import { LanguageSwitcher } from './LanguageSwitcher';
import { IMG } from '../data/images';

/** Pages d'authentification : visuel de marque à gauche, formulaire à droite (toujours sombre). */
export function AuthLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="force-dark au-shell">
      <SkipLink />
      <aside className="au-visual" aria-hidden="true">
        <ImageFade images={IMG.atmosphere} fetchPriority="high" />
        <div className="au-visual-top">
          <Link to="/" className="brand-link" tabIndex={-1}>
            <Brand size={28} fontSize="1.1rem" />
          </Link>
        </div>
        <div className="au-visual-bottom">
          <p className="au-quote">{t('auth.layout.quote')}</p>
          <ul className="au-chips">
            <li>
              <IconWeather /> {t('common.services.weather')}
            </li>
            <li>
              <IconGithub /> {t('common.services.github')}
            </li>
            <li>
              <IconRss /> {t('common.services.rss')}
            </li>
          </ul>
        </div>
      </aside>

      <main id="main-content" className="au-main">
        <Link to="/" className="brand-link au-mobile-brand">
          <Brand size={26} fontSize="1.05rem" />
        </Link>
        <nav className="au-main-nav" aria-label={t('nav.mainLabel')}>
          <LanguageSwitcher />
        </nav>
        {children}
      </main>
    </div>
  );
}
