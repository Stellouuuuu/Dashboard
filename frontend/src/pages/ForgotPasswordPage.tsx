import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '../components/AuthLayout';
import { FormField } from '../components/FormField';
import { ApiAuthError, apiForgotPassword, apiResetPassword } from '../api/auth';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrors({ email: t('auth.login.emailRequired') });
      return;
    }
    setSubmitting(true);
    setErrors({});
    try {
      await apiForgotPassword(email.trim());
      navigate(`/reset-password?email=${encodeURIComponent(email.trim())}`);
    } catch {
      setErrors({ form: t('auth.forgot.failed') });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-glass">
        <h1 className="auth-glass-title">{t('auth.forgot.title')}</h1>
        <p className="auth-glass-lead">{t('auth.forgot.lead')}</p>
        <form className="auth-glass-form" onSubmit={onSubmit} noValidate>
          {errors.form && (
            <div className="form-banner error" role="alert">
              {errors.form}
            </div>
          )}
          <FormField label={t('auth.emailLabel')} error={errors.email} htmlFor="forgot-email">
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
            />
          </FormField>
          <button className="btn btn-primary auth-submit" type="submit" disabled={submitting}>
            {submitting ? t('auth.forgot.submitting') : t('auth.forgot.submit')}
          </button>
        </form>
        <div className="switch-line">
          <Link to="/login">{t('auth.login.submit')}</Link>
        </div>
      </div>
    </AuthLayout>
  );
}

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!email.trim()) next.email = t('auth.login.emailRequired');
    if (!/^\d{6}$/.test(code.trim())) next.code = t('auth.confirm.codeInvalid');
    if (password.length < 12) next.password = t('auth.register.passwordMin');
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await apiResetPassword(email.trim(), code.trim(), password);
      setDone(true);
    } catch (err) {
      setErrors({
        form:
          err instanceof ApiAuthError
            ? t(`errors.${err.code}`, { defaultValue: t('auth.reset.failed') })
            : t('auth.reset.failed'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-glass">
        <h1 className="auth-glass-title">
          {done ? t('auth.reset.successTitle') : t('auth.reset.title')}
        </h1>
        {done ? (
          <div className="confirm-email">
            <div className="form-banner success" role="status">
              {t('auth.reset.success')}
            </div>
            <button
              type="button"
              className="btn btn-primary auth-submit"
              onClick={() => navigate('/login')}
            >
              {t('auth.login.submit')}
            </button>
          </div>
        ) : (
          <>
            <p className="auth-glass-lead">{t('auth.reset.lead')}</p>
            <form className="auth-glass-form" onSubmit={onSubmit} noValidate>
              {errors.form && (
                <div className="form-banner error" role="alert">
                  {errors.form}
                </div>
              )}
              <FormField label={t('auth.emailLabel')} error={errors.email} htmlFor="reset-email">
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                />
              </FormField>
              <FormField label={t('auth.confirm.codeLabel')} error={errors.code} htmlFor="reset-code">
                <input
                  id="reset-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                />
              </FormField>
              <FormField
                label={t('auth.reset.newPassword')}
                error={errors.password}
                htmlFor="reset-password"
              >
                <input
                  id="reset-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </FormField>
              <button className="btn btn-primary auth-submit" type="submit" disabled={submitting}>
                {submitting ? t('auth.reset.submitting') : t('auth.reset.submit')}
              </button>
            </form>
            <div className="switch-line">
              <Link to="/forgot-password">{t('auth.reset.resend')}</Link>
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
