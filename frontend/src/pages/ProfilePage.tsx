import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { FormField } from '../components/FormField';
import { apiChangePassword, AuthError } from '../api/demo';

type ProfileTab = 'general' | 'security' | 'services';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function passwordRules(pw: string) {
  return [
    { ok: pw.length >= 8, label: 'Au moins 8 caractères' },
    { ok: /[A-Z]/.test(pw), label: 'Une majuscule' },
    { ok: /[0-9]/.test(pw), label: 'Un chiffre' },
    { ok: /[^A-Za-z0-9]/.test(pw), label: 'Un caractère spécial' },
  ];
}

export function ProfilePage() {
  const { user, updateProfile, logout, deleteAccount, sessionRemainingMs } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<ProfileTab>('general');
  const [editingGeneral, setEditingGeneral] = useState(false);
  const [editingServices, setEditingServices] = useState(false);
  const [securityView, setSecurityView] = useState<'menu' | 'password' | 'delete'>('menu');

  const [name, setName] = useState(user?.name ?? '');
  const [githubHint, setGithubHint] = useState(
    user?.serviceCredentials.githubUsername ?? '',
  );
  const [weatherDefaultCity, setWeatherDefaultCity] = useState(
    user?.serviceCredentials.weatherDefaultCity ?? '',
  );
  const [rssDefaultFeed, setRssDefaultFeed] = useState(
    user?.serviceCredentials.rssDefaultFeed ?? '',
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});

  const [deletePassword, setDeletePassword] = useState('');
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>();

  const dirtyGeneral = useMemo(() => {
    if (!user) return false;
    return name.trim() !== user.name;
  }, [user, name]);

  const dirtyServices = useMemo(() => {
    if (!user) return false;
    return (
      (githubHint.trim() || undefined) !== (user.serviceCredentials.githubUsername || undefined) ||
      (weatherDefaultCity.trim() || undefined) !==
        (user.serviceCredentials.weatherDefaultCity || undefined) ||
      (rssDefaultFeed.trim() || undefined) !== (user.serviceCredentials.rssDefaultFeed || undefined)
    );
  }, [user, githubHint, weatherDefaultCity, rssDefaultFeed]);

  if (!user) return null;

  const displayName = editingGeneral ? name.trim() || user.name : user.name;
  const initials = displayName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const mins = Math.floor(sessionRemainingMs / 60000);
  const rules = passwordRules(newPassword);

  const resetGeneral = () => {
    setName(user.name);
    setErrors({});
    setSaved(false);
    setEditingGeneral(false);
  };

  const resetServices = () => {
    setGithubHint(user.serviceCredentials.githubUsername ?? '');
    setWeatherDefaultCity(user.serviceCredentials.weatherDefaultCity ?? '');
    setRssDefaultFeed(user.serviceCredentials.rssDefaultFeed ?? '');
    setErrors({});
    setSaved(false);
    setEditingServices(false);
  };

  const onSaveGeneral = async () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Le nom est requis.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    setSaved(false);
    try {
      await updateProfile({ name: name.trim() });
      setSaved(true);
      setEditingGeneral(false);
    } catch {
      setErrors({ form: 'Enregistrement impossible.' });
    } finally {
      setSaving(false);
    }
  };

  const onSaveServices = async () => {
    setSaving(true);
    setSaved(false);
    setErrors({});
    try {
      await updateProfile({
        serviceCredentials: {
          githubUsername: githubHint.trim() || undefined,
          weatherDefaultCity: weatherDefaultCity.trim() || undefined,
          rssDefaultFeed: rssDefaultFeed.trim() || undefined,
        },
      });
      setSaved(true);
      setEditingServices(false);
    } catch {
      setErrors({ form: 'Enregistrement impossible.' });
    } finally {
      setSaving(false);
    }
  };

  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!currentPassword) next.current = 'Indique ton mot de passe actuel.';
    if (!rules.every((r) => r.ok)) next.new = 'Le nouveau mot de passe ne respecte pas les règles.';
    if (newPassword !== confirmPassword) next.confirm = 'Les mots de passe ne correspondent pas.';
    setPwErrors(next);
    if (Object.keys(next).length) return;

    setPwSaving(true);
    setPwSaved(false);
    try {
      await apiChangePassword(user.id, currentPassword, newPassword);
      setPwSaved(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      window.setTimeout(() => setSecurityView('menu'), 900);
    } catch (err) {
      const msg =
        err instanceof AuthError ? err.message : 'Impossible de changer le mot de passe.';
      setPwErrors({ form: msg });
    } finally {
      setPwSaving(false);
    }
  };

  const onDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletePassword.trim()) {
      setDeleteError('Confirme avec ton mot de passe.');
      return;
    }
    setDeleteSaving(true);
    setDeleteError(undefined);
    try {
      await deleteAccount(deletePassword);
      navigate('/');
    } catch (err) {
      setDeleteError(
        err instanceof AuthError ? err.message : 'Suppression impossible.',
      );
    } finally {
      setDeleteSaving(false);
    }
  };

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPwErrors({});
    setPwSaved(false);
    setSecurityView('menu');
  };

  return (
    <div className="app-pane profile-page">
      <div className="profile-head">
        <div>
          <h1>Profil</h1>
          <p className="profile-lead">
            Mets à jour tes informations, tes identifiants de service et la sécurité du compte.
          </p>
        </div>
      </div>

      <div className="profile-tabs" role="tablist" aria-label="Sections du profil">
        {(
          [
            ['general', 'Général'],
            ['services', 'Services'],
            ['security', 'Sécurité'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? 'active' : undefined}
            onClick={() => {
              setTab(id);
              if (id !== 'security') setSecurityView('menu');
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {(saved || errors.form) && tab !== 'security' && (
        <div
          className={`form-banner ${saved ? 'success' : 'error'}`}
          role={saved ? 'status' : 'alert'}
        >
          {saved ? 'Profil enregistré.' : errors.form}
        </div>
      )}

      <div className="profile-layout profile-layout-single">
        <div className="profile-main">
          {tab === 'general' && (
            <div className="profile-general">
              <section className="profile-hero">
                <div className="profile-avatar-xl" aria-hidden="true">
                  {initials}
                </div>
                <div className="profile-hero-text">
                  <b>{user.name}</b>
                  <p>{user.email}</p>
                  <span className="field-hint">
                    Avatar généré depuis tes initiales.
                  </span>
                </div>
              </section>

              <section className="profile-card">
                <div className="profile-card-head">
                  <div>
                    <h2>Informations personnelles</h2>
                    <p>Détails liés à ton compte Threshold.</p>
                  </div>
                </div>

                {!editingGeneral ? (
                  <>
                    <dl className="profile-dl">
                      <div>
                        <dt>Nom affiché</dt>
                        <dd>{user.name}</dd>
                      </div>
                      <div>
                        <dt>Adresse e-mail</dt>
                        <dd>{user.email}</dd>
                      </div>
                      <div>
                        <dt>Rôle</dt>
                        <dd>{user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}</dd>
                      </div>
                      <div>
                        <dt>Statut</dt>
                        <dd className={user.confirmed ? 'ok' : 'warn'}>
                          {user.confirmed ? 'Compte confirmé' : 'En attente'}
                        </dd>
                      </div>
                      <div>
                        <dt>Membre depuis</dt>
                        <dd>{formatDate(user.createdAt)}</dd>
                      </div>
                    </dl>
                    <div className="profile-section-actions">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm profile-edit-btn"
                        onClick={() => {
                          setName(user.name);
                          setEditingGeneral(true);
                          setSaved(false);
                        }}
                      >
                        <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                        </svg>
                        Modifier
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="profile-fields">
                    <FormField label="Nom affiché" error={errors.name} htmlFor="prof-name">
                      <input
                        id="prof-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                      />
                    </FormField>
                    <FormField
                      label="Adresse e-mail"
                      hint="L’e-mail ne peut pas être modifié ici."
                      htmlFor="prof-email"
                    >
                      <div className="profile-input-readonly">
                        <input id="prof-email" value={user.email} readOnly />
                      </div>
                    </FormField>
                    <div className="profile-section-actions">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        disabled={saving}
                        onClick={resetGeneral}
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={saving || !dirtyGeneral}
                        onClick={() => void onSaveGeneral()}
                      >
                        {saving ? 'Enregistrement…' : 'Enregistrer'}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}

          {tab === 'services' && (
            <section className="profile-card">
              <div className="profile-card-head">
                <div>
                  <h2>Identifiants de service</h2>
                  <p>Valeurs par défaut utilisées lors de la configuration des widgets.</p>
                </div>
              </div>

              {!editingServices ? (
                <>
                  <dl className="profile-dl">
                    <div>
                      <dt>Pseudo GitHub</dt>
                      <dd>{user.serviceCredentials.githubUsername || '—'}</dd>
                    </div>
                    <div>
                      <dt>Ville météo par défaut</dt>
                      <dd>{user.serviceCredentials.weatherDefaultCity || '—'}</dd>
                    </div>
                    <div>
                      <dt>Flux RSS par défaut</dt>
                      <dd>{user.serviceCredentials.rssDefaultFeed || '—'}</dd>
                    </div>
                  </dl>
                  <div className="profile-section-actions">
                    <Link to="/services" className="btn btn-ghost btn-sm">
                      Ouvrir Mes services
                    </Link>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm profile-edit-btn"
                      onClick={() => {
                        setGithubHint(user.serviceCredentials.githubUsername ?? '');
                        setWeatherDefaultCity(user.serviceCredentials.weatherDefaultCity ?? '');
                        setRssDefaultFeed(user.serviceCredentials.rssDefaultFeed ?? '');
                        setEditingServices(true);
                        setSaved(false);
                      }}
                    >
                      <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                      Modifier
                    </button>
                  </div>
                </>
              ) : (
                <div className="profile-fields">
                  <FormField
                    label="Pseudo GitHub"
                    hint="Suggestion affichée pendant la connexion OAuth"
                    htmlFor="prof-gh"
                  >
                    <input
                      id="prof-gh"
                      value={githubHint}
                      onChange={(e) => setGithubHint(e.target.value)}
                      placeholder="stella-dev"
                    />
                  </FormField>
                  <FormField label="Ville météo par défaut" htmlFor="prof-city">
                    <input
                      id="prof-city"
                      value={weatherDefaultCity}
                      onChange={(e) => setWeatherDefaultCity(e.target.value)}
                      placeholder="Cotonou"
                    />
                  </FormField>
                  <FormField label="Flux RSS par défaut" htmlFor="prof-rss">
                    <input
                      id="prof-rss"
                      value={rssDefaultFeed}
                      onChange={(e) => setRssDefaultFeed(e.target.value)}
                      placeholder="https://…"
                    />
                  </FormField>
                  <div className="profile-section-actions">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      disabled={saving}
                      onClick={resetServices}
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={saving || !dirtyServices}
                      onClick={() => void onSaveServices()}
                    >
                      {saving ? 'Enregistrement…' : 'Enregistrer'}
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {tab === 'security' && (
            <div className="profile-security">
              {securityView === 'menu' && (
                <section className="profile-action-list">
                  <div className="profile-list-head">
                    <h2>Sécurité</h2>
                    <p>Mot de passe, session et compte.</p>
                  </div>
                  <ul className="profile-menu">
                    <li>
                      <button
                        type="button"
                        className="profile-menu-item"
                        onClick={() => {
                          setPwSaved(false);
                          setPwErrors({});
                          setSecurityView('password');
                        }}
                      >
                        <span>
                          <b>Changer de mot de passe</b>
                          <small>Mettre à jour le mot de passe de ton compte</small>
                        </span>
                        <span className="profile-menu-chevron" aria-hidden="true">
                          ›
                        </span>
                      </button>
                    </li>
                    <li>
                      <div className="profile-menu-item static">
                        <span>
                          <b>Session active</b>
                          <small>Expire dans {mins} min · navigateur actuel</small>
                        </span>
                      </div>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="profile-menu-item"
                        onClick={async () => {
                          await logout();
                          navigate('/');
                        }}
                      >
                        <span>
                          <b>Se déconnecter</b>
                          <small>Fermer la session sur cet appareil</small>
                        </span>
                        <span className="profile-menu-chevron" aria-hidden="true">
                          ›
                        </span>
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="profile-menu-item"
                        onClick={async () => {
                          await logout();
                          navigate('/login');
                        }}
                      >
                        <span>
                          <b>Se déconnecter de tous les appareils</b>
                          <small>Invalider la session en cours (démo)</small>
                        </span>
                        <span className="profile-menu-chevron" aria-hidden="true">
                          ›
                        </span>
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="profile-menu-item danger"
                        onClick={() => {
                          setDeletePassword('');
                          setDeleteError(undefined);
                          setSecurityView('delete');
                        }}
                      >
                        <span>
                          <b>Supprimer le compte</b>
                          <small>Action définitive — données locales effacées</small>
                        </span>
                        <span className="profile-menu-chevron" aria-hidden="true">
                          ›
                        </span>
                      </button>
                    </li>
                  </ul>
                </section>
              )}

              {securityView === 'password' && (
                <section className="profile-card">
                  <div className="profile-card-head">
                    <button
                      type="button"
                      className="profile-back"
                      onClick={resetPasswordForm}
                    >
                      ← Retour
                    </button>
                    <div>
                      <h2>Changer de mot de passe</h2>
                      <p>Choisis un mot de passe robuste pour sécuriser ton accès.</p>
                    </div>
                  </div>
                  {(pwSaved || pwErrors.form) && (
                    <div
                      className={`form-banner ${pwSaved ? 'success' : 'error'}`}
                      role={pwSaved ? 'status' : 'alert'}
                    >
                      {pwSaved ? 'Mot de passe mis à jour.' : pwErrors.form}
                    </div>
                  )}
                  <form className="profile-pw-grid" onSubmit={onChangePassword} noValidate>
                    <div className="profile-fields">
                      <FormField
                        label="Mot de passe actuel"
                        error={pwErrors.current}
                        htmlFor="pw-current"
                      >
                        <input
                          id="pw-current"
                          type="password"
                          autoComplete="current-password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                      </FormField>
                      <FormField
                        label="Nouveau mot de passe"
                        error={pwErrors.new}
                        htmlFor="pw-new"
                      >
                        <input
                          id="pw-new"
                          type="password"
                          autoComplete="new-password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </FormField>
                      <FormField
                        label="Confirmer le mot de passe"
                        error={pwErrors.confirm}
                        htmlFor="pw-confirm"
                      >
                        <input
                          id="pw-confirm"
                          type="password"
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </FormField>
                      <div className="profile-section-actions">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={resetPasswordForm}
                        >
                          Annuler
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
                          type="submit"
                          disabled={pwSaving}
                        >
                          {pwSaving ? 'Mise à jour…' : 'Enregistrer'}
                        </button>
                      </div>
                    </div>
                    <aside className="profile-rules">
                      <h3>Règles du mot de passe</h3>
                      <ul>
                        {rules.map((r) => (
                          <li key={r.label} className={r.ok ? 'ok' : undefined}>
                            {r.label}
                          </li>
                        ))}
                      </ul>
                    </aside>
                  </form>
                </section>
              )}

              {securityView === 'delete' && (
                <section className="profile-card">
                  <div className="profile-card-head">
                    <button
                      type="button"
                      className="profile-back"
                      onClick={() => {
                        setSecurityView('menu');
                        setDeletePassword('');
                        setDeleteError(undefined);
                      }}
                    >
                      ← Retour
                    </button>
                    <div>
                      <h2>Supprimer le compte</h2>
                      <p>
                        Cette action est définitive. Confirme avec ton mot de passe pour
                        continuer.
                      </p>
                    </div>
                  </div>
                  {deleteError && (
                    <div className="form-banner error" role="alert">
                      {deleteError}
                    </div>
                  )}
                  <form className="profile-fields" onSubmit={onDeleteAccount} noValidate>
                    <FormField label="Mot de passe" htmlFor="delete-pw">
                      <input
                        id="delete-pw"
                        type="password"
                        autoComplete="current-password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                      />
                    </FormField>
                    <div className="profile-section-actions">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          setSecurityView('menu');
                          setDeletePassword('');
                          setDeleteError(undefined);
                        }}
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="btn btn-sm profile-btn-danger"
                        disabled={deleteSaving}
                      >
                        {deleteSaving ? 'Suppression…' : 'Supprimer mon compte'}
                      </button>
                    </div>
                  </form>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
