import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { FormField } from '../components/FormField';
import { ApiAuthError } from '../api/auth';
import { formatDate } from '../i18n/format';

type ProfileTab = 'general' | 'security';

// Politique réelle du backend (PLAN.md §11, zod `min(12)`) : 12 caractères, rien de plus.
function passwordRules(pw: string, label: string) {
  return [{ ok: pw.length >= 12, label }];
}

export function ProfilePage() {
  const { t, i18n } = useTranslation();
  const lng = i18n.resolvedLanguage ?? i18n.language;
  const { user, updateProfile, logout, changePassword, deleteAccount, sessionRemainingMs } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<ProfileTab>('general');
  const [editingGeneral, setEditingGeneral] = useState(false);
  const [securityView, setSecurityView] = useState<'menu' | 'password' | 'delete'>('menu');

  const [name, setName] = useState(user?.name ?? '');
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

  if (!user) return null;

  const displayName = editingGeneral ? name.trim() || user.name : user.name;
  const initials = displayName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const mins = Math.floor(sessionRemainingMs / 60000);
  const rules = passwordRules(newPassword, t('profile.password.minLength'));

  const resetGeneral = () => {
    setName(user.name);
    setErrors({});
    setSaved(false);
    setEditingGeneral(false);
  };

  const onSaveGeneral = async () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = t('profile.general.nameRequired');
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    setSaved(false);
    try {
      await updateProfile(name.trim());
      setSaved(true);
      setEditingGeneral(false);
    } catch {
      setErrors({ form: t('profile.saveFailed') });
    } finally {
      setSaving(false);
    }
  };

  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!currentPassword) next.current = t('profile.password.currentRequired');
    if (!rules.every((r) => r.ok)) next.new = t('profile.password.newInvalid');
    if (newPassword !== confirmPassword) next.confirm = t('profile.password.mismatch');
    setPwErrors(next);
    if (Object.keys(next).length) return;

    setPwSaving(true);
    setPwSaved(false);
    try {
      await changePassword(currentPassword, newPassword);
      setPwSaved(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      window.setTimeout(() => setSecurityView('menu'), 900);
    } catch (err) {
      const msg =
        err instanceof ApiAuthError
          ? t(`errors.${err.code}`, { defaultValue: t('profile.password.failed') })
          : t('profile.password.failed');
      setPwErrors({ form: msg });
    } finally {
      setPwSaving(false);
    }
  };

  const onDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletePassword.trim()) {
      setDeleteError(t('profile.delete.passwordRequired'));
      return;
    }
    setDeleteSaving(true);
    setDeleteError(undefined);
    try {
      await deleteAccount(deletePassword);
      navigate('/');
    } catch (err) {
      setDeleteError(
        err instanceof ApiAuthError
          ? t(`errors.${err.code}`, { defaultValue: t('profile.delete.failed') })
          : t('profile.delete.failed'),
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
          <h1>{t('profile.title')}</h1>
          <p className="profile-lead">{t('profile.lead')}</p>
        </div>
      </div>

      <div className="profile-tabs" role="tablist" aria-label={t('profile.tabsLabel')}>
        {(
          [
            ['general', t('profile.tabs.general')],
            ['security', t('profile.tabs.security')],
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
          {saved ? t('profile.saved') : errors.form}
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
                  <span className="field-hint">{t('profile.avatarHint')}</span>
                </div>
              </section>

              <section className="profile-card">
                <div className="profile-card-head">
                  <div>
                    <h2>{t('profile.general.title')}</h2>
                    <p>{t('profile.general.lead')}</p>
                  </div>
                </div>

                {!editingGeneral ? (
                  <>
                    <dl className="profile-dl">
                      <div>
                        <dt>{t('profile.general.displayName')}</dt>
                        <dd>{user.name}</dd>
                      </div>
                      <div>
                        <dt>{t('profile.general.email')}</dt>
                        <dd>{user.email}</dd>
                      </div>
                      <div>
                        <dt>{t('profile.general.role')}</dt>
                        <dd>{user.role === 'admin' ? t('profile.roleAdmin') : t('profile.roleUser')}</dd>
                      </div>
                      <div>
                        <dt>{t('profile.general.status')}</dt>
                        <dd className={user.confirmed ? 'ok' : 'warn'}>
                          {user.confirmed ? t('profile.general.confirmed') : t('profile.general.pending')}
                        </dd>
                      </div>
                      <div>
                        <dt>{t('profile.general.memberSince')}</dt>
                        <dd>{formatDate(user.createdAt, lng)}</dd>
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
                        {t('common.edit')}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="profile-fields">
                    <FormField label={t('profile.general.displayName')} error={errors.name} htmlFor="prof-name">
                      <input
                        id="prof-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                      />
                    </FormField>
                    <FormField
                      label={t('profile.general.email')}
                      hint={t('profile.general.emailHint')}
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
                        {t('common.cancel')}
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={saving || !dirtyGeneral}
                        onClick={() => void onSaveGeneral()}
                      >
                        {saving ? t('common.saving') : t('common.save')}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}

          {tab === 'security' && (
            <div className="profile-security">
              {securityView === 'menu' && (
                <section className="profile-action-list">
                  <div className="profile-list-head">
                    <h2>{t('profile.security.title')}</h2>
                    <p>{t('profile.security.lead')}</p>
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
                          <b>{t('profile.security.changePassword')}</b>
                          <small>{t('profile.security.changePasswordHint')}</small>
                        </span>
                        <span className="profile-menu-chevron" aria-hidden="true">
                          ›
                        </span>
                      </button>
                    </li>
                    <li>
                      <div className="profile-menu-item static">
                        <span>
                          <b>{t('profile.security.activeSession')}</b>
                          <small>{t('profile.security.sessionExpires', { count: mins })}</small>
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
                          <b>{t('profile.security.logout')}</b>
                          <small>{t('profile.security.logoutHint')}</small>
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
                          <b>{t('profile.security.logoutAll')}</b>
                          <small>{t('profile.security.logoutAllHint')}</small>
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
                          <b>{t('profile.security.deleteAccount')}</b>
                          <small>{t('profile.security.deleteAccountHint')}</small>
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
                      ← {t('common.back')}
                    </button>
                    <div>
                      <h2>{t('profile.password.title')}</h2>
                      <p>{t('profile.password.lead')}</p>
                    </div>
                  </div>
                  {(pwSaved || pwErrors.form) && (
                    <div
                      className={`form-banner ${pwSaved ? 'success' : 'error'}`}
                      role={pwSaved ? 'status' : 'alert'}
                    >
                      {pwSaved ? t('profile.password.updated') : pwErrors.form}
                    </div>
                  )}
                  <form className="profile-pw-grid" onSubmit={onChangePassword} noValidate>
                    <div className="profile-fields">
                      <FormField
                        label={t('profile.password.current')}
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
                        label={t('profile.password.new')}
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
                        label={t('profile.password.confirm')}
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
                          {t('common.cancel')}
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
                          type="submit"
                          disabled={pwSaving}
                        >
                          {pwSaving ? t('profile.password.updating') : t('common.save')}
                        </button>
                      </div>
                    </div>
                    <aside className="profile-rules">
                      <h3>{t('profile.password.rulesTitle')}</h3>
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
                      ← {t('common.back')}
                    </button>
                    <div>
                      <h2>{t('profile.delete.title')}</h2>
                      <p>{t('profile.delete.lead')}</p>
                    </div>
                  </div>
                  {deleteError && (
                    <div className="form-banner error" role="alert">
                      {deleteError}
                    </div>
                  )}
                  <form className="profile-fields" onSubmit={onDeleteAccount} noValidate>
                    <FormField label={t('profile.delete.passwordLabel')} htmlFor="delete-pw">
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
                        {t('common.cancel')}
                      </button>
                      <button
                        type="submit"
                        className="btn btn-sm profile-btn-danger"
                        disabled={deleteSaving}
                      >
                        {deleteSaving ? t('profile.delete.submitting') : t('profile.delete.submit')}
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
