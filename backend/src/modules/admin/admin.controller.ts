import type { Request, Response } from "express";
import * as service from "./admin.service.js";

function sendError(res: Response, err: any) {
  res.status(err.status ?? 500).json({ error: err.message, code: err.code ?? "INTERNAL_ERROR" });
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
  const id = Number(req.params.id);
  if (req.userId === id && req.body.role === "user") {
    return res.status(400).json({
      error: "Tu ne peux pas te retirer tes propres droits admin",
      code: "ADMIN_SELF_ROLE_CHANGE_FORBIDDEN",
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
  const id = Number(req.params.id);
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
