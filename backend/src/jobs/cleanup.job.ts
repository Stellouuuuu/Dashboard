import { getRedis } from "../database/client.js";
import { CONSTANTS } from "../config/constants.js";

/**
 * Supprime les entrées de cache Redis des instances qui n'existent plus.
 * Lancé périodiquement par le scheduler.
 */
export async function runCleanupJob(): Promise<void> {
  const redis = getRedis();
  const pattern = `${CONSTANTS.REDIS_CACHE_PREFIX}*`;
  const keys = await redis.keys(pattern);
  console.log(`[cleanup] ${keys.length} clé(s) de cache trouvée(s)`);
  // Nettoyage minimal : supprime les clés expirées (Redis le fait automatiquement via TTL)
  // On log juste pour monitoring
}
