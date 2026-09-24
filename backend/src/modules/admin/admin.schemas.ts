import { z } from "zod";

export const updateUserSchema = z
  .object({
    suspended: z.boolean().optional(),
    role: z.enum(["user", "admin"]).optional(),
  })
  .refine((v) => v.suspended !== undefined || v.role !== undefined, {
    message: "Au moins un champ (suspended ou role) est requis",
  });
