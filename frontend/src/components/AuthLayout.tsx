import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Brand, IconGithub, IconRss, IconWeather } from './Icons';
import { SkipLink } from './SkipLink';
import { IMG } from '../data/images';

/** Pages d'authentification : visuel de marque à gauche, formulaire à droite (toujours sombre). */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="force-dark au-shell">
      <SkipLink />
      <aside className="au-visual" aria-hidden="true">
        <img src={IMG.auth} alt="" />
        <div className="au-visual-top">
          <Link to="/" className="brand-link" tabIndex={-1}>
            <Brand size={28} fontSize="1.1rem" />
          </Link>
        </div>
        <div className="au-visual-bottom">
          <p className="au-quote">
            Un seul tableau de bord pour la météo, tes dépôts et tes flux.
          </p>
          <ul className="au-chips">
            <li>
              <IconWeather /> Météo
            </li>
            <li>
              <IconGithub /> GitHub
            </li>
            <li>
              <IconRss /> RSS
            </li>
          </ul>
        </div>
      </aside>

      <main id="main-content" className="au-main">
        <Link to="/" className="brand-link au-mobile-brand">
          <Brand size={26} fontSize="1.05rem" />
        </Link>
        {children}
      </main>
    </div>
  );
}
