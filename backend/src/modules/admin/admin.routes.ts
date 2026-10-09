import { Router } from "express";
import * as ctrl from "./admin.controller.js";
import { requireAdmin } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { updateUserSchema } from "./admin.schemas.js";

const router = Router();

router.use(requireAdmin);

router.get("/stats", ctrl.getStats);
router.get("/audit-log", ctrl.getAuditLog);
router.get("/users", ctrl.listUsers);
router.patch("/users/:id", validate(updateUserSchema), ctrl.updateUser);
router.delete("/users/:id", ctrl.deleteUser);

export default router;
