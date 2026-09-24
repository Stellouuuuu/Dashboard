import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";

type RequestPart = "body" | "query" | "params";

/** Valide req[part] avec un schéma Zod ; 400 avec le détail des erreurs si invalide. */
export function validate(schema: ZodType, part: RequestPart = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      return res
        .status(400)
        .json({ error: "Entrée invalide", code: "VALIDATION_ERROR", details: result.error.flatten() });
    }
    req[part] = result.data;
    next();
  };
}
