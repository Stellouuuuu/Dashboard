import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../auth/AuthContext';
import { IconPlus } from '../components/Icons';
import { WidgetGrid } from '../dashboard/WidgetGrid';
import { DashRail } from '../dashboard/DashRail';
import { DashFeatured } from '../dashboard/DashFeatured';
import { DashCalendar } from '../dashboard/DashCalendar';
import { DashWidgetStrip } from '../dashboard/DashWidgetStrip';
import { SERVICE_LABEL, catalogOf, type ServiceId } from '../data/catalog';

const FILTERS: { id: 'all' | ServiceId; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'weather', label: SERVICE_LABEL.weather },
  { id: 'github', label: SERVICE_LABEL.github },
  { id: 'rss', label: SERVICE_LABEL.rss },
  { id: 'spotify', label: SERVICE_LABEL.spotify },
  { id: 'whatsapp', label: SERVICE_LABEL.whatsapp },
];

export function DashboardPage() {
  const { lastRefreshSec, openWizard, loadWidgets, instances, widgetsLoading } =
    useAppData();
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | ServiceId>('all');
  const firstName = user?.name?.split(' ')[0] ?? 'toi';

  useEffect(() => {
    void loadWidgets();
  }, [loadWidgets]);

  const filtered = useMemo(() => {
    if (filter === 'all') return instances;
    return instances.filter((inst) => catalogOf(inst.widgetId)?.service === filter);
  }, [instances, filter]);

  return (
    <div className="app-pane dash-home dash-studio">
      <header className="dash-home-head">
        <div className="dash-home-greet">
          <h1>Hi {firstName}</h1>
          <p>Bienvenue chez toi</p>
        </div>
        <Link to="/profile" className="dash-home-avatar" title="Profil" aria-label="Profil">
          {(user?.name ?? 'U')
            .split(' ')
            .map((p) => p[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </Link>
      </header>

      <div className="dash-filters" role="tablist" aria-label="Filtrer par service">
        <button
          type="button"
          className="dash-filter-add"
          aria-label="Ajouter un widget"
          onClick={() => openWizard()}
        >
          <IconPlus />
        </button>
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            className={`dash-filter-chip${filter === f.id ? ' active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="dash-studio-layout">
        <DashRail />

        <div className="dash-studio-main">
          <DashFeatured />
          <DashWidgetStrip instances={filtered} onOpen={(uid) => openWizard(uid)} />
          <DashCalendar />

          <div className="pane-head pane-head--compact pane-head--desktop dash-studio-grid-head">
            <div>
              <h2 className="pane-title">Tous les widgets</h2>
              <div className="pane-sub">
                <span className="pulse-dot" aria-hidden="true" />
                {widgetsLoading
                  ? 'chargement…'
                  : (
                    <>
                      dernier rafraîchissement il y a <span>{lastRefreshSec}</span>s
                    </>
                  )}
              </div>
            </div>
            {instances.length > 0 && (
              <button type="button" className="btn btn-outline btn-sm" onClick={() => openWizard()}>
                <IconPlus />
                Ajouter
              </button>
            )}
          </div>

          <WidgetGrid instancesOverride={filtered} masonry />
        </div>
      </div>
    </div>
  );
}
