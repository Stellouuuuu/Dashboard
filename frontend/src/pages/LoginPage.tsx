import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthLayout } from '../components/AuthLayout';
import { FormField } from '../components/FormField';
import { useAuth } from '../auth/AuthContext';
import { AuthError } from '../api/demo';

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
    if (!email.trim()) next.email = 'L’email est requis.';
    if (!password) next.password = 'Le mot de passe est requis.';
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
      if (err instanceof AuthError) {
        if (err.code === 'UNCONFIRMED') {
          setErrors({ form: err.message });
        } else {
          setErrors({ form: err.message, password: 'Vérifie ton mot de passe.' });
        }
      } else {
        setErrors({ form: 'Une erreur est survenue. Réessaie.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-glass">
        <h1 className="auth-glass-title">Bon retour.</h1>
        <p className="auth-glass-lead">
          Connecte-toi pour retrouver ton dashboard, tes widgets et tes services
          connectés.
        </p>

        <form className="auth-glass-form" onSubmit={onSubmit} noValidate>
          {errors.form && (
            <div className="form-banner error" role="alert">
              {errors.form}
              {import.meta.env.DEV && errors.form.includes('confirmé') && (
                <>
                  {' '}
                  <Link to="/confirm/pending-yao-token">Confirmer le compte démo</Link>
                </>
              )}
            </div>
          )}

          <FormField label="Email" error={errors.email} htmlFor="login-email">
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="toi@exemple.com"
              aria-invalid={Boolean(errors.email)}
            />
          </FormField>

          <FormField label="Mot de passe" error={errors.password} htmlFor="login-password">
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
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
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
              <span>Se souvenir de moi</span>
            </label>
          </div>

          <button
            className="btn btn-primary auth-submit"
            type="submit"
            disabled={submitting}
          >
            {submitting ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        {import.meta.env.DEV && (
          <p className="auth-demo-hint">
            Démo : <code>stella@epitech.eu</code> / <code>password123</code>
          </p>
        )}

        <div className="switch-line">
          Pas encore de compte ? <Link to="/register">Créer un compte</Link>
        </div>
      </div>
    </AuthLayout>
  );
}
