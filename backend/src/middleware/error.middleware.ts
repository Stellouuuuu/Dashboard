import type { Request, Response, NextFunction } from "express";
import { ERROR_CODES, HttpError } from "../lib/httpError.js";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Route introuvable", code: "NOT_FOUND" });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  // JSON malformé / corps trop gros : erreur client, pas une 500.
  if (err?.type === "entity.parse.failed" || err?.type === "entity.too.large") {
    return res.status(err.status ?? 400).json({ error: "Corps de requête invalide", code: ERROR_CODES.VALIDATION_ERROR });
  }
  // Seules les HttpError portent un code applicatif : le reste (ex: erreurs Postgres) ne doit pas fuiter.
  if (!(err instanceof HttpError)) {
    return res.status(500).json({ error: "Erreur interne", code: ERROR_CODES.INTERNAL_ERROR });
  }
  res.status(err.status).json({ error: err.message, code: err.code });
}
