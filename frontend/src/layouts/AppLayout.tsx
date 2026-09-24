import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BrandMark,
  IconAdmin,
  IconDashboard,
  IconLogout,
  IconPlus,
  IconProfile,
  IconSearch,
  IconServices,
} from '../components/Icons';
import { SkipLink } from '../components/SkipLink';
import { Toasts } from '../components/Toasts';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useAuth } from '../auth/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { WizardModal } from '../modals/WizardModal';
import { OAuthModal } from '../modals/OAuthModal';

function useTabs() {
  const { t } = useTranslation();
  return [
    { to: '/dashboard', labelKey: 'nav.tabs.home', end: true, icon: <IconDashboard /> },
    { to: '/services', labelKey: 'nav.tabs.services', icon: <IconServices /> },
    { to: '/admin', labelKey: 'nav.tabs.admin', adminOnly: true, icon: <IconAdmin /> },
    { to: '/profile', labelKey: 'nav.tabs.profile', icon: <IconProfile /> },
  ].map((tab) => ({ ...tab, label: t(tab.labelKey) })) as {
    to: string;
    labelKey: string;
    label: string;
    end?: boolean;
    adminOnly?: boolean;
    icon: React.ReactNode;
  }[];
}

/** Ferme un menu déroulant au clic extérieur ou sur Échap. */
function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);
  return ref;
}

export function AppLayout() {
  const { t } = useTranslation();
  const { user, logout, isAdmin } = useAuth();
  const { toasts, dismissToast, tickLastRefresh, openWizard } = useAppData();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useDismiss(userOpen, () => setUserOpen(false));
  const query = location.pathname.startsWith('/dashboard') ? (params.get('q') ?? '') : '';
  const TABS = useTabs();

  useEffect(() => {
    const id = window.setInterval(() => tickLastRefresh(), 1000);
    return () => window.clearInterval(id);
  }, [tickLastRefresh]);

  const initials = (user?.name ?? 'U')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const visibleTabs = TABS.filter((tab) => !tab.adminOnly || isAdmin);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // La recherche filtre les widgets du dashboard (paramètre ?q= dans l'URL).
  const onSearch = (value: string) => {
    const next = value ? `/dashboard?q=${encodeURIComponent(value)}` : '/dashboard';
    navigate(next, { replace: location.pathname.startsWith('/dashboard') });
  };

  return (
    <>
      <SkipLink />
      <div id="app" className="app-shell">
        <header className="topbar">
          <Link to="/dashboard" className="topbar-brand" aria-label={t('nav.brandAria')}>
            <BrandMark size={26} />
          </Link>

          <label className="topbar-search glass">
            <IconSearch />
            <input
              type="search"
              placeholder={t('nav.searchPlaceholder')}
              aria-label={t('nav.searchLabel')}
              value={query}
              onChange={(e) => onSearch(e.target.value)}
            />
          </label>

          <nav className="topbar-tabs" aria-label={t('nav.sectionsLabel')}>
            {visibleTabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end ?? false}
                className={({ isActive }) => `topbar-tab${isActive ? ' active' : ''}`}
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>

          <div className="topbar-right">
            <div className="topbar-pop" ref={userRef}>
              <button
                type="button"
                className="topbar-user glass"
                aria-expanded={userOpen}
                aria-haspopup="menu"
                onClick={() => setUserOpen((o) => !o)}
              >
                <span className="avatar" aria-hidden="true">
                  {initials}
                </span>
                <span className="topbar-user-text">
                  <b>{user?.name ?? ''}</b>
                  <small>{isAdmin ? t('nav.userMenu.roleAdmin') : t('nav.userMenu.roleUser')}</small>
                </span>
                <svg className="icon topbar-chevron" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {userOpen && (
                <div className="topbar-menu glass" role="menu">
                  <Link to="/profile" role="menuitem" onClick={() => setUserOpen(false)}>
                    <IconProfile /> {t('nav.userMenu.profile')}
                  </Link>
                  <div className="topbar-menu-lang" role="menuitem">
                    <LanguageSwitcher />
                  </div>
                  <button type="button" role="menuitem" onClick={handleLogout}>
                    <IconLogout /> {t('nav.userMenu.logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main id="main-content" className="app-main">
          <Outlet />
        </main>

        <nav className="app-bottom-nav" aria-label={t('nav.mobileNavLabel')}>
          <div className="app-bottom-pill glass">
            {visibleTabs.slice(0, Math.ceil(visibleTabs.length / 2)).map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end ?? false}
                className={({ isActive }) => `app-bottom-link${isActive ? ' active' : ''}`}
              >
                <span className="app-bottom-ico" aria-hidden="true">
                  {tab.icon}
                </span>
                <span className="app-bottom-label">{tab.label}</span>
              </NavLink>
            ))}
            <button
              type="button"
              className="app-bottom-add"
              aria-label={t('nav.addWidgetLabel')}
              onClick={() => openWizard()}
            >
              <IconPlus />
            </button>
            {visibleTabs.slice(Math.ceil(visibleTabs.length / 2)).map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end ?? false}
                className={({ isActive }) => `app-bottom-link${isActive ? ' active' : ''}`}
              >
                <span className="app-bottom-ico" aria-hidden="true">
                  {tab.icon}
                </span>
                <span className="app-bottom-label">{tab.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
      <WizardModal />
      <OAuthModal />
      <Toasts items={toasts} onDismiss={dismissToast} />
    </>
  );
}
