import { Router } from "express";
import { getAbout } from "./about.controller.js";

const router = Router();

router.get("/", getAbout);

export default router;
