import { db } from "../../database/db.js";
import { widgetInstances, widgets } from "../../database/schema.js";
import { sql, count, eq } from "drizzle-orm";

/**
 * Admin Stats Service – Membre B
 * Fournit les statistiques globales pour la page admin.
 */
export async function getStats() {
  // Nb total d'instances de widgets actives
  const widgetsCountRes = await db
    .select({ total: count() })
    .from(widgetInstances);
  const totalWidgets = widgetsCountRes[0]?.total ?? 0;

  // Nb d'utilisateurs distincts qui ont au moins un widget
  const usersCountRes = await db
    .select({ total: sql<number>`count(distinct ${widgetInstances.userId})` })
    .from(widgetInstances);
  const activeUsers = usersCountRes[0]?.total ?? 0;

  // Distribution par widget (les plus utilisés)
  const byWidget = await db
    .select({
      widgetName: widgets.name,
      widgetSlug: widgets.slug,
      count: count(),
    })
    .from(widgetInstances)
    .innerJoin(widgets, eq(widgetInstances.widgetId, widgets.id))
    .groupBy(widgets.id, widgets.name, widgets.slug)
    .orderBy(sql`count(*) desc`)
    .limit(10);

  // Distribution par status
  const byStatus = await db
    .select({
      status: widgetInstances.status,
      count: count(),
    })
    .from(widgetInstances)
    .groupBy(widgetInstances.status);

  return {
    totalWidgets: Number(totalWidgets),
    activeUsers: Number(activeUsers),
    byWidget,
    byStatus,
  };
}
