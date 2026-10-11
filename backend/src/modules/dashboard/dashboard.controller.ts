import type { Request, Response } from "express";
import * as service from "./dashboard.service.js";

function sendError(res: Response, err: any) {
  res.status(err.status ?? 500).json({ error: err.message, code: err.code ?? "INTERNAL_ERROR" });
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
  if (!widgetName || !config) {
    return res
      .status(400)
      .json({ error: "widgetName et config sont requis", code: "VALIDATION_ERROR" });
  }
  try {
    const instance = await service.addWidget(userId, widgetName, config, refreshRate, position ?? 0);
    res.status(201).json(instance);
  } catch (err: any) {
    sendError(res, err);
  }
}

/** PATCH /api/v1/dashboard/widgets/:id — reconfigure une instance */
export async function reconfigureWidget(req: Request, res: Response) {
  const userId = req.userId!;
  const id = Number(req.params.id);
  const { config, refreshRate } = req.body ?? {};
  if (!config) return res.status(400).json({ error: "config est requise", code: "VALIDATION_ERROR" });
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
  const id = Number(req.params.id);
  const { position } = req.body ?? {};
  if (position === undefined)
    return res.status(400).json({ error: "position est requise", code: "VALIDATION_ERROR" });
  try {
    const updated = await service.moveWidget(id, userId, Number(position));
    res.json(updated);
  } catch (err: any) {
    sendError(res, err);
  }
}

/** DELETE /api/v1/dashboard/widgets/:id — supprime une instance */
export async function deleteWidget(req: Request, res: Response) {
  const userId = req.userId!;
  const id = Number(req.params.id);
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
  const id = Number(req.params.id);
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
