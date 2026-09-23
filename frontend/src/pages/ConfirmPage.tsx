import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthLayout } from '../components/AuthLayout';
import { BrandMark } from '../components/Icons';
import { useAuth } from '../auth/AuthContext';
import { AuthError } from '../api/demo';

export function ConfirmPage() {
  const { token } = useParams<{ token: string }>();
  const { confirm, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token manquant.');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await confirm(token);
        if (!cancelled) {
          setStatus('ok');
          setMessage('Compte confirmé -- bienvenue !');
        }
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setMessage(
            err instanceof AuthError
              ? err.message
              : 'La confirmation a échoué.',
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, confirm]);

  return (
    <AuthLayout>
      <div className="auth-glass">
        <div className="auth-glass-mark" aria-hidden="true">
          <BrandMark size={40} />
        </div>
        <h1 className="auth-glass-title">Confirmation d’email</h1>
        {status === 'loading' && (
          <div className="confirm-email">
            <div className="boot-spinner" style={{ margin: '0 auto 16px' }} />
            <p>Vérification du lien…</p>
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
              onClick={() => navigate('/dashboard')}
            >
              Aller au dashboard
            </button>
          </div>
        )}
        {status === 'error' && (
          <div className="confirm-email">
            <div className="form-banner error" role="alert">
              {message}
            </div>
            <Link to="/register" className="btn btn-ghost auth-submit">
              Créer un nouveau compte
            </Link>
            {!isAuthenticated && (
              <div className="switch-line">
                <Link to="/login">Se connecter</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
