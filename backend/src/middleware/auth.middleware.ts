import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

// Étend Express.Request pour porter l'identité résolue par requireAuth/requireAdmin,
// et par le middleware temporaire de dashboard.routes.ts en attendant l'auth réelle.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: number;
      userRole?: string;
    }
  }
}

interface AccessTokenPayload {
  sub: number;
  role: string;
}

/**
 * Vérifie le JWT d'accès (cookie `access_token`). L'émission réelle du token
 * (login, refresh) est la tâche du 24/09 — Membre A. Les routes qui n'ont pas
 * encore de flux d'auth réel utilisent un middleware temporaire (voir dashboard.routes.ts).
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.access_token;
  if (!token) return res.status(401).json({ error: "Authentification requise", code: "AUTH_UNAUTHENTICATED" });
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as unknown as AccessTokenPayload;
    req.userId = payload.sub;
    req.userRole = payload.role;
    next();
  } catch {
    return res.status(401).json({ error: "Token invalide ou expiré", code: "AUTH_TOKEN_INVALID" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Réservé aux administrateurs", code: "AUTH_FORBIDDEN" });
    }
    next();
  });
}
