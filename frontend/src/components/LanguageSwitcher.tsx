import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../i18n';
import { apiSetLanguage } from '../api/auth';
import { useAuth } from '../auth/AuthContext';

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n, t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const active = (i18n.resolvedLanguage ?? i18n.language ?? 'fr').split('-')[0];

  const choose = (lng: SupportedLanguage) => {
    if (lng === active) return;
    i18n.changeLanguage(lng);
    if (isAuthenticated) {
      apiSetLanguage(lng).catch(() => undefined);
    }
  };

  return (
    <div className={`lang-pill${className ? ` ${className}` : ''}`} role="group" aria-label={t('language.selector')}>
      {SUPPORTED_LANGUAGES.map((lng) => (
        <button
          key={lng}
          type="button"
          className={`lang-pill-btn${active === lng ? ' active' : ''}`}
          aria-pressed={active === lng}
          onClick={() => choose(lng)}
        >
          {lng.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
