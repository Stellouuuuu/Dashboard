import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AUDIT_EVENTS } from '../data/catalog';
import { getUsers, type User } from '../auth/session';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useAppData } from '../context/AppDataContext';

interface AuditItem {
  id: number;
  time: string;
  text: string;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function AdminPage() {
  const { instances } = useAppData();
  const reduced = useReducedMotion();
  const [refreshCount, setRefreshCount] = useState(1204);
  const [audit, setAudit] = useState<AuditItem[]>([]);
  const ptrRef = useRef(0);
  const users = useMemo(() => getUsers(), [refreshCount]);

  useEffect(() => {
    const seed: AuditItem[] = [];
    for (let i = 0; i < 3; i++) {
      const now = new Date();
      seed.push({
        id: i,
        time: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        text: AUDIT_EVENTS[i],
      });
    }
    setAudit(seed);
    ptrRef.current = 3;
  }, []);

  useEffect(() => {
    const interval = window.setInterval(
      () => {
        const p = ptrRef.current;
        ptrRef.current = p + 1;
        const now = new Date();
        setAudit((list) =>
          [
            {
              id: Date.now(),
              time: now.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              }),
              text: AUDIT_EVENTS[p % AUDIT_EVENTS.length],
            },
            ...list,
          ].slice(0, 6),
        );
        setRefreshCount((c) => c + Math.ceil(Math.random() * 4));
      },
      reduced ? 8000 : 6000,
    );
    return () => window.clearInterval(interval);
  }, [reduced]);

  return (
    <div className="app-pane">
      <div className="pane-head">
        <div>
          <h1>Administration</h1>
          <div className="pane-sub">Modération des comptes -- clique un utilisateur pour le détail</div>
        </div>
      </div>
      <div className="stat-grid">
        <div className="stat-card">
          <b>{users.length}</b>
          <span>utilisateurs inscrits</span>
        </div>
        <div className="stat-card">
          <b>6</b>
          <span>widgets disponibles</span>
        </div>
        <div className="stat-card">
          <b>{refreshCount}</b>
          <span>rafraîchissements aujourd&apos;hui</span>
        </div>
      </div>
      <div className="admin-grid">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Email</th>
                <th>Statut</th>
                <th>Rôle</th>
                <th>Inscrit le</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <Link to={`/admin/users/${u.id}`} className="table-link">
                      {u.name}
                    </Link>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <span
                      className={`pill-status ${
                        u.confirmed ? 'pill-confirmed' : 'pill-pending'
                      }`}
                    >
                      {u.confirmed ? 'Confirmé' : 'En attente'}
                    </span>
                  </td>
                  <td>{u.role}</td>
                  <td>{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="audit-box">
          <h3>Journal d&apos;activité</h3>
          <div>
            {audit.map((a) => (
              <div className="audit-item" key={a.id}>
                <span>{a.time}</span>
                <p>{a.text}</p>
              </div>
            ))}
          </div>
          <p className="field-hint" style={{ marginTop: 12 }}>
            Widgets actifs sur ton dashboard : {instances.length}
          </p>
        </div>
      </div>
    </div>
  );
}

export function AdminUserPage() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const found = getUsers().find((u) => u.id === id) ?? null;
    setUser(found);
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
          Utilisateur introuvable.
        </div>
        <Link to="/admin" className="btn btn-ghost btn-sm">
          Retour à la liste
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
              ← Administration
            </Link>
          </p>
          <h1>{user.name}</h1>
          <div className="pane-sub">{user.email}</div>
        </div>
        <span
          className={`pill-status ${user.confirmed ? 'pill-confirmed' : 'pill-pending'}`}
        >
          {user.confirmed ? 'Confirmé' : 'En attente'}
        </span>
      </div>

      <div className="profile-grid">
        <div className="stat-card">
          <span>Identifiant</span>
          <b style={{ fontSize: '1rem' }}>{user.id}</b>
        </div>
        <div className="stat-card">
          <span>Rôle</span>
          <b style={{ fontSize: '1rem' }}>{user.role}</b>
        </div>
        <div className="stat-card">
          <span>Inscrit le</span>
          <b style={{ fontSize: '1rem' }}>{formatDate(user.createdAt)}</b>
        </div>
      </div>

      <div className="auth-card" style={{ marginTop: 24, maxWidth: 560 }}>
        <h2 style={{ fontFamily: 'var(--font-d)', fontSize: '1.1rem', marginBottom: 14 }}>
          Identifiants de service
        </h2>
        <div className="review-box">
          <div>
            <span>GitHub</span>
            <b>{user.serviceCredentials.githubUsername || '--'}</b>
          </div>
          <div>
            <span>Ville météo par défaut</span>
            <b>{user.serviceCredentials.weatherDefaultCity || '--'}</b>
          </div>
          <div>
            <span>Flux RSS par défaut</span>
            <b>{user.serviceCredentials.rssDefaultFeed || '--'}</b>
          </div>
        </div>
        {!user.confirmed && user.confirmToken && (
          <p className="field-hint" style={{ marginTop: 14 }}>
            Lien de confirmation démo :{' '}
            <Link to={`/confirm/${user.confirmToken}`}>/confirm/{user.confirmToken}</Link>
          </p>
        )}
      </div>
    </div>
  );
}
