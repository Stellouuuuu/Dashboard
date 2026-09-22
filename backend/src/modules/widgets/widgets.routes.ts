import { Router } from "express";
import * as ctrl from "./widgets.controller.js";

const router = Router();

router.get("/", ctrl.listCatalog);
router.get("/:id", ctrl.getWidget);

export default router;