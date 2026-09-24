import { z } from "zod";

// Politique de mot de passe PLAN.md §11 : 12 caractères minimum.
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12, "12 caractères minimum"),
  language: z.enum(["fr", "en"]).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const confirmSchema = z.object({
  token: z.string().min(1),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(12, "12 caractères minimum"),
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1),
});

export const setLanguageSchema = z.object({
  language: z.enum(["fr", "en"]),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(80),
});
