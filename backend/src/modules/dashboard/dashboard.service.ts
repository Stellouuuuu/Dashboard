import { getWidgetDefinition } from "../../widgets/registry.js";
import { CONSTANTS } from "../../config/constants.js";
import { httpError, HttpError } from "../../lib/httpError.js";
import { logAudit, AUDIT_ACTIONS } from "../../lib/audit.js";
import { extractMetric, describeWidgetForBrief } from "../../lib/metrics.js";
import { sendMail } from "../../lib/mailer.js";
import { alertEmailContent } from "../../lib/emailTemplates.js";
import { generateText } from "../../lib/gemini.js";
import { isGeminiConfigured } from "../../config/env.js";
import { findUserById } from "../auth/auth.repository.js";
import { isLinked } from "../auth/oauth-providers.service.js";
import { OAUTH_REQUIRED, type ServiceName } from "../services/services.service.js";
import * as repo from "./dashboard.repository.js";
import type { WidgetInstanceRow, WidgetHistoryRow, WidgetAlertRow } from "./dashboard.repository.js";

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
  position: number | undefined,
) {
  const widget = getWidgetDefinition(widgetName);
  if (!widget) throw httpError(404, "DASHBOARD_WIDGET_UNKNOWN", "Widget introuvable dans le registre");

  // Un widget d'un service OAuth (GitHub, Spotify, LinkedIn) ne peut être ajouté qu'avec le compte lié
  // (PLAN.md §5) — évite d'accepter un widget qui échouera systématiquement à chaque rafraîchissement.
  if (OAUTH_REQUIRED.has(widget.service as ServiceName) && !(await isLinked(userId, widget.service))) {
    throw httpError(400, "SERVICE_OAUTH_REQUIRED", `Lie ton compte ${widget.service} avant d'ajouter ce widget`);
  }

  const parsed = widget.schema.safeParse(rawConfig);
  if (!parsed.success) {
    throw httpError(400, "DASHBOARD_CONFIG_INVALID", "Configuration invalide: " + parsed.error.message);
  }

  const rate = Math.max(refreshRate ?? CONSTANTS.REFRESH_RATE_DEFAULT, CONSTANTS.REFRESH_RATE_MIN);
  // Sans position explicite, on ajoute en tête de grille (sinon tous les nouveaux widgets seraient à 0).
  const finalPosition = position ?? (await repo.nextPosition(userId));
  const instance = await repo.createInstance({
    userId,
    widgetName,
    config: parsed.data,
    refreshRate: rate,
    position: finalPosition,
  });
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

const ALERT_COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6h — évite un email à chaque refresh tant que le seuil reste franchi.

/** Envoie l'email d'alerte si le seuil est franchi et que le cooldown est passé (bonus). */
async function checkAlert(instance: WidgetInstanceRow, value: number): Promise<void> {
  const alert = await repo.getAlert(instance.id);
  if (!alert) return;

  const crossed = alert.operator === "above" ? value > alert.threshold : value < alert.threshold;
  if (!crossed) return;

  if (alert.lastNotifiedAt) {
    const sinceLast = Date.now() - new Date(alert.lastNotifiedAt).getTime();
    if (sinceLast < ALERT_COOLDOWN_MS) return;
  }

  const user = await findUserById(instance.userId);
  if (!user) return;

  const content = alertEmailContent(user.language, instance.widgetName, value, alert.operator as "above" | "below", alert.threshold);
  try {
    await sendMail(user.email, content.subject, content.html);
    await repo.markAlertNotified(instance.id);
  } catch {
    // Best-effort, comme logAudit : un envoi raté ne doit pas faire échouer le refresh du widget.
  }
}

export async function getWidgetHistory(id: number, userId: number): Promise<WidgetHistoryRow[]> {
  const instance = await repo.findInstanceById(id, userId);
  if (!instance) throw httpError(404, "DASHBOARD_INSTANCE_NOT_FOUND", "Instance introuvable ou non autorisée");
  return repo.getHistory(id);
}

export async function getWidgetAlert(id: number, userId: number): Promise<WidgetAlertRow | null> {
  const instance = await repo.findInstanceById(id, userId);
  if (!instance) throw httpError(404, "DASHBOARD_INSTANCE_NOT_FOUND", "Instance introuvable ou non autorisée");
  return repo.getAlert(id);
}

const ALERTABLE_WIDGETS = new Set(["city_temperature", "crypto_price", "exchange_rate", "precipitation_forecast"]);

export async function setWidgetAlert(
  id: number,
  userId: number,
  operator: "above" | "below",
  threshold: number,
): Promise<void> {
  const instance = await repo.findInstanceById(id, userId);
  if (!instance) throw httpError(404, "DASHBOARD_INSTANCE_NOT_FOUND", "Instance introuvable ou non autorisée");
  if (!ALERTABLE_WIDGETS.has(instance.widgetName)) {
    throw httpError(400, "DASHBOARD_ALERT_UNSUPPORTED", "Ce widget n'a pas de valeur numérique à surveiller");
  }
  await repo.setAlert(id, operator, threshold);
}

export async function clearWidgetAlert(id: number, userId: number): Promise<void> {
  const instance = await repo.findInstanceById(id, userId);
  if (!instance) throw httpError(404, "DASHBOARD_INSTANCE_NOT_FOUND", "Instance introuvable ou non autorisée");
  await repo.clearAlert(id);
}

/**
 * Brief quotidien généré par IA (bonus, voir docs/TECH_CHOICES.md) : agrège le
 * dernier payload en cache de chaque widget en un court résumé via Gemini.
 * Un seul appel LLM par utilisateur et par jour (table daily_briefs), pour rester
 * dans le tier gratuit même avec plusieurs ouvertures du dashboard dans la journée.
 */
export async function getDailyBrief(
  userId: number,
  force = false,
): Promise<{ text: string; generatedAt: Date; cached: boolean }> {
  if (!isGeminiConfigured) {
    throw httpError(503, "AI_BRIEF_NOT_CONFIGURED", "GEMINI_API_KEY n'est pas configurée");
  }

  const existing = force ? null : await repo.getTodayBrief(userId);
  if (existing) return { ...existing, cached: true };

  const instances = await repo.getInstancesWithCache(userId);
  const lines = instances
    .map((i) => describeWidgetForBrief(i.widgetName, i.payload))
    .filter((l): l is string => Boolean(l));

  if (!lines.length) {
    throw httpError(400, "AI_BRIEF_NO_DATA", "Pas encore assez de données widgets pour générer un brief");
  }

  const user = await findUserById(userId);
  const language = user?.language === "en" ? "English" : "French";
  const prompt =
    `You are writing a short, friendly daily briefing for a personal dashboard app, in ${language}. ` +
    `Summarize the following live data points into 2-4 natural sentences, highlighting anything notable ` +
    `(big price moves, bad weather, security alerts). No markdown, no bullet points, just prose.\n\n` +
    lines.join("\n");

  let text: string;
  try {
    text = await generateText(prompt);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Échec de génération du brief";
    throw httpError(502, "AI_BRIEF_FAILED", message);
  }
  await repo.saveTodayBrief(userId, text);
  return { text, generatedAt: new Date(), cached: false };
}

/**
 * Données d'un widget : sert le cache (table widget_cache) s'il a moins de
 * refresh_rate secondes, sinon appelle l'adapter du registre (PLAN.md §4.3).
 */
export async function fetchWidgetData(
  id: number,
  userId: number,
  force = false,
): Promise<DataResult> {
  const instance = await repo.findInstanceById(id, userId);
  if (!instance) throw httpError(404, "DASHBOARD_INSTANCE_NOT_FOUND", "Instance introuvable ou non autorisée");

  const widget = getWidgetDefinition(instance.widgetName);
  if (!widget) throw httpError(404, "DASHBOARD_ADAPTER_MISSING", "Aucun adaptateur pour ce widget");

  const cached = force ? null : await repo.getCachedPayload(id);
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

    // Historique + alerte (bonus, voir docs/TECH_CHOICES.md) : seulement pour les
    // widgets à valeur numérique (extractMetric renvoie null pour les widgets liste).
    const value = extractMetric(instance.widgetName, data);
    if (value != null) {
      void repo.recordHistoryPoint(id, value);
      void checkAlert(instance, value);
    }

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
    console.error(`[widget] fetch failed`, message);
    throw httpError(502, "DASHBOARD_FETCH_FAILED", message);
  }
}
