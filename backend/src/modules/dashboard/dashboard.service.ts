import { getWidgetDefinition } from "../../widgets/registry.js";
import { CONSTANTS } from "../../config/constants.js";
import { httpError, HttpError } from "../../lib/httpError.js";
import { logAudit, AUDIT_ACTIONS } from "../../lib/audit.js";
import { isLinked as isGithubLinked } from "../auth/github-oauth.service.js";
import * as repo from "./dashboard.repository.js";
import type { WidgetInstanceRow } from "./dashboard.repository.js";

interface EnrichedInstance extends WidgetInstanceRow {
  widget: { service: string; description: string; params: unknown } | null;
}

interface DataResult {
  data: unknown;
  cached: boolean;
  lastRefreshedAt: Date;
}

function enrich(instance: WidgetInstanceRow): EnrichedInstance {
  const widget = getWidgetDefinition(instance.widgetName);
  return {
    ...instance,
    widget: widget
      ? { service: widget.service, description: widget.description, params: widget.params }
      : null,
  };
}

export async function getInstances(userId: number): Promise<EnrichedInstance[]> {
  const rows = await repo.findInstancesByUser(userId);
  return rows.map(enrich);
}

export async function getInstance(id: number, userId: number): Promise<EnrichedInstance | null> {
  const row = await repo.findInstanceById(id, userId);
  return row ? enrich(row) : null;
}

/** Ajoute un widget : valide la config contre le schéma du registre (PLAN.md §4.2). */
export async function addWidget(
  userId: number,
  widgetName: string,
  rawConfig: unknown,
  refreshRate: number | undefined,
  position: number,
) {
  const widget = getWidgetDefinition(widgetName);
  if (!widget) throw httpError(404, "DASHBOARD_WIDGET_UNKNOWN", "Widget introuvable dans le registre");

  // Un widget GitHub ne peut être ajouté qu'avec le compte GitHub lié (PLAN.md §5) —
  // évite d'accepter un widget qui échouera systématiquement à chaque rafraîchissement.
  if (widget.service === "github" && !(await isGithubLinked(userId))) {
    throw httpError(400, "SERVICE_OAUTH_REQUIRED", "Lie ton compte GitHub avant d'ajouter ce widget");
  }

  const parsed = widget.schema.safeParse(rawConfig);
  if (!parsed.success) {
    throw httpError(400, "DASHBOARD_CONFIG_INVALID", "Configuration invalide: " + parsed.error.message);
  }

  const rate = Math.max(refreshRate ?? CONSTANTS.REFRESH_RATE_DEFAULT, CONSTANTS.REFRESH_RATE_MIN);
  const instance = await repo.createInstance({ userId, widgetName, config: parsed.data, refreshRate: rate, position });
  void logAudit(userId, AUDIT_ACTIONS.WIDGET_ADDED, { widgetName });
  return instance;
}

export async function reconfigureWidget(
  id: number,
  userId: number,
  rawConfig: unknown,
  refreshRate: number | undefined,
) {
  const existing = await repo.findInstanceById(id, userId);
  if (!existing) throw httpError(404, "DASHBOARD_INSTANCE_NOT_FOUND", "Instance introuvable ou non autorisée");

  const widget = getWidgetDefinition(existing.widgetName);
  if (!widget) throw httpError(404, "DASHBOARD_WIDGET_UNKNOWN", "Widget introuvable dans le registre");

  const parsed = widget.schema.safeParse(rawConfig);
  if (!parsed.success) {
    throw httpError(400, "DASHBOARD_CONFIG_INVALID", "Configuration invalide: " + parsed.error.message);
  }

  const updated = await repo.updateInstance(id, userId, {
    config: parsed.data,
    ...(refreshRate ? { refreshRate: Math.max(refreshRate, CONSTANTS.REFRESH_RATE_MIN) } : {}),
  });
  if (!updated) throw httpError(404, "DASHBOARD_INSTANCE_NOT_FOUND", "Instance introuvable ou non autorisée");
  return updated;
}

export async function moveWidget(id: number, userId: number, position: number) {
  const updated = await repo.updatePosition(id, userId, position);
  if (!updated) throw httpError(404, "DASHBOARD_INSTANCE_NOT_FOUND", "Instance introuvable ou non autorisée");
  return updated;
}

export async function removeWidget(id: number, userId: number): Promise<void> {
  const existing = await repo.findInstanceById(id, userId);
  const ok = await repo.deleteInstance(id, userId);
  if (!ok) throw httpError(404, "DASHBOARD_INSTANCE_NOT_FOUND", "Instance introuvable ou non autorisée");
  void logAudit(userId, AUDIT_ACTIONS.WIDGET_REMOVED, { widgetName: existing?.widgetName });
}

/**
 * Données d'un widget : sert le cache (table widget_cache) s'il a moins de
 * refresh_rate secondes, sinon appelle l'adapter du registre (PLAN.md §4.3).
 */
export async function fetchWidgetData(id: number, userId: number): Promise<DataResult> {
  const instance = await repo.findInstanceById(id, userId);
  if (!instance) throw httpError(404, "DASHBOARD_INSTANCE_NOT_FOUND", "Instance introuvable ou non autorisée");

  const widget = getWidgetDefinition(instance.widgetName);
  if (!widget) throw httpError(404, "DASHBOARD_ADAPTER_MISSING", "Aucun adaptateur pour ce widget");

  const cached = await repo.getCachedPayload(id);
  if (cached) {
    const ageSec = (Date.now() - new Date(cached.fetchedAt).getTime()) / 1000;
    if (ageSec < instance.refreshRate) {
      return { data: cached.payload, cached: true, lastRefreshedAt: cached.fetchedAt };
    }
  }

  try {
    const data = await widget.fetch(instance.config, { userId });
    await repo.upsertCachedPayload(id, data);
    await repo.updateRefreshStatus(id, "ok");
    return { data, cached: false, lastRefreshedAt: new Date() };
  } catch (err) {
    await repo.updateRefreshStatus(id, "error");
    // Un adaptateur peut lever une HttpError explicite (ex: compte GitHub requis) —
    // on garde alors son code stable tel quel pour que le front l'affiche correctement.
    if (err instanceof HttpError) throw err;
    // Sinon, erreur externe générique (API météo/GitHub/RSS/Finance/HN) : message
    // d'origine gardé pour les logs, mais code stable générique — le détail exact
    // varie trop pour être traduit un par un côté front.
    const message = err instanceof Error ? err.message : "Échec de récupération des données";
    throw httpError(502, "DASHBOARD_FETCH_FAILED", message);
  }
}
