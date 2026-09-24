import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppData } from '../context/AppDataContext';
import { SERVICES, type ServiceId } from '../data/catalog';
import { IMG } from '../data/images';
import { widgetName } from '../i18n/widgets';

/** Colonne de gauche : services (cartes image) et widgets disponibles. */
export function DashLeft({ onPickService }: { onPickService: (s: ServiceId) => void }) {
  const { t } = useTranslation();
  const { isSubscribed, openWizard, catalog } = useAppData();
  const navigate = useNavigate();
  const active = SERVICES.filter((s) => isSubscribed(s)).length;

  return (
    <aside className="dash-left">
      <section className="panel glass" aria-labelledby="svc-title">
        <header className="panel-head">
          <h2 id="svc-title">{t('dashboard.left.servicesTitle')}</h2>
          <span className="panel-meta">
            {t('dashboard.left.connected')} <b>{active}/{SERVICES.length}</b>
          </span>
        </header>
        <ul className="svc-cards">
          {SERVICES.map((s) => {
            const svcLabel = t(`common.services.${s}`);
            return (
              <li key={s}>
                <button
                  type="button"
                  className="svc-card"
                  aria-label={
                    isSubscribed(s)
                      ? t('dashboard.left.showWidgets', { service: svcLabel })
                      : t('dashboard.left.connectService', { service: svcLabel })
                  }
                  onClick={() => (isSubscribed(s) ? onPickService(s) : navigate('/services'))}
                >
                  <img src={IMG.service[s]} alt="" loading="lazy" />
                  <div className="svc-card-shade" aria-hidden="true" />
                  <p>{t(`dashboard.left.pitch.${s}`)}</p>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="panel glass" aria-labelledby="avail-title">
        <header className="panel-head">
          <h2 id="avail-title">{t('dashboard.left.availableTitle')}</h2>
        </header>
        <ul className="avail-list">
          {catalog.map((w) => (
            <li key={w.name}>
              <button
                type="button"
                className="avail-row"
                aria-label={t('dashboard.left.addWidgetLabel', { name: widgetName(t, w.name) })}
                onClick={() => openWizard(null, w.name)}
              >
                <img src={IMG.widget(w.name)} alt="" loading="lazy" />
                <span className="avail-text">
                  <b>{widgetName(t, w.name)}</b>
                  <small>{t(`common.services.${w.service}`)}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
