import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { AuthLayout } from '../components/AuthLayout';
import { FormField } from '../components/FormField';
import { useAuth } from '../auth/AuthContext';
import { ApiAuthError } from '../api/auth';

export function RegisterPage() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ email: string } | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!email.trim()) next.email = t('auth.login.emailRequired');
    if (password.length < 12) next.password = t('auth.register.passwordMin');
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      const res = await register(email.trim(), password);
      setDone(res);
    } catch (err) {
      if (err instanceof ApiAuthError && err.code === 'AUTH_EMAIL_TAKEN') {
        setErrors({ email: t('errors.AUTH_EMAIL_TAKEN') });
      } else {
        setErrors({ form: t('auth.register.failed') });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-glass">
        <h1 className="auth-glass-title">
          {done ? t('auth.register.checkInbox') : t('auth.register.title')}
        </h1>
        {!done ? (
          <>
            <p className="auth-glass-lead">{t('auth.register.lead')}</p>
            <form className="auth-glass-form" onSubmit={onSubmit} noValidate>
              {errors.form && (
                <div className="form-banner error" role="alert">
                  {errors.form}
                </div>
              )}
              <FormField label={t('auth.emailLabel')} error={errors.email} htmlFor="reg-email">
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                />
              </FormField>
              <FormField label={t('auth.passwordLabel')} error={errors.password} htmlFor="reg-password">
                <input
                  id="reg-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </FormField>
              <button
                className="btn btn-primary auth-submit"
                type="submit"
                disabled={submitting}
              >
                {submitting ? t('auth.register.submitting') : t('auth.register.submit')}
              </button>
            </form>
            <div className="switch-line">
              {t('auth.register.hasAccount')} <Link to="/login">{t('auth.login.submit')}</Link>
            </div>
          </>
        ) : (
          <div className="confirm-email">
            <p>
              <Trans
                i18nKey="auth.register.confirmSent"
                values={{ email: done.email }}
                components={{ b: <b style={{ color: 'var(--text)' }} /> }}
              />
            </p>
            {import.meta.env.DEV && (
              <p className="auth-demo-hint" style={{ marginBottom: 16 }}>
                {t('auth.register.devMailHint')}{' '}
                <a href="http://localhost:8025" target="_blank" rel="noreferrer">
                  localhost:8025
                </a>
              </p>
            )}
            <Link className="btn btn-primary auth-submit" to="/login">
              {t('auth.register.goToLogin')}
            </Link>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
