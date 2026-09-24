import type { Request, Response, NextFunction } from "express";
import { ERROR_CODES } from "../lib/httpError.js";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Route introuvable", code: "NOT_FOUND" });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  const status = err?.status ?? 500;
  const code = err?.code ?? ERROR_CODES.INTERNAL_ERROR;
  res.status(status).json({ error: err?.message ?? "Erreur interne", code });
}
