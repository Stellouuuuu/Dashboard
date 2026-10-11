import type { Request, Response } from "express";
import * as service from "./dashboard.service.js";

function sendError(res: Response, err: any) {
  res.status(err.status ?? 500).json({ error: err.message, code: err.code ?? "INTERNAL_ERROR" });
}

const badRequest = (res: Response, error: string) =>
  res.status(400).json({ error, code: "VALIDATION_ERROR" });

/** Id de route valide : entier positif dans la plage d'un integer Postgres (sinon 500 « invalid input syntax »). */
function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 && n <= 2_147_483_647 ? n : null;
}

/** GET /api/v1/dashboard — liste les instances du user */
export async function listInstances(req: Request, res: Response) {
  const userId = req.userId!;
  const instances = await service.getInstances(userId);
  res.json(instances);
}

/** POST /api/v1/dashboard/widgets — ajoute un widget */
export async function addWidget(req: Request, res: Response) {
  const userId = req.userId!;
  const { widgetName, config, refreshRate, position } = req.body ?? {};
  if (!widgetName || typeof widgetName !== "string" || !config || typeof config !== "object") {
    return badRequest(res, "widgetName et config sont requis");
  }
  if (refreshRate !== undefined && (!Number.isFinite(refreshRate) || refreshRate <= 0)) {
    return badRequest(res, "refreshRate doit être un nombre positif");
  }
  if (position !== undefined && (!Number.isInteger(position) || position < 0 || position > 2_147_483_647)) {
    return badRequest(res, "position doit être un entier positif ou nul");
  }
  try {
    const instance = await service.addWidget(userId, widgetName, config, refreshRate, position);
    res.status(201).json(instance);
  } catch (err: any) {
    sendError(res, err);
  }
}

/** PATCH /api/v1/dashboard/widgets/:id — reconfigure une instance */
export async function reconfigureWidget(req: Request, res: Response) {
  const userId = req.userId!;
  const id = parseId(req.params.id);
  const { config, refreshRate } = req.body ?? {};
  if (id === null) return badRequest(res, "id invalide");
  if (!config || typeof config !== "object") return badRequest(res, "config est requise");
  if (refreshRate !== undefined && (!Number.isFinite(refreshRate) || refreshRate <= 0)) {
    return badRequest(res, "refreshRate doit être un nombre positif");
  }
  try {
    const updated = await service.reconfigureWidget(id, userId, config, refreshRate);
    res.json(updated);
  } catch (err: any) {
    sendError(res, err);
  }
}

/** PATCH /api/v1/dashboard/widgets/:id/position — déplace une instance */
export async function moveWidget(req: Request, res: Response) {
  const userId = req.userId!;
  const id = parseId(req.params.id);
  const { position } = req.body ?? {};
  if (id === null) return badRequest(res, "id invalide");
  if (!Number.isInteger(position) || position < 0 || position > 2_147_483_647)
    return badRequest(res, "position doit être un entier positif ou nul");
  try {
    const updated = await service.moveWidget(id, userId, position);
    res.json(updated);
  } catch (err: any) {
    sendError(res, err);
  }
}

/** DELETE /api/v1/dashboard/widgets/:id — supprime une instance */
export async function deleteWidget(req: Request, res: Response) {
  const userId = req.userId!;
  const id = parseId(req.params.id);
  if (id === null) return badRequest(res, "id invalide");
  try {
    await service.removeWidget(id, userId);
    res.status(204).send();
  } catch (err: any) {
    sendError(res, err);
  }
}

/**
 * GET /api/v1/dashboard/widgets/:id/data — données (cache ou adaptateur).
 * ?force=true ignore le cache (bouton "Rafraîchir" manuel) ; le Timer
 * automatique n'envoie pas ce paramètre et respecte refresh_rate.
 */
export async function getWidgetData(req: Request, res: Response) {
  const userId = req.userId!;
  const id = parseId(req.params.id);
  if (id === null) return badRequest(res, "id invalide");
  const force = req.query.force === "true";
  try {
    const result = await service.fetchWidgetData(id, userId, force);
    res.json(result);
  } catch (err: any) {
    sendError(res, err);
  }
}

/** GET /api/v1/dashboard/widgets/:id/history — points d'historique pour la sparkline (bonus). */
export async function getWidgetHistory(req: Request, res: Response) {
  const userId = req.userId!;
  const id = Number(req.params.id);
  try {
    const history = await service.getWidgetHistory(id, userId);
    res.json(history.map((h) => ({ value: h.value, recordedAt: h.recordedAt })));
  } catch (err: any) {
    sendError(res, err);
  }
}

/** GET /api/v1/dashboard/widgets/:id/alert — seuil actuel, s'il existe (bonus). */
export async function getWidgetAlert(req: Request, res: Response) {
  const userId = req.userId!;
  const id = Number(req.params.id);
  try {
    const alert = await service.getWidgetAlert(id, userId);
    res.json(alert ? { operator: alert.operator, threshold: alert.threshold } : null);
  } catch (err: any) {
    sendError(res, err);
  }
}

/** PUT /api/v1/dashboard/widgets/:id/alert — définit le seuil d'alerte (bonus). */
export async function setWidgetAlert(req: Request, res: Response) {
  const userId = req.userId!;
  const id = Number(req.params.id);
  const { operator, threshold } = req.body ?? {};
  if ((operator !== "above" && operator !== "below") || typeof threshold !== "number") {
    return res
      .status(400)
      .json({ error: "operator ('above'|'below') et threshold (nombre) sont requis", code: "VALIDATION_ERROR" });
  }
  try {
    await service.setWidgetAlert(id, userId, operator, threshold);
    res.status(204).send();
  } catch (err: any) {
    sendError(res, err);
  }
}

export async function clearWidgetAlert(req: Request, res: Response) {
  const userId = req.userId!;
  const id = Number(req.params.id);
  try {
    await service.clearWidgetAlert(id, userId);
    res.status(204).send();
  } catch (err: any) {
    sendError(res, err);
  }
}

/** GET /api/v1/dashboard/brief — résumé quotidien généré par IA (bonus). ?force=true régénère. */
export async function getDailyBrief(req: Request, res: Response) {
  const userId = req.userId!;
  const force = req.query.force === "true";
  try {
    const brief = await service.getDailyBrief(userId, force);
    res.json(brief);
  } catch (err: any) {
    sendError(res, err);
  }
}
