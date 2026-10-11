import type { Request, Response } from "express";
import * as service from "./admin.service.js";

function sendError(res: Response, err: any) {
  res.status(err.status ?? 500).json({ error: err.message, code: err.code ?? "INTERNAL_ERROR" });
}

/** Id de route valide (entier positif, plage integer Postgres) — sinon 400 plutôt qu'une 500. */
function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 && n <= 2_147_483_647 ? n : null;
}

/** GET /api/v1/admin/stats */
export async function getStats(_req: Request, res: Response) {
  try {
    const stats = await service.getStats();
    res.json(stats);
  } catch (err: any) {
    sendError(res, err);
  }
}

/** GET /api/v1/admin/users */
export async function listUsers(_req: Request, res: Response) {
  const rows = await service.listUsers();
  res.json(rows);
}

/** PATCH /api/v1/admin/users/:id — suspendre/réactiver, changer le rôle. */
export async function updateUser(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "id invalide", code: "VALIDATION_ERROR" });
  if (req.userId === id && req.body.role === "user") {
    return res.status(400).json({
      error: "Tu ne peux pas te retirer tes propres droits admin",
      code: "ADMIN_SELF_ROLE_CHANGE_FORBIDDEN",
    });
  }
  if (req.userId === id && req.body.suspended === true) {
    return res.status(400).json({
      error: "Tu ne peux pas suspendre ton propre compte",
      code: "ADMIN_SELF_SUSPEND_FORBIDDEN",
    });
  }
  try {
    const updated = await service.updateUser(req.userId!, id, req.body);
    res.json(updated);
  } catch (err: any) {
    sendError(res, err);
  }
}

/** DELETE /api/v1/admin/users/:id */
export async function deleteUser(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "id invalide", code: "VALIDATION_ERROR" });
  if (req.userId === id) {
    return res
      .status(400)
      .json({ error: "Tu ne peux pas supprimer ton propre compte", code: "ADMIN_SELF_DELETE_FORBIDDEN" });
  }
  try {
    await service.deleteUser(req.userId!, id);
    res.status(204).send();
  } catch (err: any) {
    sendError(res, err);
  }
}

/** GET /api/v1/admin/audit-log — journal d'activité réel (audit_logs), le plus récent d'abord. */
export async function getAuditLog(_req: Request, res: Response) {
  try {
    const rows = await service.listAuditLog();
    res.json(rows);
  } catch (err: any) {
    sendError(res, err);
  }
}
