import { db } from "../../db/db.js";
import { widgetInstances, widgetCache, widgetHistory, widgetAlerts, dailyBriefs } from "../../db/schema.js";
import { eq, and, desc, notInArray, sql } from "drizzle-orm";

export type WidgetInstanceRow = typeof widgetInstances.$inferSelect;
export type WidgetInstanceInsert = typeof widgetInstances.$inferInsert;
export type WidgetCacheRow = typeof widgetCache.$inferSelect;
export type WidgetHistoryRow = typeof widgetHistory.$inferSelect;
export type WidgetAlertRow = typeof widgetAlerts.$inferSelect;

/** Toutes les instances d'un utilisateur, triées par position (PLAN.md §4.4). */
export async function findInstancesByUser(userId: number): Promise<WidgetInstanceRow[]> {
  return db
    .select()
    .from(widgetInstances)
    .where(eq(widgetInstances.userId, userId))
    .orderBy(widgetInstances.position);
}

/** Une instance par id (vérifie l'appartenance à l'utilisateur). */
export async function findInstanceById(id: number, userId: number): Promise<WidgetInstanceRow | null> {
  const [row] = await db
    .select()
    .from(widgetInstances)
    .where(and(eq(widgetInstances.id, id), eq(widgetInstances.userId, userId)));
  return row ?? null;
}

/** Position d'un nouveau widget : toujours en tête de grille (min - 1, ou 0 pour le premier widget). */
export async function nextPosition(userId: number): Promise<number> {
  const [row] = await db
    .select({ min: sql<number | null>`min(${widgetInstances.position})` })
    .from(widgetInstances)
    .where(eq(widgetInstances.userId, userId));
  return row?.min == null ? 0 : Number(row.min) - 1;
}

export async function createInstance(
  data: Omit<WidgetInstanceInsert, "status">,
): Promise<WidgetInstanceRow> {
  const [row] = await db.insert(widgetInstances).values({ ...data, status: "pending" }).returning();
  return row;
}

export async function updateInstance(
  id: number,
  userId: number,
  data: Partial<WidgetInstanceInsert>,
): Promise<WidgetInstanceRow | null> {
  const [row] = await db
    .update(widgetInstances)
    .set(data)
    .where(and(eq(widgetInstances.id, id), eq(widgetInstances.userId, userId)))
    .returning();
  return row ?? null;
}

export async function updatePosition(
  id: number,
  userId: number,
  position: number,
): Promise<WidgetInstanceRow | null> {
  const [row] = await db
    .update(widgetInstances)
    .set({ position })
    .where(and(eq(widgetInstances.id, id), eq(widgetInstances.userId, userId)))
    .returning();
  return row ?? null;
}

export async function updateRefreshStatus(id: number, status: string): Promise<void> {
  await db
    .update(widgetInstances)
    .set({ status, lastRefreshedAt: new Date() })
    .where(eq(widgetInstances.id, id));
}

export async function deleteInstance(id: number, userId: number): Promise<boolean> {
  const deleted = await db
    .delete(widgetInstances)
    .where(and(eq(widgetInstances.id, id), eq(widgetInstances.userId, userId)))
    .returning();
  return deleted.length > 0;
}

/** Cache serveur (table widget_cache) — remplace le cache Redis (PLAN.md §4.3). */
export async function getCachedPayload(widgetInstanceId: number): Promise<WidgetCacheRow | null> {
  const [row] = await db
    .select()
    .from(widgetCache)
    .where(eq(widgetCache.widgetInstanceId, widgetInstanceId));
  return row ?? null;
}

export async function upsertCachedPayload(widgetInstanceId: number, payload: unknown): Promise<void> {
  await db
    .insert(widgetCache)
    .values({ widgetInstanceId, payload: payload as any, fetchedAt: new Date() })
    .onConflictDoUpdate({
      target: widgetCache.widgetInstanceId,
      set: { payload: payload as any, fetchedAt: new Date() },
    });
}

const HISTORY_MAX_POINTS = 20;

/** Ajoute un point d'historique et garde seulement les HISTORY_MAX_POINTS plus récents (sparkline, bonus). */
export async function recordHistoryPoint(widgetInstanceId: number, value: number): Promise<void> {
  await db.insert(widgetHistory).values({ widgetInstanceId, value });

  const kept = await db
    .select({ id: widgetHistory.id })
    .from(widgetHistory)
    .where(eq(widgetHistory.widgetInstanceId, widgetInstanceId))
    .orderBy(desc(widgetHistory.recordedAt))
    .limit(HISTORY_MAX_POINTS);
  if (kept.length < HISTORY_MAX_POINTS) return;

  await db
    .delete(widgetHistory)
    .where(
      and(
        eq(widgetHistory.widgetInstanceId, widgetInstanceId),
        notInArray(widgetHistory.id, kept.map((r) => r.id)),
      ),
    );
}

export async function getHistory(widgetInstanceId: number): Promise<WidgetHistoryRow[]> {
  return db
    .select()
    .from(widgetHistory)
    .where(eq(widgetHistory.widgetInstanceId, widgetInstanceId))
    .orderBy(widgetHistory.recordedAt);
}

export async function getAlert(widgetInstanceId: number): Promise<WidgetAlertRow | null> {
  const [row] = await db.select().from(widgetAlerts).where(eq(widgetAlerts.widgetInstanceId, widgetInstanceId));
  return row ?? null;
}

export async function setAlert(widgetInstanceId: number, operator: "above" | "below", threshold: number): Promise<void> {
  await db
    .insert(widgetAlerts)
    .values({ widgetInstanceId, operator, threshold })
    .onConflictDoUpdate({
      target: widgetAlerts.widgetInstanceId,
      set: { operator, threshold, lastNotifiedAt: null },
    });
}

export async function clearAlert(widgetInstanceId: number): Promise<void> {
  await db.delete(widgetAlerts).where(eq(widgetAlerts.widgetInstanceId, widgetInstanceId));
}

export async function markAlertNotified(widgetInstanceId: number): Promise<void> {
  await db.update(widgetAlerts).set({ lastNotifiedAt: new Date() }).where(eq(widgetAlerts.widgetInstanceId, widgetInstanceId));
}

/** Instances d'un user avec leur dernier payload en cache (brief IA, bonus). */
export async function getInstancesWithCache(
  userId: number,
): Promise<{ widgetName: string; payload: unknown }[]> {
  const rows = await db
    .select({ widgetName: widgetInstances.widgetName, payload: widgetCache.payload })
    .from(widgetInstances)
    .innerJoin(widgetCache, eq(widgetCache.widgetInstanceId, widgetInstances.id))
    .where(eq(widgetInstances.userId, userId));
  return rows;
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getTodayBrief(userId: number): Promise<{ text: string; generatedAt: Date } | null> {
  const [row] = await db
    .select()
    .from(dailyBriefs)
    .where(and(eq(dailyBriefs.userId, userId), eq(dailyBriefs.briefDate, todayDateString())));
  return row ? { text: row.text, generatedAt: row.generatedAt } : null;
}

export async function saveTodayBrief(userId: number, text: string): Promise<void> {
  const briefDate = todayDateString();
  await db
    .insert(dailyBriefs)
    .values({ userId, briefDate, text })
    .onConflictDoUpdate({
      target: [dailyBriefs.userId, dailyBriefs.briefDate],
      set: { text, generatedAt: new Date() },
    });
}
