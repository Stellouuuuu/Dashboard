import { getWidgetQueue } from "../../jobs/queue.js";

/**
 * Service Timer – Membre B
 * Planifie les jobs de refresh des instances de widgets.
 */

/** Planifie un refresh immédiat puis répété pour une instance */
export async function scheduleRefresh(instanceId: number, refreshRate: number): Promise<void> {
  const queue = getWidgetQueue();
  const jobId = `refresh-${instanceId}`;

  // Supprime l'ancien job s'il existe
  const existing = await queue.getJob(jobId);
  if (existing) {
    await existing.remove();
  }

  // Ajoute un job répété avec l'intervalle voulu
  await queue.add(
    "refresh-widget",
    { instanceId },
    {
      jobId,
      repeat: { every: refreshRate * 1000 },
    } as any
  );

  console.log(`[timer] ⏱ Refresh planifié pour instance ${instanceId} toutes les ${refreshRate}s`);
}

/** Supprime le job répété d'une instance (à la suppression du widget) */
export async function cancelRefresh(instanceId: number): Promise<void> {
  const queue = getWidgetQueue();
  const jobId = `refresh-${instanceId}`;
  const job = await queue.getJob(jobId);
  if (job) {
    await job.remove();
    console.log(`[timer] ❌ Refresh annulé pour instance ${instanceId}`);
  }
}
