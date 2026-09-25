import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppData } from '../context/AppDataContext';
import { IconChevron } from '../components/Icons';
import { formatCompact, formatDate, formatMonthYear, formatNumber, weekdayInitials } from '../i18n/format';

const DAY_MS = 86_400_000;

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
/** Lundi de la semaine de d. */
function mondayOf(d: Date) {
  const s = startOfDay(d);
  return new Date(s.getTime() - ((s.getDay() + 6) % 7) * DAY_MS);
}

/**
 * Planning : calendrier + étapes de prise en main + nombre de rafraîchissements
 * prévus par jour, calculé à partir des fréquences des widgets.
 */
export function DashPlanning() {
  const { t, i18n } = useTranslation();
  const lng = i18n.resolvedLanguage ?? i18n.language;
  const WEEKDAYS = weekdayInitials(lng);
  const { instances, isSubscribed, openWizard } = useAppData();
  const today = startOfDay(new Date());
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(today);

  const perDay = useMemo(
    () => instances.reduce((sum, i) => sum + Math.floor(86_400 / Math.max(1, i.refresh)), 0),
    [instances],
  );
  const now = new Date();
  const secondsLeftToday = (startOfDay(now).getTime() + DAY_MS - now.getTime()) / 1000;
  const leftToday = instances.reduce(
    (sum, i) => sum + Math.floor(secondsLeftToday / Math.max(1, i.refresh)),
    0,
  );

  // Grille du mois (lundi en premier), avec les jours du mois précédent/suivant.
  const cells = useMemo(() => {
    const first = mondayOf(month);
    return Array.from({ length: 42 }, (_, k) => new Date(first.getTime() + k * DAY_MS)).filter(
      (d, k) => k < 35 || d.getMonth() === month.getMonth(),
    );
  }, [month]);
  const weekStart = mondayOf(selected).getTime();
  const inSelectedWeek = (d: Date) => d.getTime() >= weekStart && d.getTime() < weekStart + 7 * DAY_MS;

  const counts = new Map<string, number>();
  instances.forEach((i) => counts.set(i.widgetId, (counts.get(i.widgetId) ?? 0) + 1));
  const steps = [
    {
      group: t('dashboard.planning.groups.start'),
      items: [
        { label: t('dashboard.planning.items.createAccount'), done: true },
        { label: t('dashboard.planning.items.connectGithub'), done: isSubscribed('github') },
        { label: t('dashboard.planning.items.subscribeRss'), done: isSubscribed('rss') },
      ],
    },
    {
      group: t('dashboard.planning.groups.dashboard'),
      items: [
        { label: t('dashboard.planning.items.add6Widgets'), done: instances.length >= 6 },
        { label: t('dashboard.planning.items.duplicateWidget'), done: [...counts.values()].some((n) => n > 1) },
      ],
    },
    {
      group: t('dashboard.planning.groups.further'),
      items: [
        { label: t('dashboard.planning.items.fastTimer'), done: instances.some((i) => i.refresh < 15) },
        { label: t('dashboard.planning.items.reorder'), done: false },
      ],
    },
  ];

  const days = Array.from({ length: 6 }, (_, k) => new Date(selected.getTime() + k * DAY_MS));
  const monthLabel = formatMonthYear(month, lng);

  return (
    <section className="planning" aria-labelledby="planning-title">
      <h2 id="planning-title" className="section-title">
        {t('dashboard.planning.title')}
      </h2>
      <div className="planning-grid">
        <div className="calendar glass">
          <div className="cal">
            <div className="cal-head">
              <h3>{monthLabel}</h3>
              <div className="cal-nav">
                <button
                  type="button"
                  className="round-white"
                  aria-label={t('dashboard.planning.prevMonth')}
                  onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                >
                  <IconChevron dir="left" />
                </button>
                <button
                  type="button"
                  className="round-white"
                  aria-label={t('dashboard.planning.nextMonth')}
                  onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                >
                  <IconChevron dir="right" />
                </button>
              </div>
            </div>
            <div className="cal-grid" role="grid" aria-label={monthLabel}>
              {WEEKDAYS.map((w, k) => (
                <span key={`w${k}`} className="cal-wd" aria-hidden="true">
                  {w}
                </span>
              ))}
              {cells.map((d) => {
                const out = d.getMonth() !== month.getMonth();
                const week = inSelectedWeek(d);
                const dow = (d.getDay() + 6) % 7;
                const cls = [
                  'cal-day',
                  out ? 'is-out' : '',
                  week ? 'in-week' : '',
                  week && dow === 0 ? 'week-start' : '',
                  week && dow === 6 ? 'week-end' : '',
                  sameDay(d, today) ? 'is-today' : '',
                  sameDay(d, selected) ? 'is-selected' : '',
                ]
                  .filter(Boolean)
                  .join(' ');
                return (
                  <button
                    key={d.toISOString()}
                    type="button"
                    className={cls}
                    aria-pressed={sameDay(d, selected)}
                    aria-label={formatDate(d, lng, { weekday: 'long', day: 'numeric', month: 'long' })}
                    onClick={() => setSelected(startOfDay(d))}
                  >
                    <span>{d.getDate()}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="tasks">
            {steps.map((g) => (
              <div key={g.group} className="task-group">
                <h4>{g.group}</h4>
                <ul>
                  {g.items.map((item) => (
                    <li key={item.label} className={item.done ? 'done' : ''}>
                      <span className="task-box" aria-hidden="true" />
                      <span>{item.label}</span>
                      <span className="sr-only">
                        {item.done ? t('dashboard.planning.done') : t('dashboard.planning.todo')}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="tasks-actions">
              <Link to="/services" className="btn-edit">
                {t('dashboard.planning.services')}
              </Link>
              <button type="button" className="btn-edit" onClick={() => openWizard()}>
                {t('dashboard.planning.add')}
              </button>
            </div>
          </div>
        </div>

        <ol className="days" aria-label={t('dashboard.planning.refreshesPerDay')}>
          {days.map((d) => {
            const isToday = sameDay(d, today);
            const weekend = d.getDay() === 0 || d.getDay() === 6;
            const n = isToday ? leftToday : perDay;
            return (
              <li key={d.toISOString()} className={`day glass${weekend ? ' day--cool' : ''}`}>
                <b className="day-num">{d.getDate()}</b>
                <span className="day-text">
                  <small>{formatDate(d, lng, { month: 'long', year: 'numeric' })}</small>
                  <span>{isToday ? t('dashboard.planning.today') : formatDate(d, lng, { weekday: 'long' })}</span>
                </span>
                <span
                  className={`day-badge${weekend ? ' day-badge--light' : ''}`}
                  title={t('dashboard.planning.refreshesPlanned', { count: n, formatted: formatNumber(n, lng) })}
                >
                  {formatCompact(n, lng)}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
