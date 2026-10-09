import { db } from "../../db/db.js";
import { widgetInstances, widgetCache } from "../../db/schema.js";
import { eq, and } from "drizzle-orm";

export type WidgetInstanceRow = typeof widgetInstances.$inferSelect;
export type WidgetInstanceInsert = typeof widgetInstances.$inferInsert;
export type WidgetCacheRow = typeof widgetCache.$inferSelect;

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
