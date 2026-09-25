import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '../components/AuthLayout';
import { useAuth } from '../auth/AuthContext';
import { ApiAuthError } from '../api/auth';

export function ConfirmPage() {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const { confirm, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage(t('auth.confirm.missingToken'));
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await confirm(token);
        if (!cancelled) {
          setStatus('ok');
          setMessage(t('auth.confirm.success'));
        }
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setMessage(
            err instanceof ApiAuthError
              ? t(`errors.${err.code}`, { defaultValue: t('auth.confirm.failed') })
              : t('auth.confirm.failed'),
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, confirm, t]);

  return (
    <AuthLayout>
      <div className="auth-glass">
        <h1 className="auth-glass-title">{t('auth.confirm.title')}</h1>
        {status === 'loading' && (
          <div className="confirm-email">
            <div className="boot-spinner" style={{ margin: '0 auto 16px' }} />
            <p>{t('auth.confirm.checking')}</p>
          </div>
        )}
        {status === 'ok' && (
          <div className="confirm-email">
            <div className="form-banner success" role="status">
              {message}
            </div>
            <button
              type="button"
              className="btn btn-primary auth-submit"
              onClick={() => navigate('/login')}
            >
              {t('auth.login.submit')}
            </button>
          </div>
        )}
        {status === 'error' && (
          <div className="confirm-email">
            <div className="form-banner error" role="alert">
              {message}
            </div>
            <Link to="/register" className="btn btn-ghost auth-submit">
              {t('auth.confirm.newAccount')}
            </Link>
            {!isAuthenticated && (
              <div className="switch-line">
                <Link to="/login">{t('auth.login.submit')}</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
