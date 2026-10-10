import { db } from "../db/db.js";
import { auditLogs } from "../db/schema.js";

// Codes stables, traduits côté front (journal admin) — un nouveau code ici doit
// avoir sa traduction dans frontend/src/i18n/locales/{fr,en}.json → admin.auditEvent.<CODE>.
export const AUDIT_ACTIONS = {
  AUTH_LOGIN: "AUTH_LOGIN",
  OAUTH_GITHUB_LINKED: "OAUTH_GITHUB_LINKED",
  OAUTH_GOOGLE_LINKED: "OAUTH_GOOGLE_LINKED",
  WIDGET_ADDED: "WIDGET_ADDED",
  WIDGET_REMOVED: "WIDGET_REMOVED",
  ADMIN_USER_SUSPENDED: "ADMIN_USER_SUSPENDED",
  ADMIN_USER_REACTIVATED: "ADMIN_USER_REACTIVATED",
  ADMIN_USER_ROLE_CHANGED: "ADMIN_USER_ROLE_CHANGED",
  ADMIN_USER_DELETED: "ADMIN_USER_DELETED",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

/** Écrit une entrée dans `audit_logs` — best-effort, ne doit jamais faire échouer l'action qui l'appelle. */
export async function logAudit(
  userId: number | null,
  action: AuditAction,
  payload?: Record<string, unknown>,
): Promise<void> {
  try {
    await db.insert(auditLogs).values({ userId, action, payload: payload ?? null });
  } catch {
    // Le journal est un journal, pas une contrainte métier : une écriture ratée
    // (ex: DB momentanément indisponible) ne doit jamais bloquer login/widgets/admin.
  }
}
