import { db } from "../../database/db.js";
import { widgetInstances, widgets } from "../../database/schema.js";
import { eq, and } from "drizzle-orm";

/** Récupère toutes les instances d'un utilisateur avec les infos du widget */
export async function findInstancesByUser(userId: number) {
  return db
    .select({
      id: widgetInstances.id,
      userId: widgetInstances.userId,
      widgetId: widgetInstances.widgetId,
      widgetSlug: widgets.slug,
      widgetName: widgets.name,
      widgetDescription: widgets.description,
      paramsSchema: widgets.paramsSchema,
      config: widgetInstances.config,
      positionX: widgetInstances.positionX,
      positionY: widgetInstances.positionY,
      width: widgetInstances.width,
      height: widgetInstances.height,
      refreshRate: widgetInstances.refreshRate,
      lastRefreshedAt: widgetInstances.lastRefreshedAt,
      nextRefreshAt: widgetInstances.nextRefreshAt,
      status: widgetInstances.status,
    })
    .from(widgetInstances)
    .innerJoin(widgets, eq(widgetInstances.widgetId, widgets.id))
    .where(eq(widgetInstances.userId, userId));
}

/** Récupère une instance par id (vérifie l'appartenance à l'utilisateur) */
export async function findInstanceById(id: number, userId: number) {
  const [row] = await db
    .select()
    .from(widgetInstances)
    .where(and(eq(widgetInstances.id, id), eq(widgetInstances.userId, userId)));
  return row ?? null;
}

/** Crée une nouvelle instance */
export async function createInstance(data: {
  userId: number;
  widgetId: number;
  config: Record<string, unknown>;
  refreshRate: number;
}) {
  const now = new Date();
  const nextRefresh = new Date(now.getTime() + data.refreshRate * 1000);
  const [row] = await db
    .insert(widgetInstances)
    .values({
      userId: data.userId,
      widgetId: data.widgetId,
      config: data.config,
      refreshRate: data.refreshRate,
      nextRefreshAt: nextRefresh,
      status: "pending",
    })
    .returning();
  return row;
}

/** Met à jour la config et le refreshRate */
export async function updateInstance(
  id: number,
  userId: number,
  data: { config?: Record<string, unknown>; refreshRate?: number }
) {
  const [row] = await db
    .update(widgetInstances)
    .set({ ...data })
    .where(and(eq(widgetInstances.id, id), eq(widgetInstances.userId, userId)))
    .returning();
  return row ?? null;
}

/** Met à jour la position (drag & drop) */
export async function updatePosition(
  id: number,
  userId: number,
  pos: { positionX: number; positionY: number }
) {
  const [row] = await db
    .update(widgetInstances)
    .set(pos)
    .where(and(eq(widgetInstances.id, id), eq(widgetInstances.userId, userId)))
    .returning();
  return row ?? null;
}

/** Met à jour le statut et les timestamps de refresh */
export async function updateRefreshStatus(
  id: number,
  status: "ok" | "error" | "pending"
) {
  const now = new Date();
  await db
    .update(widgetInstances)
    .set({ status, lastRefreshedAt: now })
    .where(eq(widgetInstances.id, id));
}

/** Supprime une instance */
export async function deleteInstance(id: number, userId: number) {
  const deleted = await db
    .delete(widgetInstances)
    .where(and(eq(widgetInstances.id, id), eq(widgetInstances.userId, userId)))
    .returning();
  return deleted.length > 0;
}

/** Récupère les instances dont le refresh est dû */
export async function findInstancesDueForRefresh() {
  const now = new Date();
  const rows = await db
    .select({
      id: widgetInstances.id,
      widgetSlug: widgets.slug,
      config: widgetInstances.config,
      refreshRate: widgetInstances.refreshRate,
    })
    .from(widgetInstances)
    .innerJoin(widgets, eq(widgetInstances.widgetId, widgets.id));

  return rows.filter(
    (r) => {
      const next = (r as any).nextRefreshAt;
      return !next || new Date(next) <= now;
    }
  );
}
