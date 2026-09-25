import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '../components/AuthLayout';
import { FormField } from '../components/FormField';
import { useAuth } from '../auth/AuthContext';
import { ApiAuthError, apiResendConfirm } from '../api/auth';

export function ConfirmPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { confirm } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [done, setDone] = useState(false);
  const [hint, setHint] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!email.trim()) next.email = t('auth.login.emailRequired');
    if (!/^\d{6}$/.test(code.trim())) next.code = t('auth.confirm.codeInvalid');
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    setHint('');
    try {
      await confirm(email.trim(), code.trim());
      setDone(true);
    } catch (err) {
      setErrors({
        form:
          err instanceof ApiAuthError
            ? t(`errors.${err.code}`, { defaultValue: t('auth.confirm.failed') })
            : t('auth.confirm.failed'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const onResend = async () => {
    if (!email.trim()) {
      setErrors({ email: t('auth.login.emailRequired') });
      return;
    }
    setResending(true);
    setErrors({});
    try {
      await apiResendConfirm(email.trim());
      setHint(t('auth.confirm.resent'));
    } catch {
      setErrors({ form: t('auth.confirm.failed') });
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-glass">
        <h1 className="auth-glass-title">
          {done ? t('auth.confirm.successTitle') : t('auth.confirm.title')}
        </h1>
        {done ? (
          <div className="confirm-email">
            <div className="form-banner success" role="status">
              {t('auth.confirm.success')}
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
            <p className="auth-glass-lead">{t('auth.confirm.lead')}</p>
            <form className="auth-glass-form" onSubmit={onSubmit} noValidate>
              {errors.form && (
                <div className="form-banner error" role="alert">
                  {errors.form}
                </div>
              )}
              {hint && (
                <div className="form-banner success" role="status">
                  {hint}
                </div>
              )}
              <FormField label={t('auth.emailLabel')} error={errors.email} htmlFor="confirm-email">
                <input
                  id="confirm-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                />
              </FormField>
              <FormField label={t('auth.confirm.codeLabel')} error={errors.code} htmlFor="confirm-code">
                <input
                  id="confirm-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                />
              </FormField>
              <button className="btn btn-primary auth-submit" type="submit" disabled={submitting}>
                {submitting ? t('auth.confirm.submitting') : t('auth.confirm.submit')}
              </button>
            </form>
            <div className="switch-line">
              <button type="button" className="btn btn-ghost" onClick={onResend} disabled={resending}>
                {resending ? t('auth.confirm.resending') : t('auth.confirm.resend')}
              </button>
            </div>
            <div className="switch-line">
              <Link to="/login">{t('auth.login.submit')}</Link>
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
