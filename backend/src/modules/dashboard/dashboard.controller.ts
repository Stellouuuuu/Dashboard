import type { Request, Response } from "express";
import * as service from "./dashboard.service.js";

/** GET /api/v1/dashboard – liste les instances du user */
export async function listInstances(req: Request, res: Response) {
  try {
    const userId = (req as any).userId ?? 1;
    const instances = await service.getInstances(userId);
    res.json(instances);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/** POST /api/v1/dashboard/widgets – ajoute un widget */
export async function addWidget(req: Request, res: Response) {
  try {
    const userId = (req as any).userId ?? 1;
    const { widgetId, config, refreshRate } = req.body;
    if (!widgetId || !config) {
      return res.status(400).json({ error: "widgetId et config sont requis" });
    }
    const instance = await service.addWidget(userId, widgetId, config, refreshRate ?? 60);
    res.status(201).json(instance);
  } catch (err: any) {
    const status = err.message.includes("introuvable") ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
}

/** PUT /api/v1/dashboard/widgets/:id – reconfigure une instance */
export async function reconfigureWidget(req: Request, res: Response) {
  try {
    const userId = (req as any).userId ?? 1;
    const id = Number(req.params.id);
    const { config, refreshRate } = req.body;
    if (!config) return res.status(400).json({ error: "config est requise" });
    const updated = await service.reconfigureWidget(id, userId, config, refreshRate);
    res.json(updated);
  } catch (err: any) {
    const status = err.message.includes("introuvable") ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
}

/** PATCH /api/v1/dashboard/widgets/:id/position – déplace une instance */
export async function moveWidget(req: Request, res: Response) {
  try {
    const userId = (req as any).userId ?? 1;
    const id = Number(req.params.id);
    const { positionX, positionY } = req.body;
    if (positionX === undefined || positionY === undefined) {
      return res.status(400).json({ error: "positionX et positionY sont requis" });
    }
    const updated = await service.moveWidget(id, userId, Number(positionX), Number(positionY));
    res.json(updated);
  } catch (err: any) {
    const status = err.message.includes("introuvable") ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
}

/** DELETE /api/v1/dashboard/widgets/:id – supprime une instance */
export async function deleteWidget(req: Request, res: Response) {
  try {
    const userId = (req as any).userId ?? 1;
    const id = Number(req.params.id);
    await service.removeWidget(id, userId);
    res.status(204).send();
  } catch (err: any) {
    const status = err.message.includes("introuvable") ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
}

/** GET /api/v1/dashboard/widgets/:id/data – données fraîches via adaptateur */
export async function getWidgetData(req: Request, res: Response) {
  try {
    const userId = (req as any).userId ?? 1;
    const id = Number(req.params.id);
    const result = await service.fetchWidgetData(id, userId);
    res.json(result);
  } catch (err: any) {
    const status =
      err.message.includes("introuvable") ? 404 :
      err.message.includes("adaptateur") ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
}
