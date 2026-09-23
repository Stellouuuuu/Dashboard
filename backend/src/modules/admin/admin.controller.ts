import type { Request, Response } from "express";
import * as service from "./admin.service.js";

/** GET /api/v1/admin/stats */
export async function getStats(_req: Request, res: Response) {
  try {
    const stats = await service.getStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
