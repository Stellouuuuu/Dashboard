import { useNavigate } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { CATALOG, SERVICES, SERVICE_LABEL, type ServiceId } from '../data/catalog';
import { IMG } from '../data/images';
import { IconPlay } from '../components/Icons';

const PITCH: Record<ServiceId, string> = {
  weather: 'Météo : température et pluie de tes villes',
  github: 'GitHub : commits et alertes de tes dépôts',
  rss: 'RSS : les derniers articles de tes flux',
};

/** Colonne de gauche : services (cartes image) et widgets disponibles. */
export function DashLeft({ onPickService }: { onPickService: (s: ServiceId) => void }) {
  const { isSubscribed, openWizard } = useAppData();
  const navigate = useNavigate();
  const active = SERVICES.filter((s) => isSubscribed(s)).length;

  return (
    <aside className="dash-left">
      <section className="panel glass" aria-labelledby="svc-title">
        <header className="panel-head">
          <h2 id="svc-title">Services</h2>
          <span className="panel-meta">
            Connectés <b>{active}/{SERVICES.length}</b>
          </span>
        </header>
        <ul className="svc-cards">
          {SERVICES.map((s) => (
            <li key={s}>
              <div className="svc-card">
                <img src={IMG.service[s]} alt="" loading="lazy" />
                <div className="svc-card-shade" aria-hidden="true" />
                <p>{PITCH[s]}</p>
                <button
                  type="button"
                  className="play-btn play-btn--sm"
                  aria-label={
                    isSubscribed(s)
                      ? `Afficher les widgets ${SERVICE_LABEL[s]}`
                      : `Connecter ${SERVICE_LABEL[s]}`
                  }
                  onClick={() => (isSubscribed(s) ? onPickService(s) : navigate('/services'))}
                >
                  <IconPlay />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel glass" aria-labelledby="avail-title">
        <header className="panel-head">
          <h2 id="avail-title">Widgets disponibles</h2>
        </header>
        <ul className="avail-list">
          {CATALOG.map((w) => (
            <li key={w.id}>
              <img src={IMG.widget(w.id)} alt="" loading="lazy" />
              <span className="avail-text">
                <b>{w.name}</b>
                <small>{SERVICE_LABEL[w.service]}</small>
              </span>
              <button
                type="button"
                className="play-btn play-btn--xs"
                aria-label={`Ajouter le widget ${w.name}`}
                onClick={() => openWizard(null, w.id)}
              >
                <IconPlay />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
