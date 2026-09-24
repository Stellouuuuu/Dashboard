import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  apiDeleteAdminUser,
  apiGetAdminStats,
  apiGetAuditLog,
  apiListAdminUsers,
  apiUpdateAdminUser,
  AdminApiError,
  type ApiAdminStats,
  type ApiAdminUser,
  type ApiAuditLogEntry,
} from '../api/admin';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../auth/AuthContext';
import { formatDate, formatTime } from '../i18n/format';

function formatAuditEntry(t: (key: string, opts?: Record<string, unknown>) => string, entry: ApiAuditLogEntry): string {
  const payload = (entry.payload ?? {}) as Record<string, unknown>;
  return t(`admin.auditEvent.${entry.action}`, {
    email: entry.userEmail ?? '—',
    widgetName: payload.widgetName ?? '',
    targetEmail: payload.targetEmail ?? '',
    role: payload.role ?? '',
    defaultValue: entry.action,
  });
}

export function AdminPage() {
  const { t, i18n } = useTranslation();
  const lng = i18n.resolvedLanguage ?? i18n.language;
  const { toast } = useAppData();
  const { user: me } = useAuth();
  const [stats, setStats] = useState<ApiAdminStats | null>(null);
  const [audit, setAudit] = useState<ApiAuditLogEntry[]>([]);
  const [users, setUsers] = useState<ApiAdminUser[]>([]);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      const rows = await apiListAdminUsers();
      setUsers(rows);
      setUsersError(null);
    } catch (e) {
      setUsersError(e instanceof AdminApiError ? t(`errors.${e.code}`, { defaultValue: t('admin.toast.loadFailed') }) : t('admin.toast.loadFailed'));
    }
  }, [t]);

  const loadStatsAndAudit = useCallback(async () => {
    try {
      const [statsRow, auditRows] = await Promise.all([apiGetAdminStats(), apiGetAuditLog()]);
      setStats(statsRow);
      setAudit(auditRows);
    } catch {
      // Best-effort : la liste des utilisateurs reste l'info principale de la page.
    }
  }, []);

  useEffect(() => {
    void loadUsers();
    void loadStatsAndAudit();
  }, [loadUsers, loadStatsAndAudit]);

  const toggleSuspend = useCallback(
    async (u: ApiAdminUser) => {
      setBusyId(u.id);
      try {
        const updated = await apiUpdateAdminUser(u.id, { suspended: !u.suspended });
        setUsers((list) => list.map((x) => (x.id === u.id ? updated : x)));
        toast(updated.suspended ? t('admin.toast.suspended') : t('admin.toast.reactivated'));
        void loadStatsAndAudit();
      } catch (e) {
        toast(e instanceof AdminApiError ? t(`errors.${e.code}`, { defaultValue: t('admin.toast.actionFailed') }) : t('admin.toast.actionFailed'));
      } finally {
        setBusyId(null);
      }
    },
    [toast, t, loadStatsAndAudit],
  );

  const removeUser = useCallback(
    async (u: ApiAdminUser) => {
      if (!window.confirm(t('admin.confirmDelete', { email: u.email }))) return;
      setBusyId(u.id);
      try {
        await apiDeleteAdminUser(u.id);
        setUsers((list) => list.filter((x) => x.id !== u.id));
        toast(t('admin.toast.deleted'));
        void loadStatsAndAudit();
      } catch (e) {
        toast(e instanceof AdminApiError ? t(`errors.${e.code}`, { defaultValue: t('admin.toast.deleteFailed') }) : t('admin.toast.deleteFailed'));
      } finally {
        setBusyId(null);
      }
    },
    [toast, t, loadStatsAndAudit],
  );

  return (
    <div className="app-pane">
      <div className="pane-head">
        <div>
          <h1>{t('admin.title')}</h1>
          <div className="pane-sub">{t('admin.lead')}</div>
        </div>
      </div>
      <div className="stat-grid">
        <div className="stat-card">
          <b>{users.length}</b>
          <span>{t('admin.stats.users')}</span>
        </div>
        <div className="stat-card">
          <b>{stats ? stats.totalWidgets : '—'}</b>
          <span>{t('admin.stats.widgets')}</span>
        </div>
        <div className="stat-card">
          <b>{stats ? stats.activeUsers : '—'}</b>
          <span>{t('admin.stats.activeUsers')}</span>
        </div>
      </div>
      <div className="admin-grid">
        <div className="table-scroll">
          {usersError && (
            <div className="form-banner error" role="alert" style={{ marginBottom: 12 }}>
              {usersError}
            </div>
          )}
          <table>
            <thead>
              <tr>
                <th>{t('admin.table.email')}</th>
                <th>{t('admin.table.status')}</th>
                <th>{t('admin.table.role')}</th>
                <th>{t('admin.table.registered')}</th>
                <th>{t('admin.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>
                    <span
                      className={`pill-status ${u.emailConfirmed ? 'pill-confirmed' : 'pill-pending'}`}
                    >
                      {u.emailConfirmed ? t('admin.status.confirmed') : t('admin.status.pending')}
                    </span>
                    {u.suspended && (
                      <span className="pill-status pill-pending" style={{ marginLeft: 6 }}>
                        {t('admin.status.suspended')}
                      </span>
                    )}
                  </td>
                  <td>{u.role}</td>
                  <td>{formatDate(u.createdAt, lng, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        disabled={busyId === u.id || u.id === Number(me?.id)}
                        onClick={() => void toggleSuspend(u)}
                      >
                        {u.suspended ? t('admin.action.reactivate') : t('admin.action.suspend')}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        disabled={busyId === u.id || u.id === Number(me?.id)}
                        onClick={() => void removeUser(u)}
                      >
                        {t('admin.action.delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="audit-box">
          <h3>{t('admin.audit.title')}</h3>
          <div>
            {audit.length === 0 && <p className="field-hint">{t('admin.auditEmpty')}</p>}
            {audit.map((a) => (
              <div className="audit-item" key={a.id}>
                <span>{formatTime(new Date(a.createdAt), lng)}</span>
                <p>{formatAuditEntry(t, a)}</p>
              </div>
            ))}
          </div>
          <p className="field-hint" style={{ marginTop: 12 }}>
            {stats
              ? t('admin.audit.activeWidgets', { count: stats.totalWidgets })
              : t('admin.audit.activeWidgets', { count: '—' })}
          </p>
        </div>
      </div>
    </div>
  );
}

export function AdminUserPage() {
  const { t, i18n } = useTranslation();
  const lng = i18n.resolvedLanguage ?? i18n.language;
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<ApiAdminUser | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    apiListAdminUsers()
      .then((rows) => {
        if (cancelled) return;
        setUser(rows.find((u) => u.id === Number(id)) ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (user === undefined) {
    return (
      <div className="app-pane">
        <div className="boot-spinner" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app-pane">
        <div className="form-banner error" role="alert">
          {t('admin.userNotFound')}
        </div>
        <Link to="/admin" className="btn btn-ghost btn-sm">
          {t('admin.backToList')}
        </Link>
      </div>
    );
  }

  return (
    <div className="app-pane">
      <div className="pane-head">
        <div>
          <p className="eyebrow">
            <Link to="/admin" className="table-link">
              ← {t('admin.breadcrumb')}
            </Link>
          </p>
          <h1>{user.email}</h1>
          <div className="pane-sub">
            {user.role === 'admin' ? t('admin.roleAdmin') : t('admin.roleUser')}
            {user.suspended ? ` · ${t('admin.status.suspended')}` : ''}
          </div>
        </div>
        <span className={`pill-status ${user.emailConfirmed ? 'pill-confirmed' : 'pill-pending'}`}>
          {user.emailConfirmed ? t('admin.status.confirmed') : t('admin.status.pending')}
        </span>
      </div>

      <div className="profile-grid">
        <div className="stat-card">
          <span>{t('admin.identifier')}</span>
          <b style={{ fontSize: '1rem' }}>{user.id}</b>
        </div>
        <div className="stat-card">
          <span>{t('admin.table.role')}</span>
          <b style={{ fontSize: '1rem' }}>{user.role}</b>
        </div>
        <div className="stat-card">
          <span>{t('admin.table.registered')}</span>
          <b style={{ fontSize: '1rem' }}>{formatDate(user.createdAt, lng, { day: 'numeric', month: 'short', year: 'numeric' })}</b>
        </div>
      </div>
    </div>
  );
}
