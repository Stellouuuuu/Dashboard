import { Router } from "express";
import * as ctrl from "./admin.controller.js";

const router = Router();

router.get("/stats", ctrl.getStats);

export default router;
