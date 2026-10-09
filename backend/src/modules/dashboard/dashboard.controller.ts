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
