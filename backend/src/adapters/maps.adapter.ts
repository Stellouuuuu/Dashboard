import { env } from "../config/env.js";

export const TRAVEL_MODES = ["driving", "cycling", "walking"] as const;

const PROFILE_CODE: Record<string, string> = {
  driving: "driving-car",
  cycling: "cycling-regular",
  walking: "foot-walking",
};

export interface DirectionsResult {
  from: string;
  to: string;
  mode: string;
  distanceKm: number;
  durationMin: number;
}

interface ORSGeocodeResponse {
  features?: { geometry: { coordinates: [number, number] }; properties: { label: string } }[];
}

// Réponse GeoJSON par défaut de l'API v2 directions (confirmé par un appel réel) —
// pas de clé "routes" de haut niveau, le total est dans features[].properties.summary.
interface ORSDirectionsResponse {
  features?: { properties: { summary: { distance: number; duration: number } } }[];
}

function requireApiKey(): string {
  if (!env.ORS_API_KEY) throw new Error("Clé API OpenRouteService manquante (ORS_API_KEY)");
  return env.ORS_API_KEY;
}

async function geocodePlace(place: string, apiKey: string): Promise<{ lon: number; lat: number; label: string }> {
  const url = `https://api.openrouteservice.org/geocode/search?api_key=${apiKey}&text=${encodeURIComponent(place)}&size=1`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`Géocodage impossible (${res.status})`);
  const data = (await res.json()) as ORSGeocodeResponse;
  const feature = data.features?.[0];
  if (!feature) throw new Error(`Lieu introuvable: ${place}`);
  const [lon, lat] = feature.geometry.coordinates;
  return { lon, lat, label: feature.properties.label };
}

interface DirectionsConfig {
  from: string;
  to: string;
  mode: string;
}

/** Adaptateur directions — OpenRouteService (clé gratuite, sans OAuth, openrouteservice.org). */
export async function fetchDirections(config: DirectionsConfig): Promise<DirectionsResult> {
  const apiKey = requireApiKey();
  const [from, to] = await Promise.all([geocodePlace(config.from, apiKey), geocodePlace(config.to, apiKey)]);

  const profile = PROFILE_CODE[config.mode] ?? "driving-car";
  const url =
    `https://api.openrouteservice.org/v2/directions/${profile}?api_key=${apiKey}` +
    `&start=${from.lon},${from.lat}&end=${to.lon},${to.lat}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`Itinéraire impossible (${res.status}: ${await res.text()})`);
  const data = (await res.json()) as ORSDirectionsResponse;
  const summary = data.features?.[0]?.properties?.summary;
  if (!summary) throw new Error("Aucun itinéraire trouvé");

  return {
    from: from.label,
    to: to.label,
    mode: config.mode,
    distanceKm: Math.round((summary.distance / 1000) * 10) / 10,
    durationMin: Math.round(summary.duration / 60),
  };
}
