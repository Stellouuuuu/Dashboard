import { db } from "../../database/db.js";
import { widgets } from "../../database/schema.js";
import { eq } from "drizzle-orm";
import { getRedis } from "../../database/client.js";
import { adapters } from "./adapters.registry.js";
import { CONSTANTS } from "../../config/constants.js";
import * as repo from "./dashboard.repository.js";

/** Liste toutes les instances de l'utilisateur (enrichies du widget) */
export async function getInstances(userId: number) {
  return repo.findInstancesByUser(userId);
}

/** Récupère l'instance d'un widget ou null si non autorisé */
export async function getInstance(id: number, userId: number) {
  return repo.findInstanceById(id, userId);
}

/** Ajoute un widget au dashboard */
export async function addWidget(
  userId: number,
  widgetId: number,
  config: Record<string, unknown>,
  refreshRate: number
) {
  // Vérifie que le widget existe
  const [widget] = await db.select().from(widgets).where(eq(widgets.id, widgetId));
  if (!widget) throw new Error("Widget introuvable");

  const rate = Math.max(refreshRate ?? CONSTANTS.REFRESH_RATE_DEFAULT, CONSTANTS.REFRESH_RATE_MIN);
  return repo.createInstance({ userId, widgetId, config, refreshRate: rate });
}

/** Reconfigure une instance existante */
export async function reconfigureWidget(
  id: number,
  userId: number,
  config: Record<string, unknown>,
  refreshRate?: number
) {
  const updated = await repo.updateInstance(id, userId, { config, ...(refreshRate ? { refreshRate } : {}) });
  if (!updated) throw new Error("Instance introuvable ou non autorisée");
  return updated;
}

/** Met à jour la position (drag & drop) */
export async function moveWidget(
  id: number,
  userId: number,
  positionX: number,
  positionY: number
) {
  const updated = await repo.updatePosition(id, userId, { positionX, positionY });
  if (!updated) throw new Error("Instance introuvable ou non autorisée");
  return updated;
}

/** Supprime une instance */
export async function removeWidget(id: number, userId: number) {
  const ok = await repo.deleteInstance(id, userId);
  if (!ok) throw new Error("Instance introuvable ou non autorisée");
}

/** Récupère les données d'un widget via son adaptateur (avec cache Redis) */
export async function fetchWidgetData(id: number, userId: number) {
  const instance = await repo.findInstanceById(id, userId);
  if (!instance) throw new Error("Instance introuvable ou non autorisée");

  // Récupère le slug du widget
  const [widget] = await db.select().from(widgets).where(eq(widgets.id, instance.widgetId));
  if (!widget) throw new Error("Widget introuvable");

  const cacheKey = `${CONSTANTS.REDIS_CACHE_PREFIX}${id}`;
  const redis = getRedis();

  // Tente le cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return { data: JSON.parse(cached), cached: true };
  }

  const adapter = adapters[widget.slug];
  if (!adapter) throw new Error(`Aucun adaptateur pour le widget "${widget.slug}"`);

  const data = await adapter(instance.config as Record<string, unknown>);

  // Met en cache avec TTL = refreshRate
  await redis.setex(cacheKey, instance.refreshRate, JSON.stringify(data));

  // Met à jour le statut
  await repo.updateRefreshStatus(id, "ok");

  return { data, cached: false };
}
