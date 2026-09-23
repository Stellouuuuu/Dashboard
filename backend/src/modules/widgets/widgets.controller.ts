import type { Request, Response } from "express";
import * as service from "./widgets.service.js";

export async function listCatalog(_req: Request, res: Response) {
  try {
    const catalog = await service.getCatalog();
    res.json(catalog);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getWidget(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const widget = await service.getWidget(id);
    res.json(widget);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
}
