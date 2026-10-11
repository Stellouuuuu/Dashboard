import express from "express";
import cors from "cors";
import { z } from "zod";

/**
 * Subject's "proof of concept" deliverable: a single configurable widget,
 * on the actual chosen stack (Express + TypeScript + React), fetching real
 * data from a real external API (Open-Meteo, keyless) and displaying it.
 * Deliberately standalone — no import from backend/ or frontend/ — this must
 * keep working on its own even if the real app's code changes later.
 */

const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT ?? 4500);

const querySchema = z.object({
  city: z.string().trim().min(1, "city is required"),
  unit: z.enum(["C", "F"]).default("C"),
});

interface GeocodingResult {
  results?: { latitude: number; longitude: number; name?: string; country?: string }[];
}
interface ForecastResult {
  current?: { temperature_2m: number; weather_code: number };
}

// Same WMO subset as the real weather adapter (backend/src/adapters/weather.adapter.ts) —
// enough to turn a numeric code into a short human description.
const WEATHER_CODE_LABELS: Record<number, string> = {
  0: "Clear sky",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Freezing fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Showers",
  81: "Heavy showers",
  82: "Violent showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Severe thunderstorm",
};

/**
 * The widget: GET /api/widgets/city-temperature?city=Paris&unit=C
 * Two configurable params (city, unit) — satisfies "a widget with no
 * configurable parameters is invalid" from the subject.
 */
app.get("/api/widgets/city-temperature", async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid query" });
    return;
  }
  const { city, unit } = parsed.data;

  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
    const geoRes = await fetch(geoUrl, { signal: AbortSignal.timeout(10_000) });
    if (!geoRes.ok) throw new Error(`Geocoding failed (${geoRes.status})`);
    const geo = (await geoRes.json()) as GeocodingResult;
    const place = geo.results?.[0];
    if (!place) {
      res.status(404).json({ error: `City not found: ${city}` });
      return;
    }

    const temperatureUnit = unit === "F" ? "fahrenheit" : "celsius";
    const forecastUrl =
      `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}` +
      `&current=temperature_2m,weather_code&timezone=auto&temperature_unit=${temperatureUnit}`;
    const forecastRes = await fetch(forecastUrl, { signal: AbortSignal.timeout(10_000) });
    if (!forecastRes.ok) throw new Error(`Forecast failed (${forecastRes.status})`);
    const forecast = (await forecastRes.json()) as ForecastResult;
    if (!forecast.current) throw new Error("Invalid forecast response");

    res.json({
      city: place.country ? `${place.name}, ${place.country}` : (place.name ?? city),
      temperature: Math.round(forecast.current.temperature_2m * 10) / 10,
      unit,
      description: WEATHER_CODE_LABELS[forecast.current.weather_code] ?? "Unknown conditions",
      source: "Open-Meteo (https://open-meteo.com)",
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Upstream error" });
  }
});

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`[poc-backend] listening on http://localhost:${PORT}`);
});
