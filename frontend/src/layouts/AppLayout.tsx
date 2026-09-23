import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Brand,
  BrandMark,
  IconAdmin,
  IconBell,
  IconDashboard,
  IconGithub,
  IconLogout,
  IconPlus,
  IconProfile,
  IconRss,
  IconSearch,
  IconServices,
  IconSpotify,
  IconWeather,
  IconWhatsapp,
} from '../components/Icons';
import { ThemeToggle } from '../components/ThemeToggle';
import { SkipLink } from '../components/SkipLink';
import { Stars } from '../components/Stars';
import { Toasts } from '../components/Toasts';
import { useAuth } from '../auth/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { WizardModal } from '../modals/WizardModal';
import { OAuthModal } from '../modals/OAuthModal';
import type { ServiceId } from '../data/catalog';

const TABS = [
  { to: '/dashboard', label: 'Dashboard', end: true, icon: <IconDashboard /> },
  { to: '/services', label: 'Services', icon: <IconServices /> },
  { to: '/admin', label: 'Admin', adminOnly: true, icon: <IconAdmin /> },
  { to: '/profile', label: 'Profil', icon: <IconProfile /> },
] as const;

const SERVICE_CHIPS: {
  id: ServiceId;
  label: string;
  icon: ReactNode;
  accent: 'cyan' | 'violet' | 'amber' | 'green' | 'mint';
}[] = [
  { id: 'weather', label: 'Weather', icon: <IconWeather />, accent: 'cyan' },
  { id: 'github', label: 'GitHub', icon: <IconGithub />, accent: 'violet' },
  { id: 'rss', label: 'RSS', icon: <IconRss />, accent: 'amber' },
  { id: 'spotify', label: 'Spotify', icon: <IconSpotify />, accent: 'green' },
  { id: 'whatsapp', label: 'WhatsApp', icon: <IconWhatsapp />, accent: 'mint' },
];

function SideLink({
  to,
  end,
  label,
  icon,
}: {
  to: string;
  end?: boolean;
  label: string;
  icon: ReactNode;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `app-side-link${isActive ? ' active' : ''}`}
      title={label}
    >
      <span className="app-side-ico" aria-hidden="true">
        {icon}
      </span>
      <span className="app-side-label">{label}</span>
    </NavLink>
  );
}

export function AppLayout() {
  const { user, logout, isAdmin } = useAuth();
  const {
    toasts,
    dismissToast,
    tickLastRefresh,
    isSubscribed,
    githubUsername,
    rssUrl,
    openWizard,
  } = useAppData();
  const navigate = useNavigate();
  const location = useLocation();
  const [time, setTime] = useState('--:--:--');
  const isDashboardHome =
    location.pathname === '/dashboard' || location.pathname.endsWith('/dashboard');

  useEffect(() => {
    const tick = () => {
      setTime(new Date().toLocaleTimeString('fr-FR'));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

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

  const serviceTitle = (id: ServiceId, active: boolean) => {
    if (id === 'weather') return active ? 'Weather -- actif' : 'Weather';
    if (id === 'github') {
      return active ? `GitHub -- @${githubUsername ?? 'connecté'}` : 'GitHub -- non connecté';
    }
    if (id === 'rss') return active ? `RSS -- ${rssUrl}` : 'RSS -- non abonné';
    if (id === 'spotify') return 'Spotify -- bientôt';
    return 'WhatsApp -- bientôt';
  };

  return (
    <>
      <SkipLink />
      <div className="mesh-bg" aria-hidden="true">
        <span className="mesh-spot" />
      </div>
      <Stars />
      <div id="app" className="app-shell">
        <aside className="app-sidebar" aria-label="Navigation">
          <Link to="/dashboard" className="app-side-brand" title="Threshold">
            <BrandMark size={28} />
            <span className="app-side-label">Threshold</span>
          </Link>

          <nav className="app-side-nav" aria-label="Sections">
            {visibleTabs.map((tab) => (
              <SideLink
                key={tab.to}
                to={tab.to}
                end={'end' in tab ? tab.end : false}
                label={tab.label}
                icon={tab.icon}
              />
            ))}
          </nav>

          <div className="app-side-foot">
            <ThemeToggle variant="pill" />
            <button
              type="button"
              className="app-side-link app-side-logout"
              title="Se déconnecter"
              onClick={handleLogout}
            >
              <span className="app-side-ico" aria-hidden="true">
                <IconLogout />
              </span>
              <span className="app-side-label">Se déconnecter</span>
            </button>
          </div>
        </aside>

        <div className="app-body">
          <div
            className={`appbar${isDashboardHome ? ' appbar--compact-mobile appbar--studio' : ''}`}
          >
            <div className="appbar-inner">
              {isDashboardHome ? (
                <label className="appbar-search">
                  <IconSearch />
                  <input
                    type="search"
                    placeholder="Rechercher…"
                    aria-label="Rechercher dans le dashboard"
                  />
                </label>
              ) : (
                <Link to="/dashboard" className="appbar-brand brand-link">
                  <Brand size={24} fontSize="1.05rem" />
                </Link>
              )}

              {isDashboardHome ? (
                <nav className="appbar-pills" aria-label="Sections">
                  {visibleTabs.map((tab) => (
                    <NavLink
                      key={tab.to}
                      to={tab.to}
                      end={'end' in tab ? tab.end : false}
                      className={({ isActive }) => `appbar-pill${isActive ? ' active' : ''}`}
                    >
                      {tab.label}
                    </NavLink>
                  ))}
                </nav>
              ) : (
                <div className="appbar-services" role="list" aria-label="Services connectés">
                  {SERVICE_CHIPS.map((svc) => {
                    const active = isSubscribed(svc.id);
                    return (
                      <Link
                        key={svc.id}
                        to="/services"
                        role="listitem"
                        className={`appbar-svc accent-${svc.accent}${active ? ' on' : ' off'}`}
                        title={serviceTitle(svc.id, active)}
                        aria-label={serviceTitle(svc.id, active)}
                      >
                        <span className="appbar-svc-ico" aria-hidden="true">
                          {svc.icon}
                        </span>
                        <span className="appbar-svc-label">{svc.label}</span>
                        <span className={`appbar-svc-dot${active ? ' live' : ''}`} aria-hidden="true" />
                      </Link>
                    );
                  })}
                </div>
              )}

              <div className="appbar-right">
                <span className="appbar-theme-mobile">
                  <ThemeToggle variant="icon" />
                </span>
                {isDashboardHome && (
                  <button type="button" className="appbar-bell" aria-label="Notifications">
                    <IconBell />
                    <span className="appbar-bell-dot" aria-hidden="true" />
                  </button>
                )}
                <div className="clock">
                  <div className="t">{time}</div>
                </div>
                <Link to="/profile" className="appbar-user" title="Profil">
                  <span className="avatar" aria-hidden="true">
                    {initials}
                  </span>
                  <span className="appbar-user-hi">
                    Hi, {user?.name?.split(' ')[0] ?? 'toi'}!
                  </span>
                </Link>
              </div>
            </div>
          </div>

          <main id="main-content" className="app-main">
            <Outlet />
          </main>
        </div>

        <nav className="app-bottom-nav" aria-label="Navigation mobile">
          <div className="app-bottom-pill">
            {visibleTabs.slice(0, Math.ceil(visibleTabs.length / 2)).map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={'end' in tab ? tab.end : false}
                className={({ isActive }) => `app-bottom-link${isActive ? ' active' : ''}`}
              >
                <span className="app-bottom-beam" aria-hidden="true" />
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
                <span className="app-bottom-beam" aria-hidden="true" />
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
