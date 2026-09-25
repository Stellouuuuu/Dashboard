import { z } from "zod";

// Politique de mot de passe PLAN.md §11 : 12 caractères minimum.
export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Nom requis").max(80),
    email: z.string().email(),
    password: z.string().min(12, "12 caractères minimum"),
    confirmPassword: z.string().min(1, "Confirmation requise"),
    language: z.enum(["fr", "en"]).optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const otpCode = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Code à 6 chiffres requis");

export const confirmSchema = z.object({
  email: z.string().email(),
  code: otpCode,
});

export const resendConfirmSchema = z.object({
  email: z.string().email(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: otpCode,
  newPassword: z.string().min(12, "12 caractères minimum"),
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
