import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthLayout } from '../components/AuthLayout';
import { FormField } from '../components/FormField';
import { BrandMark, IconGithub } from '../components/Icons';
import { useAuth } from '../auth/AuthContext';
import { AuthError } from '../api/demo';

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.2s2.7-6.2 6-6.2c1.9 0 3.1.8 3.9 1.5l2.6-2.5C16.9 3.2 14.7 2.2 12 2.2 6.8 2.2 2.6 6.5 2.6 12S6.8 21.8 12 21.8c6.9 0 9.6-4.9 9.6-7.4 0-.5-.1-.9-.1-1.2H12Z"
      />
    </svg>
  );
}

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
        <div className="auth-glass-mark" aria-hidden="true">
          <BrandMark size={40} />
        </div>
        <h1 className="auth-glass-title">Bon retour !</h1>
        <p className="auth-glass-lead">
          Connecte-toi pour retrouver ton dashboard, tes widgets et tes services
          connectés.
        </p>

        <form className="auth-glass-form" onSubmit={onSubmit} noValidate>
          {errors.form && (
            <div className="form-banner error" role="alert">
              {errors.form}
              {errors.form.includes('confirmé') && (
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
            <span className="auth-forgot" title="Bientôt disponible">
              Mot de passe oublié ?
            </span>
          </div>

          <button
            className="btn btn-primary auth-submit"
            type="submit"
            disabled={submitting}
          >
            {submitting ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <div className="rule">ou</div>

        <div className="oauth-row auth-oauth">
          <button type="button" className="oauth-btn" disabled title="Bientôt disponible">
            <GoogleMark /> Continuer avec Google
          </button>
          <button type="button" className="oauth-btn" disabled title="Bientôt disponible">
            <IconGithub /> Continuer avec GitHub
          </button>
        </div>

        <p className="auth-demo-hint">
          Démo : <code>stella@epitech.eu</code> / <code>password123</code>
        </p>

        <div className="switch-line">
          Pas encore de compte ? <Link to="/register">Créer un compte</Link>
        </div>
      </div>
    </AuthLayout>
  );
}
