import { Link } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { IconPlus } from '../components/Icons';

export function DashFeatured() {
  const { openWizard, instances } = useAppData();

  return (
    <section className="dash-featured" aria-label="À la une">
      <img
        src="/dash/hero.jpg"
        alt=""
        className="dash-featured-img"
        loading="eager"
        onError={(e) => {
          const el = e.currentTarget;
          if (!el.src.endsWith('.svg')) el.src = '/dash/hero.svg';
        }}
      />
      <div className="dash-featured-shade" />
      <div className="dash-featured-content">
        <div className="dash-featured-tags">
          <span className="dash-tag dash-tag--hot">Live</span>
          <span className="dash-tag">Widgets</span>
          <span className="dash-tag">Timers</span>
        </div>
        <h2>Threshold — ton tableau, à ton rythme</h2>
        <p>
          {instances.length > 0
            ? `${instances.length} widgets connectés. Ajoute un service ou peaufine un timer.`
            : 'Abonne-toi aux services, configure tes widgets, et laisse les timers tout garder à jour.'}
        </p>
        <div className="dash-featured-actions">
          <button type="button" className="btn btn-light" onClick={() => openWizard()}>
            <IconPlus />
            Ajouter un widget
          </button>
          <Link to="/services" className="btn btn-ghost dash-featured-ghost">
            Gérer les services
          </Link>
        </div>
      </div>
    </section>
  );
}
