import type { Request, Response } from "express";
import * as service from "./services.service.js";

function sendError(res: Response, err: any) {
  res.status(err.status ?? 500).json({ error: err.message, code: err.code ?? "INTERNAL_ERROR" });
}

export async function listServices(req: Request, res: Response) {
  const services = await service.listServices(req.userId!);
  res.json(services);
}

export async function subscribe(req: Request, res: Response) {
  try {
    await service.subscribe(req.userId!, req.params.name);
    res.status(204).send();
  } catch (err: any) {
    sendError(res, err);
  }
}

export async function unsubscribe(req: Request, res: Response) {
  try {
    await service.unsubscribe(req.userId!, req.params.name);
    res.status(204).send();
  } catch (err: any) {
    sendError(res, err);
  }
}
