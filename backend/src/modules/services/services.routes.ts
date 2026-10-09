import { Router } from "express";
import * as ctrl from "./services.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/", ctrl.listServices);
router.post("/:name/subscribe", ctrl.subscribe);
router.delete("/:name/subscribe", ctrl.unsubscribe);

export default router;
