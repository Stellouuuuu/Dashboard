import { useTranslation } from 'react-i18next';
import { PublicLayout } from '../layouts/PublicLayout';

const SECTIONS = ['editor', 'hosting', 'ip', 'liability', 'contact'] as const;

export function LegalPage() {
  const { t } = useTranslation();
  return (
    <PublicLayout>
      <section className="legal-page">
        <p className="lp-kicker">{t('legal.notice.kicker')}</p>
        <h1>{t('legal.notice.title')}</h1>
        <p className="legal-updated">{t('legal.notice.updated')}</p>
        {SECTIONS.map((key) => (
          <div key={key} className="legal-section">
            <h2>{t(`legal.notice.sections.${key}.title`)}</h2>
            <p>{t(`legal.notice.sections.${key}.body`)}</p>
          </div>
        ))}
      </section>
    </PublicLayout>
  );
}
