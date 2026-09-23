import { Link } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout';

export function NotFoundPage() {
  return (
    <PublicLayout>
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <p className="eyebrow">404</p>
          <h1>Cette porte n’existe pas</h1>
          <p className="auth-sub">
            La page demandée est introuvable ou a été déplacée.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/" className="btn btn-ghost">
              Accueil
            </Link>
            <Link to="/dashboard" className="btn btn-primary">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
