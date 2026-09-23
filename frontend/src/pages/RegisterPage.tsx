import { Link } from 'react-router-dom';
import { useState } from 'react';
import { AuthLayout } from '../components/AuthLayout';
import { FormField } from '../components/FormField';
import { BrandMark } from '../components/Icons';
import { useAuth } from '../auth/AuthContext';
import { AuthError } from '../api/demo';

export function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ confirmToken: string; email: string } | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Le nom est requis.';
    if (!email.trim()) next.email = 'L’email est requis.';
    if (password.length < 8) next.password = 'Au moins 8 caractères.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      const res = await register(name.trim(), email.trim(), password);
      setDone(res);
    } catch (err) {
      if (err instanceof AuthError && err.code === 'EMAIL_TAKEN') {
        setErrors({ email: err.message });
      } else {
        setErrors({ form: 'Inscription impossible. Réessaie.' });
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
        <h1 className="auth-glass-title">
          {done ? 'Vérifie ta boîte mail' : 'Créer un compte'}
        </h1>
        {!done ? (
          <>
            <p className="auth-glass-lead">
              Ouvre ta première porte vers un dashboard qui rassemble météo, GitHub et
              flux RSS.
            </p>
            <form className="auth-glass-form" onSubmit={onSubmit} noValidate>
              {errors.form && (
                <div className="form-banner error" role="alert">
                  {errors.form}
                </div>
              )}
              <FormField label="Nom" error={errors.name} htmlFor="reg-name">
                <input
                  id="reg-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ton nom"
                />
              </FormField>
              <FormField label="Email" error={errors.email} htmlFor="reg-email">
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="toi@exemple.com"
                />
              </FormField>
              <FormField label="Mot de passe" error={errors.password} htmlFor="reg-password">
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
                {submitting ? 'Création…' : 'Créer mon compte'}
              </button>
            </form>
            <div className="switch-line">
              Déjà un compte ? <Link to="/login">Se connecter</Link>
            </div>
          </>
        ) : (
          <div className="confirm-email">
            <p>
              Un email de confirmation a été envoyé à{' '}
              <b style={{ color: 'var(--text)' }}>{done.email}</b>.
            </p>
            <p className="auth-demo-hint" style={{ marginBottom: 16 }}>
              En démo, ouvre le lien de confirmation directement :
            </p>
            <Link
              className="btn btn-primary auth-submit"
              to={`/confirm/${done.confirmToken}`}
            >
              Ouvrir le lien de confirmation
            </Link>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
