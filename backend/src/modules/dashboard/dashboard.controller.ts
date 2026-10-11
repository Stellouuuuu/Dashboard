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
