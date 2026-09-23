import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Brand } from '../components/Icons';
import { SkipLink } from '../components/SkipLink';
import { useAuth } from '../auth/AuthContext';

const LINKS = [
  { href: '/#services', label: 'Services' },
  { href: '/#fonctionnement', label: 'Fonctionnement' },
  { href: '/#apercu', label: 'Aperçu' },
];

/** Coque des pages publiques : toujours sombre (univers de marque). */
export function PublicLayout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const close = () => setMenuOpen(false);

  return (
    <div className="force-dark lp-shell">
      <SkipLink />
      <header className="lp-nav-wrap">
        <nav className="lp-nav" aria-label="Navigation principale">
          <Link to="/" className="brand-link" onClick={close}>
            <Brand size={28} fontSize="1.1rem" />
          </Link>
          <div className="lp-nav-links">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </div>
          <div className="lp-nav-cta">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-primary btn-sm">
                Ouvrir le dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="lp-nav-login">
                  Se connecter
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm lp-hide-sm">
                  Créer un compte
                </Link>
              </>
            )}
            <button
              type="button"
              className="lp-burger"
              aria-expanded={menuOpen}
              aria-controls="lp-mobile-nav"
              aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span />
              <span />
            </button>
          </div>
        </nav>
        <div id="lp-mobile-nav" className={`lp-drawer${menuOpen ? ' open' : ''}`} hidden={!menuOpen}>
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={close}>
              {l.label}
            </a>
          ))}
          {!isAuthenticated && (
            <Link to="/register" className="btn btn-primary" onClick={close}>
              Créer un compte
            </Link>
          )}
        </div>
      </header>

      <main id="main-content">{children}</main>

      <footer className="lp-footer">
        <Brand size={22} fontSize=".95rem" />
        <p>Projet Dashboard — Epitech, module G-WEB-500</p>
      </footer>
    </div>
  );
}
