import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Brand } from '../components/Icons';
import { ThemeToggle } from '../components/ThemeToggle';
import { SkipLink } from '../components/SkipLink';
import { Stars } from '../components/Stars';
import { useAuth } from '../auth/AuthContext';

export function PublicLayout({ children }: { children: React.ReactNode }) {
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

  return (
    <>
      <SkipLink />
      <div className="mesh-bg" aria-hidden="true">
        <span className="mesh-spot" />
      </div>
      <Stars />
      <div className="wrap">
        <nav className="nav" aria-label="Navigation principale">
          <Link to="/" className="brand-link">
            <Brand />
          </Link>
          <div className="nav-links">
            <a href="/#how" onClick={() => setMenuOpen(false)}>
              Comment ça marche
            </a>
            <a href="/#services" onClick={() => setMenuOpen(false)}>
              Services
            </a>
            <a href="/#preview" onClick={() => setMenuOpen(false)}>
              Aperçu
            </a>
          </div>
          <div className="nav-cta">
            <ThemeToggle />
            {!isAuthenticated && (
              <>
                <Link to="/login" className="nav-text-link nav-desktop-only">
                  Se connecter
                </Link>
                <Link to="/register" className="btn btn-outline btn-sm nav-desktop-only">
                  Créer un compte
                </Link>
              </>
            )}
            {isAuthenticated && (
              <Link to="/dashboard" className="btn btn-primary btn-sm nav-desktop-only">
                Ouvrir le dashboard
              </Link>
            )}
            <button
              type="button"
              className="nav-burger"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </nav>
      </div>
      {menuOpen && (
        <button
          type="button"
          className="nav-backdrop"
          aria-label="Fermer le menu"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <div id="mobile-nav" className={`mobile-drawer${menuOpen ? ' open' : ''}`}>
        <a href="/#how" onClick={() => setMenuOpen(false)}>
          Comment ça marche
        </a>
        <a href="/#services" onClick={() => setMenuOpen(false)}>
          Services
        </a>
        <a href="/#preview" onClick={() => setMenuOpen(false)}>
          Aperçu
        </a>
        {isAuthenticated ? (
          <Link to="/dashboard" onClick={() => setMenuOpen(false)}>
            Dashboard
          </Link>
        ) : (
          <>
            <Link to="/login" onClick={() => setMenuOpen(false)}>
              Se connecter
            </Link>
            <Link to="/register" className="btn btn-primary" onClick={() => setMenuOpen(false)}>
              Créer un compte
            </Link>
          </>
        )}
      </div>
      <main id="main-content">{children}</main>
    </>
  );
}
