import { useTranslation } from 'react-i18next';
import { PublicLayout } from '../layouts/PublicLayout';

const SECTIONS = ['intro', 'collected', 'purpose', 'thirdParties', 'security', 'retention', 'rights', 'cookies'] as const;

export function PrivacyPage() {
  const { t } = useTranslation();
  return (
    <PublicLayout>
      <section className="legal-page">
        <p className="lp-kicker">{t('legal.privacy.kicker')}</p>
        <h1>{t('legal.privacy.title')}</h1>
        <p className="legal-updated">{t('legal.privacy.updated')}</p>
        {SECTIONS.map((key) => (
          <div key={key} className="legal-section">
            <h2>{t(`legal.privacy.sections.${key}.title`)}</h2>
            <p>{t(`legal.privacy.sections.${key}.body`)}</p>
          </div>
        ))}
      </section>
    </PublicLayout>
  );
}
