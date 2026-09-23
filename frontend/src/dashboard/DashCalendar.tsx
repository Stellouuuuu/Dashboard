import { useMemo, useState } from 'react';

const WEEKDAYS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

const TASKS = [
  { id: 't1', when: "Aujourd'hui", label: 'Vérifier le refresh météo Cotonou', done: true },
  { id: 't2', when: "Aujourd'hui", label: 'Relancer OAuth GitHub si expiré', done: false },
  { id: 't3', when: 'Demain', label: 'Ajouter un flux RSS tech', done: false },
  { id: 't4', when: 'Demain', label: 'Ajuster le timer commits à 60s', done: false },
  { id: 't5', when: 'Cette semaine', label: 'Revue des widgets inactifs', done: false },
];

function buildMonth(year: number, month: number) {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Monday-first offset
  let start = first.getDay() - 1;
  if (start < 0) start = 6;
  const cells: (number | null)[] = [];
  for (let i = 0; i < start; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function DashCalendar() {
  const now = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [selected, setSelected] = useState(now.getDate());
  const [tasks, setTasks] = useState(TASKS);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const cells = useMemo(() => buildMonth(year, month), [year, month]);
  const monthLabel = cursor.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth();

  const schedule = useMemo(() => {
    const base = isCurrentMonth ? now.getDate() : 14;
    return Array.from({ length: 6 }, (_, i) => {
      const day = Math.min(base + i, new Date(year, month + 1, 0).getDate());
      const date = new Date(year, month, day);
      return {
        day,
        weekday: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
        monthShort: date.toLocaleDateString('fr-FR', { month: 'short' }),
        year: String(year).slice(2),
        count: [13, 22, 14, 8, 5, 11][i],
        tone: (['red', 'red', 'sky', 'green', 'sky', 'red'] as const)[i],
      };
    });
  }, [year, month, now, isCurrentMonth]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof tasks>();
    for (const t of tasks) {
      const list = map.get(t.when) ?? [];
      list.push(t);
      map.set(t.when, list);
    }
    return [...map.entries()];
  }, [tasks]);

  const highlightDays = useMemo(() => {
    if (!isCurrentMonth) return new Set([selected]);
    return new Set([now.getDate(), selected, now.getDate() + 2, now.getDate() + 5].filter((d) => d <= 31));
  }, [isCurrentMonth, now, selected]);

  return (
    <section className="dash-cal" aria-label="Planning">
      <div className="dash-cal-month">
        <div className="dash-cal-toolbar">
          <h3>{monthLabel}</h3>
          <div className="dash-cal-nav">
            <button
              type="button"
              aria-label="Mois précédent"
              onClick={() => setCursor(new Date(year, month - 1, 1))}
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Mois suivant"
              onClick={() => setCursor(new Date(year, month + 1, 1))}
            >
              ›
            </button>
          </div>
        </div>
        <div className="dash-cal-weekdays">
          {WEEKDAYS.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="dash-cal-grid">
          {cells.map((d, i) => {
            if (d === null) return <span key={`e-${i}`} className="dash-cal-cell is-empty" />;
            const active = highlightDays.has(d);
            const isSel = d === selected;
            return (
              <button
                key={d}
                type="button"
                className={`dash-cal-cell${active ? ' is-active' : ''}${isSel ? ' is-selected' : ''}`}
                onClick={() => setSelected(d)}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      <div className="dash-cal-tasks">
        {grouped.map(([when, list]) => (
          <div key={when} className="dash-cal-task-group">
            <h4>Tâches {when.toLowerCase()}</h4>
            <ul>
              {list.map((t) => (
                <li key={t.id}>
                  <label className={`dash-cal-task${t.done ? ' is-done' : ''}`}>
                    <input
                      type="checkbox"
                      checked={t.done}
                      onChange={() =>
                        setTasks((prev) =>
                          prev.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)),
                        )
                      }
                    />
                    <span>{t.label}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <button type="button" className="dash-cal-edit">
          Éditer
        </button>
      </div>

      <div className="dash-cal-schedule" aria-label="Agenda">
        {schedule.map((row) => (
          <div key={row.day} className="dash-cal-daycard">
            <div className="dash-cal-daynum">
              <b>{row.day}</b>
              <span>
                {row.monthShort} ’{row.year}
              </span>
              <small>{row.weekday}</small>
            </div>
            <span className={`dash-cal-badge tone-${row.tone}`}>{row.count}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
