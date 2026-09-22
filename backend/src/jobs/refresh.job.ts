import { adapters } from "../modules/dashboard/adapters.registry.js";
import { getRedis } from "../database/client.js";
import { db } from "../database/db.js";
import { widgetInstances, widgets } from "../database/schema.js";
import { eq } from "drizzle-orm";
import { CONSTANTS } from "../config/constants.js";

/**
 * Exécute le refresh d'une instance de widget :
 * 1. Récupère les données via l'adaptateur
 * 2. Met en cache dans Redis
 * 3. Met à jour le status et les timestamps en base
 */
export async function runRefreshJob(instanceId: number): Promise<void> {
  const [instance] = await db
    .select({
      id: widgetInstances.id,
      config: widgetInstances.config,
      refreshRate: widgetInstances.refreshRate,
      slug: widgets.slug,
    })
    .from(widgetInstances)
    .innerJoin(widgets, eq(widgetInstances.widgetId, widgets.id))
    .where(eq(widgetInstances.id, instanceId));

  if (!instance) {
    console.warn(`[refresh] Instance ${instanceId} introuvable`);
    return;
  }

  const adapter = adapters[instance.slug];
  if (!adapter) {
    console.warn(`[refresh] Pas d'adaptateur pour "${instance.slug}"`);
    return;
  }

  try {
    const data = await adapter(instance.config as Record<string, unknown>);

    // Cache Redis
    const redis = getRedis();
    const cacheKey = `${CONSTANTS.REDIS_CACHE_PREFIX}${instanceId}`;
    await redis.setex(cacheKey, instance.refreshRate, JSON.stringify(data));

    // Mise à jour status + timestamps
    const now = new Date();
    const nextRefresh = new Date(now.getTime() + instance.refreshRate * 1000);
    await db
      .update(widgetInstances)
      .set({ status: "ok", lastRefreshedAt: now, nextRefreshAt: nextRefresh })
      .where(eq(widgetInstances.id, instanceId));

    console.log(`[refresh] ✅ Instance ${instanceId} (${instance.slug}) rafraîchie`);
  } catch (err: any) {
    // Marque l'instance en erreur
    await db
      .update(widgetInstances)
      .set({ status: "error" })
      .where(eq(widgetInstances.id, instanceId));
    console.error(`[refresh] ❌ Instance ${instanceId} (${instance.slug}) erreur:`, err.message);
    throw err;
  }
}
