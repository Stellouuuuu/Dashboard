import type { Request, Response } from "express";
import * as service from "./widgets.service.js";

export function listCatalog(_req: Request, res: Response) {
  res.json(service.getCatalog());
}

export function getWidget(req: Request, res: Response) {
  try {
    res.json(service.getWidget(req.params.name));
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
}
