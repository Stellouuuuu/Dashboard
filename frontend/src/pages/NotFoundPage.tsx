import { Link } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout';

export function NotFoundPage() {
  return (
    <PublicLayout>
      <section className="lp-404">
        <p className="lp-kicker">Erreur 404</p>
        <h1>Cette porte n’existe pas.</h1>
        <p>La page demandée est introuvable ou a été déplacée.</p>
        <div className="lp-actions">
          <Link to="/" className="btn btn-ghost">
            Accueil
          </Link>
          <Link to="/dashboard" className="btn btn-primary">
            Dashboard
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
