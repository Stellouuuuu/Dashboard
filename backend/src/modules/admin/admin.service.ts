import { db } from "../../db/db.js";
import { widgetInstances, users, auditLogs } from "../../db/schema.js";
import { sql, count, eq, desc } from "drizzle-orm";
import { httpError } from "../../lib/httpError.js";
import { logAudit, AUDIT_ACTIONS } from "../../lib/audit.js";

export interface PublicUser {
  id: number;
  email: string;
  role: string;
  emailConfirmed: boolean;
  suspended: boolean;
  createdAt: Date;
}

const USER_COLUMNS = {
  id: users.id,
  email: users.email,
  role: users.role,
  emailConfirmed: users.emailConfirmed,
  suspended: users.suspended,
  createdAt: users.createdAt,
};

/** GET /api/v1/admin/users — jamais le password_hash (PLAN.md §11). */
export async function listUsers(): Promise<PublicUser[]> {
  return db.select(USER_COLUMNS).from(users).orderBy(users.createdAt);
}

export async function updateUser(
  actorId: number,
  id: number,
  patch: { suspended?: boolean; role?: "user" | "admin" },
): Promise<PublicUser> {
  const [row] = await db.update(users).set(patch).where(eq(users.id, id)).returning(USER_COLUMNS);
  if (!row) throw httpError(404, "ADMIN_USER_NOT_FOUND", "Utilisateur introuvable");
  if (patch.suspended !== undefined) {
    void logAudit(actorId, patch.suspended ? AUDIT_ACTIONS.ADMIN_USER_SUSPENDED : AUDIT_ACTIONS.ADMIN_USER_REACTIVATED, {
      targetEmail: row.email,
    });
  }
  if (patch.role !== undefined) {
    void logAudit(actorId, AUDIT_ACTIONS.ADMIN_USER_ROLE_CHANGED, { targetEmail: row.email, role: patch.role });
  }
  return row;
}

export async function deleteUser(actorId: number, id: number): Promise<void> {
  const deleted = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id, email: users.email });
  if (deleted.length === 0) throw httpError(404, "ADMIN_USER_NOT_FOUND", "Utilisateur introuvable");
  void logAudit(actorId, AUDIT_ACTIONS.ADMIN_USER_DELETED, { targetEmail: deleted[0].email });
}

export interface AuditLogEntry {
  id: number;
  action: string;
  payload: unknown;
  createdAt: Date;
  userEmail: string | null;
}

/** Journal d'activité réel (table audit_logs), le plus récent d'abord — pas de données simulées. */
export async function listAuditLog(limit = 20): Promise<AuditLogEntry[]> {
  const rows = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      payload: auditLogs.payload,
      createdAt: auditLogs.createdAt,
      userEmail: users.email,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
  return rows;
}

export interface AdminStats {
  totalWidgets: number;
  activeUsers: number;
  byWidget: { widgetName: string; count: number }[];
  byStatus: { status: string; count: number }[];
}

/** Stats admin (PLAN.md §6.4) — pas de jointure sur `widgets` : le nom vient déjà de widget_instances. */
export async function getStats(): Promise<AdminStats> {
  const [totalRes] = await db.select({ total: count() }).from(widgetInstances);
  const totalWidgets = totalRes?.total ?? 0;

  const [usersRes] = await db
    .select({ total: sql<number>`count(distinct ${widgetInstances.userId})` })
    .from(widgetInstances);
  const activeUsers = usersRes?.total ?? 0;

  const byWidget = await db
    .select({ widgetName: widgetInstances.widgetName, count: count() })
    .from(widgetInstances)
    .groupBy(widgetInstances.widgetName)
    .orderBy(sql`count(*) desc`)
    .limit(10);

  const byStatus = await db
    .select({ status: widgetInstances.status, count: count() })
    .from(widgetInstances)
    .groupBy(widgetInstances.status);

  return {
    totalWidgets: Number(totalWidgets),
    activeUsers: Number(activeUsers),
    byWidget,
    byStatus,
  };
}
