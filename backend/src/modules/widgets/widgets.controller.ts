import type { Request, Response } from "express";
import * as service from "./widgets.service.js";
import { searchCities, reverseGeocodeCity } from "../../adapters/weather.adapter.js";

export function listCatalog(_req: Request, res: Response) {
  res.json(service.getCatalog());
}

export function getWidget(req: Request, res: Response) {
  try {
    res.json(service.getWidget(req.params.name));
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
}

/** GET /api/v1/widgets/weather/cities?q=par — autocomplétion du champ ville. */
export async function searchWeatherCities(req: Request, res: Response) {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  try {
    res.json(await searchCities(q));
  } catch {
    res.json([]);
  }
}

/** GET /api/v1/widgets/weather/here?lat=&lon= — géolocalisation → nom de ville. */
export async function reverseGeocodeWeatherCity(req: Request, res: Response) {
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return res.status(400).json({ error: "Coordonnées invalides", code: "VALIDATION_ERROR" });
  }
  try {
    res.json({ city: await reverseGeocodeCity(lat, lon) });
  } catch (err: any) {
    res.status(502).json({ error: err.message ?? "Localisation impossible", code: "WEATHER_LOOKUP_FAILED" });
  }
}
