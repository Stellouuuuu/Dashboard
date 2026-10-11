import { Router } from "express";
import * as ctrl from "./dashboard.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/", ctrl.listInstances);
router.post("/widgets", ctrl.addWidget);
router.patch("/widgets/:id", ctrl.reconfigureWidget);
router.patch("/widgets/:id/position", ctrl.moveWidget);
router.get("/widgets/:id/data", ctrl.getWidgetData);
router.delete("/widgets/:id", ctrl.deleteWidget);

// Historique (sparkline) + alerte de seuil — bonus, voir docs/TECH_CHOICES.md.
router.get("/widgets/:id/history", ctrl.getWidgetHistory);
router.get("/widgets/:id/alert", ctrl.getWidgetAlert);
router.put("/widgets/:id/alert", ctrl.setWidgetAlert);
router.delete("/widgets/:id/alert", ctrl.clearWidgetAlert);

router.get("/brief", ctrl.getDailyBrief);

export default router;
