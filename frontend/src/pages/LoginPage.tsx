import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '../components/AuthLayout';
import { FormField } from '../components/FormField';
import { useAuth } from '../auth/AuthContext';
import { ApiAuthError } from '../api/auth';

function IconEye({ off }: { off?: boolean }) {
  if (off) {
    return (
      <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10 10 0 0 1 12 5c5 0 9 4.5 10 7-.4 1-1.2 2.4-2.5 3.7M6.1 6.1C4.2 7.5 2.9 9.4 2 12c1 2.5 5 7 10 7 1.4 0 2.7-.3 3.9-.8" />
      </svg>
    );
  }
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function LoginPage() {
  const { t } = useTranslation();
  const { login, isAuthenticated, bootstrapping } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  if (!bootstrapping && isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!email.trim()) next.email = t('auth.login.emailRequired');
    if (!password) next.password = t('auth.login.passwordRequired');
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    setErrors({});
    try {
      await login(email.trim(), password);
      if (!remember) {
        /* session already persisted by demo API; remember is UX-only for now */
      }
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiAuthError) {
        const message = t(`errors.${err.code}`, { defaultValue: t('errors.INTERNAL_ERROR') });
        if (err.code === 'AUTH_EMAIL_NOT_CONFIRMED') {
          setErrors({ form: message });
        } else {
          setErrors({ form: message, password: t('auth.login.checkPassword') });
        }
      } else {
        setErrors({ form: t('errors.INTERNAL_ERROR') });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-glass">
        <h1 className="auth-glass-title">{t('auth.login.title')}</h1>
        <p className="auth-glass-lead">{t('auth.login.lead')}</p>

        <form className="auth-glass-form" onSubmit={onSubmit} noValidate>
          {errors.form && (
            <div className="form-banner error" role="alert">
              {errors.form}
              {errors.form === t('errors.AUTH_EMAIL_NOT_CONFIRMED') && (
                <>
                  {' '}
                  <Link to={`/confirm?email=${encodeURIComponent(email.trim())}`}>
                    {t('auth.register.enterCode')}
                  </Link>
                </>
              )}
            </div>
          )}

          <FormField label={t('auth.emailLabel')} error={errors.email} htmlFor="login-email">
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              aria-invalid={Boolean(errors.email)}
            />
          </FormField>

          <FormField label={t('auth.passwordLabel')} error={errors.password} htmlFor="login-password">
            <div className="auth-input-wrap">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                aria-invalid={Boolean(errors.password)}
              />
              <button
                type="button"
                className="auth-eye"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              >
                <IconEye off={showPassword} />
              </button>
            </div>
          </FormField>

          <div className="auth-row">
            <label className="auth-check">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>{t('auth.login.remember')}</span>
            </label>
            <Link to="/forgot-password" className="auth-forgot">
              {t('auth.login.forgot')}
            </Link>
          </div>

          <button
            className="btn btn-primary auth-submit"
            type="submit"
            disabled={submitting}
          >
            {submitting ? t('auth.login.submitting') : t('auth.login.submit')}
          </button>
        </form>

        <div className="switch-line">
          {t('auth.login.noAccount')} <Link to="/register">{t('auth.login.createAccount')}</Link>
        </div>
      </div>
    </AuthLayout>
  );
}
