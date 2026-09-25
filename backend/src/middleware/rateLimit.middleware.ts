import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";

function rateLimitHandler(_req: Request, res: Response) {
  res.status(429).json({ error: "Trop de requêtes, réessaie plus tard.", code: "RATE_LIMITED" });
}

// PLAN.md §11 : 100 req/min par IP globalement, 10 req/min sur l'auth.
export const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const authLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});
