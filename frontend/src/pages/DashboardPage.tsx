import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { SERVICES, SERVICE_LABEL, catalogOf, type ServiceId } from '../data/catalog';
import { WidgetGrid } from '../dashboard/WidgetGrid';
import { DashHero } from '../dashboard/DashHero';
import { DashLeft } from '../dashboard/DashLeft';
import { DashPlanning } from '../dashboard/DashPlanning';
import { summarize } from '../dashboard/summary';

const FILTERS: { id: 'all' | ServiceId; label: string }[] = [
  { id: 'all', label: 'Tous' },
  ...SERVICES.map((id) => ({ id, label: SERVICE_LABEL[id] })),
];

export function DashboardPage() {
  const { loadWidgets, instances, frameIdx } = useAppData();
  const [params] = useSearchParams();
  const query = (params.get('q') ?? '').trim().toLowerCase();
  const [filter, setFilter] = useState<'all' | ServiceId>('all');

  useEffect(() => {
    void loadWidgets();
  }, [loadWidgets]);

  const filtered = useMemo(
    () =>
      instances.filter((inst) => {
        const cat = catalogOf(inst.widgetId);
        if (filter !== 'all' && cat?.service !== filter) return false;
        if (!query) return true;
        const s = summarize(inst, frameIdx[inst.uid] || 0);
        return [cat?.name, cat && SERVICE_LABEL[cat.service], s.kicker, s.title]
          .join(' ')
          .toLowerCase()
          .includes(query);
      }),
    [instances, filter, query, frameIdx],
  );

  const pickService = (s: ServiceId) => {
    setFilter(s);
    document.getElementById('mes-widgets')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="dash">
      <div className="dash-grid">
        <DashLeft onPickService={pickService} />

        <div className="dash-main">
          <DashHero />

          <section id="mes-widgets" aria-labelledby="widgets-title">
            <div className="section-head">
              <h2 id="widgets-title" className="section-title">
                Mes widgets
              </h2>
              <div className="chips" role="tablist" aria-label="Filtrer par service">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    role="tab"
                    aria-selected={filter === f.id}
                    className={`chip${filter === f.id ? ' active' : ''}`}
                    onClick={() => setFilter(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            {query && (
              <p className="search-note">
                Recherche « {params.get('q')} » : {filtered.length} widget{filtered.length > 1 ? 's' : ''}
              </p>
            )}
            <WidgetGrid instancesOverride={filtered} />
          </section>
        </div>
      </div>

      <DashPlanning />
    </div>
  );
}
