import { Router } from "express";
import * as ctrl from "./auth.controller.js";
import { validate } from "../../middleware/validate.middleware.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { authLimiter } from "../../middleware/rateLimit.middleware.js";
import {
  registerSchema,
  loginSchema,
  confirmSchema,
  resendConfirmSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  deleteAccountSchema,
  setLanguageSchema,
  updateProfileSchema,
} from "./auth.schemas.js";

const router = Router();

// PLAN.md §11 : 10 req/min sur l'auth (en plus du rate-limit global 100 req/min).
router.post("/register", authLimiter, validate(registerSchema), ctrl.register);
router.post("/confirm", authLimiter, validate(confirmSchema), ctrl.confirm);
router.post("/resend-confirm", authLimiter, validate(resendConfirmSchema), ctrl.resendConfirm);
router.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), ctrl.forgotPassword);
router.post("/reset-password", authLimiter, validate(resetPasswordSchema), ctrl.resetPassword);
router.post("/login", authLimiter, validate(loginSchema), ctrl.login);
router.post("/refresh", authLimiter, ctrl.refresh);
router.post("/logout", ctrl.logout);
router.get("/me", requireAuth, ctrl.me);
router.post("/change-password", requireAuth, validate(changePasswordSchema), ctrl.changePassword);
router.patch("/language", requireAuth, validate(setLanguageSchema), ctrl.setLanguage);
router.patch("/profile", requireAuth, validate(updateProfileSchema), ctrl.updateProfile);
router.delete("/me", requireAuth, validate(deleteAccountSchema), ctrl.deleteAccount);

router.get("/oauth/github", requireAuth, ctrl.oauthGithubStart);
router.get("/oauth/github/callback", ctrl.oauthGithubCallback);
router.delete("/oauth/github", requireAuth, ctrl.oauthGithubUnlink);

// Pas de requireAuth sur /oauth/google : sert à la fois la connexion/inscription
// (utilisateur pas encore authentifié) et la liaison depuis Services (authentifié) —
// le contrôleur détecte lui-même lequel des deux cas s'applique.
router.get("/oauth/google", ctrl.oauthGoogleStart);
router.get("/oauth/google/callback", ctrl.oauthGoogleCallback);
router.delete("/oauth/google", requireAuth, ctrl.oauthGoogleUnlink);

export default router;
