import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppData } from '../context/AppDataContext';
import { SERVICES, type ServiceId } from '../data/catalog';
import { WidgetGrid } from '../dashboard/WidgetGrid';
import { DashHero } from '../dashboard/DashHero';
import { DashLeft } from '../dashboard/DashLeft';
import { DashPlanning } from '../dashboard/DashPlanning';
import { summarizeData } from '../dashboard/summary';
import { widgetName } from '../i18n/widgets';

export function DashboardPage() {
  const { t } = useTranslation();
  const { loadWidgets, instances, catalog } = useAppData();
  const [params] = useSearchParams();
  const query = (params.get('q') ?? '').trim().toLowerCase();
  const [filter, setFilter] = useState<'all' | ServiceId>('all');

  const FILTERS: { id: 'all' | ServiceId; label: string }[] = [
    { id: 'all', label: t('dashboard.page.filterAll') },
    ...SERVICES.map((id) => ({ id, label: t(`common.services.${id}`) })),
  ];

  useEffect(() => {
    void loadWidgets();
  }, [loadWidgets]);

  const filtered = useMemo(
    () =>
      instances.filter((inst) => {
        const def = catalog.find((w) => w.name === inst.widgetId);
        if (filter !== 'all' && def?.service !== filter) return false;
        if (!query) return true;
        const s = summarizeData(inst.widgetId, inst.data);
        const name = def ? widgetName(t, def.name) : '';
        return [name, def && t(`common.services.${def.service}`), s.kicker, s.title]
          .join(' ')
          .toLowerCase()
          .includes(query);
      }),
    [instances, catalog, filter, query, t],
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
                {t('dashboard.page.myWidgets')}
              </h2>
              <div className="chips" role="tablist" aria-label={t('dashboard.page.filterLabel')}>
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
                {t('dashboard.page.searchNote', { query: params.get('q'), count: filtered.length })}
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
