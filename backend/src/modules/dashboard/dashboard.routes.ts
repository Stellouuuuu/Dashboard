import { Router } from "express";
import * as ctrl from "./dashboard.controller.js";

const router = Router();

// Middleware temporaire userId=1 (sera remplacé par authMiddleware du Membre A)
router.use((req, _res, next) => {
  (req as any).userId = 1;
  next();
});

// Liste les instances du dashboard
router.get("/", ctrl.listInstances);

// Ajoute un widget au dashboard
router.post("/widgets", ctrl.addWidget);

// Reconfigure une instance existante
router.put("/widgets/:id", ctrl.reconfigureWidget);

// Déplace une instance (drag & drop)
router.patch("/widgets/:id/position", ctrl.moveWidget);

// Récupère les données fraîches d'un widget
router.get("/widgets/:id/data", ctrl.getWidgetData);

// Supprime une instance
router.delete("/widgets/:id", ctrl.deleteWidget);

export default router;