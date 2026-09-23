import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  BrandMark,
  IconAdmin,
  IconBell,
  IconDashboard,
  IconLogout,
  IconPlus,
  IconProfile,
  IconSearch,
  IconServices,
} from '../components/Icons';
import { SkipLink } from '../components/SkipLink';
import { Toasts } from '../components/Toasts';
import { useAuth } from '../auth/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { WizardModal } from '../modals/WizardModal';
import { OAuthModal } from '../modals/OAuthModal';
import { AUDIT_EVENTS } from '../data/catalog';

const TABS = [
  { to: '/dashboard', label: 'Accueil', end: true, icon: <IconDashboard /> },
  { to: '/services', label: 'Services', icon: <IconServices /> },
  { to: '/admin', label: 'Admin', adminOnly: true, icon: <IconAdmin /> },
  { to: '/profile', label: 'Profil', icon: <IconProfile /> },
] as const;

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
  const { user, logout, isAdmin } = useAuth();
  const { toasts, dismissToast, tickLastRefresh, openWizard } = useAppData();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [bellOpen, setBellOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const bellRef = useDismiss(bellOpen, () => setBellOpen(false));
  const userRef = useDismiss(userOpen, () => setUserOpen(false));
  const query = location.pathname.startsWith('/dashboard') ? (params.get('q') ?? '') : '';

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

  const visibleTabs = TABS.filter((t) => !('adminOnly' in t && t.adminOnly) || isAdmin);

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
          <Link to="/dashboard" className="topbar-brand" aria-label="Threshold — accueil">
            <BrandMark size={26} />
          </Link>

          <label className="topbar-search glass">
            <IconSearch />
            <input
              type="search"
              placeholder="Rechercher un widget…"
              aria-label="Rechercher un widget"
              value={query}
              onChange={(e) => onSearch(e.target.value)}
            />
          </label>

          <nav className="topbar-tabs" aria-label="Sections">
            {visibleTabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={'end' in tab ? tab.end : false}
                className={({ isActive }) => `topbar-tab${isActive ? ' active' : ''}`}
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>

          <div className="topbar-right">
            <div className="topbar-pop" ref={bellRef}>
              <button
                type="button"
                className="topbar-bell glass"
                aria-label="Activité récente"
                aria-expanded={bellOpen}
                onClick={() => setBellOpen((o) => !o)}
              >
                <IconBell />
                <span className="topbar-bell-dot" aria-hidden="true" />
              </button>
              {bellOpen && (
                <div className="topbar-menu glass" role="dialog" aria-label="Activité récente">
                  <p className="topbar-menu-title">Activité récente</p>
                  <ul className="topbar-activity">
                    {AUDIT_EVENTS.slice(0, 4).map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

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
                  <small>{isAdmin ? 'Admin' : 'Utilisateur'}</small>
                </span>
                <svg className="icon topbar-chevron" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {userOpen && (
                <div className="topbar-menu glass" role="menu">
                  <Link to="/profile" role="menuitem" onClick={() => setUserOpen(false)}>
                    <IconProfile /> Mon profil
                  </Link>
                  <button type="button" role="menuitem" onClick={handleLogout}>
                    <IconLogout /> Se déconnecter
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main id="main-content" className="app-main">
          <Outlet />
        </main>

        <nav className="app-bottom-nav" aria-label="Navigation mobile">
          <div className="app-bottom-pill glass">
            {visibleTabs.slice(0, Math.ceil(visibleTabs.length / 2)).map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={'end' in tab ? tab.end : false}
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
              aria-label="Ajouter un widget"
              onClick={() => openWizard()}
            >
              <IconPlus />
            </button>
            {visibleTabs.slice(Math.ceil(visibleTabs.length / 2)).map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={'end' in tab ? tab.end : false}
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
