import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { IconChevron } from '../components/Icons';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
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
function compact(n: number) {
  return n >= 1000 ? `${Math.round(n / 100) / 10}k`.replace('.', ',') : String(n);
}

/**
 * Planning : calendrier + étapes de prise en main + nombre de rafraîchissements
 * prévus par jour, calculé à partir des fréquences des widgets.
 */
export function DashPlanning() {
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
      group: 'Pour commencer',
      items: [
        { label: 'Créer et confirmer ton compte', done: true },
        { label: 'Connecter ton compte GitHub', done: isSubscribed('github') },
        { label: "S'abonner à un flux RSS", done: isSubscribed('rss') },
      ],
    },
    {
      group: 'Ton dashboard',
      items: [
        { label: 'Ajouter au moins 6 widgets', done: instances.length >= 6 },
        { label: 'Configurer deux fois le même widget', done: [...counts.values()].some((n) => n > 1) },
      ],
    },
    {
      group: 'Pour aller plus loin',
      items: [
        { label: 'Régler un timer sous les 15 s', done: instances.some((i) => i.refresh < 15) },
        { label: 'Réorganiser tes widgets', done: false },
      ],
    },
  ];

  const days = Array.from({ length: 6 }, (_, k) => new Date(selected.getTime() + k * DAY_MS));
  const monthLabel = month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <section className="planning" aria-labelledby="planning-title">
      <h2 id="planning-title" className="section-title">
        Planning
      </h2>
      <div className="planning-grid">
        <div className="calendar glass">
          <div className="cal">
            <div className="cal-head">
              <h3>{monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}</h3>
              <div className="cal-nav">
                <button
                  type="button"
                  className="round-white"
                  aria-label="Mois précédent"
                  onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                >
                  <IconChevron dir="left" />
                </button>
                <button
                  type="button"
                  className="round-white"
                  aria-label="Mois suivant"
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
                    aria-label={d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
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
                  {g.items.map((t) => (
                    <li key={t.label} className={t.done ? 'done' : ''}>
                      <span className="task-box" aria-hidden="true" />
                      <span>{t.label}</span>
                      <span className="sr-only">{t.done ? ' (fait)' : ' (à faire)'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="tasks-actions">
              <Link to="/services" className="btn-edit">
                Services
              </Link>
              <button type="button" className="btn-edit" onClick={() => openWizard()}>
                Ajouter
              </button>
            </div>
          </div>
        </div>

        <ol className="days" aria-label="Rafraîchissements prévus par jour">
          {days.map((d) => {
            const isToday = sameDay(d, today);
            const weekend = d.getDay() === 0 || d.getDay() === 6;
            const n = isToday ? leftToday : perDay;
            return (
              <li key={d.toISOString()} className={`day glass${weekend ? ' day--cool' : ''}`}>
                <b className="day-num">{d.getDate()}</b>
                <span className="day-text">
                  <small>{d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</small>
                  <span>{isToday ? "Aujourd'hui" : d.toLocaleDateString('fr-FR', { weekday: 'long' })}</span>
                </span>
                <span
                  className={`day-badge${weekend ? ' day-badge--light' : ''}`}
                  title={`${n.toLocaleString('fr-FR')} rafraîchissements prévus`}
                >
                  {compact(n)}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
