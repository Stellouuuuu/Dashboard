import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PublicLayout } from '../layouts/PublicLayout';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <PublicLayout>
      <section className="lp-404">
        <p className="lp-kicker">{t('notFound.kicker')}</p>
        <h1>{t('notFound.title')}</h1>
        <p>{t('notFound.lead')}</p>
        <div className="lp-actions">
          <Link to="/" className="btn btn-ghost">
            {t('notFound.home')}
          </Link>
          <Link to="/dashboard" className="btn btn-primary">
            {t('notFound.dashboard')}
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
