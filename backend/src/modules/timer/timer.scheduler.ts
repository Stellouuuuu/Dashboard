import { db } from "../../database/db.js";
import { widgetInstances, widgets } from "../../database/schema.js";
import { eq } from "drizzle-orm";
import { scheduleRefresh } from "./timer.service.js";

/**
 * Scheduler du Timer – Membre B
 * Au démarrage, planifie un refresh pour toutes les instances existantes.
 * Chaque instance communique son refresh_rate au Timer.
 */
export async function initScheduler(): Promise<void> {
  console.log("[scheduler] Initialisation des jobs de refresh…");

  const instances = await db
    .select({
      id: widgetInstances.id,
      refreshRate: widgetInstances.refreshRate,
      slug: widgets.slug,
    })
    .from(widgetInstances)
    .innerJoin(widgets, eq(widgetInstances.widgetId, widgets.id));

  for (const instance of instances) {
    await scheduleRefresh(instance.id, instance.refreshRate);
  }

  console.log(`[scheduler] ✅ ${instances.length} instance(s) planifiée(s)`);
}
