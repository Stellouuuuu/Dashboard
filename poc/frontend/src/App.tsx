import { useState, type FormEvent } from 'react';

interface WidgetData {
  city: string;
  temperature: number;
  unit: string;
  description: string;
  source: string;
  fetchedAt: string;
}

type Status = 'idle' | 'loading' | 'error' | 'ok';

/**
 * The one configurable widget required by the subject's "proof of concept"
 * deliverable: two parameters (city, unit), fetching real data from a real
 * external API (Open-Meteo, via poc/backend) and displaying it.
 */
export function App() {
  const [city, setCity] = useState('Paris');
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const [status, setStatus] = useState<Status>('idle');
  const [data, setData] = useState<WidgetData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchWidget = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setError(null);
    try {
      const res = await fetch(`/api/widgets/city-temperature?city=${encodeURIComponent(city)}&unit=${unit}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      setData(body as WidgetData);
      setStatus('ok');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus('error');
    }
  };

  return (
    <main className="poc-main">
      <h1>Dashboard — Proof of Concept</h1>
      <p className="poc-sub">
        Stack: <strong>React + TypeScript (Vite)</strong> → <strong>Express + TypeScript</strong> →{' '}
        <strong>Open-Meteo</strong> (real external API, no key). Same stack as the real app
        (<code>frontend/</code> / <code>backend/</code>), kept standalone here on purpose.
      </p>

      <form onSubmit={fetchWidget} className="poc-form">
        <label>
          City
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Tokyo" required />
        </label>
        <label>
          Unit
          <select value={unit} onChange={(e) => setUnit(e.target.value as 'C' | 'F')}>
            <option value="C">°C</option>
            <option value="F">°F</option>
          </select>
        </label>
        <button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Fetching…' : 'Add widget / refresh'}
        </button>
      </form>

      {status === 'error' && (
        <div className="poc-card poc-error" role="alert">
          {error}
        </div>
      )}

      {data && status === 'ok' && (
        <div className="poc-card">
          <span className="poc-kicker">{data.city}</span>
          <span className="poc-temp">
            {data.temperature}°{data.unit}
          </span>
          <span>{data.description}</span>
          <small>
            {data.source} · fetched at {new Date(data.fetchedAt).toLocaleTimeString()}
          </small>
        </div>
      )}
    </main>
  );
}
