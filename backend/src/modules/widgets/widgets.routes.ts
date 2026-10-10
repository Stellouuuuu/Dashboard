import { Router } from "express";
import * as ctrl from "./widgets.controller.js";

const router = Router();

router.get("/", ctrl.listCatalog);
// Avant /:name pour ne pas être capturé comme un nom de widget.
router.get("/weather/cities", ctrl.searchWeatherCities);
router.get("/weather/here", ctrl.reverseGeocodeWeatherCity);
router.get("/:name", ctrl.getWidget);

export default router;
