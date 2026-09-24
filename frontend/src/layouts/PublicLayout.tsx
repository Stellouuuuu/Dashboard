import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Brand } from '../components/Icons';
import { SkipLink } from '../components/SkipLink';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useAuth } from '../auth/AuthContext';

/** Coque des pages publiques : toujours sombre (univers de marque). */
export function PublicLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const LINKS = [
    { href: '/#services', label: t('landing.nav.services') },
    { href: '/#fonctionnement', label: t('landing.nav.howItWorks') },
    { href: '/#apercu', label: t('landing.nav.preview') },
  ];
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
        <nav className="lp-nav" aria-label={t('nav.mainLabel')}>
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
            <LanguageSwitcher />
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-primary btn-sm">
                {t('landing.nav.openDashboard')}
              </Link>
            ) : (
              <>
                <Link to="/login" className="lp-nav-login">
                  {t('landing.nav.login')}
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm lp-hide-sm">
                  {t('landing.nav.createAccount')}
                </Link>
              </>
            )}
            <button
              type="button"
              className="lp-burger"
              aria-expanded={menuOpen}
              aria-controls="lp-mobile-nav"
              aria-label={menuOpen ? t('landing.nav.closeMenu') : t('landing.nav.openMenu')}
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
              {t('landing.nav.createAccount')}
            </Link>
          )}
        </div>
      </header>

      <main id="main-content">{children}</main>

      <footer className="lp-footer">
        <Brand size={22} fontSize=".95rem" />
        <p>{t('landing.footer')}</p>
      </footer>
    </div>
  );
}
