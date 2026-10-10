import { env } from "../config/env.js";

interface WeatherApiLocation {
  name: string;
  region?: string;
  country?: string;
}

interface WeatherApiCurrentResponse {
  location?: WeatherApiLocation;
  current?: { temp_c: number; temp_f: number; condition?: { text: string } };
}

interface WeatherApiForecastResponse {
  location?: WeatherApiLocation;
  forecast?: { forecastday: { date: string; day: { totalprecip_mm: number } }[] };
}

/**
 * WeatherAPI's `q=` fait une correspondance approximative : une ville mal
 * orthographiée renvoie quand même un résultat, mais pour un autre lieu. On
 * affiche donc toujours `location.name` (ce qui a été réellement trouvé),
 * jamais `config.city` tel quel — sinon un mismatch silencieux passe inaperçu.
 */
function resolvedCityName(location: WeatherApiLocation | undefined, fallback: string): string {
  if (!location) return fallback;
  return location.country ? `${location.name}, ${location.country}` : location.name;
}

interface PrecipitationConfig {
  city: string;
  days: number;
}

interface CityTemperatureConfig {
  city: string;
  unit: string;
}

interface GeocodingResult {
  results?: { latitude: number; longitude: number; name?: string }[];
}

interface ForecastResponse {
  daily?: {
    time: string[];
    precipitation_sum: number[];
  };
}

interface CurrentWeatherResponse {
  current?: {
    temperature_2m: number;
    weather_code: number;
  };
}

export interface PrecipitationDay {
  day: string;
  precipitation_mm: number;
}

export interface CityTemperature {
  city: string;
  temperature: number;
  unit: "C" | "F";
  description: string;
}

interface GeocodedPlace {
  latitude: number;
  longitude: number;
  name: string;
}

/** Géocodage partagé par tous les widgets weather — Open-Meteo, gratuit, sans clé API. */
async function geocode(city: string): Promise<GeocodedPlace> {
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
  const geoRes = await fetch(geoUrl);
  if (!geoRes.ok)
    throw new Error(`Géocodage impossible pour cette ville (${geoRes.status}: ${await geoRes.text()})`);
  const geo = (await geoRes.json()) as GeocodingResult;
  const place = geo.results?.[0];
  if (!place) throw new Error(`Ville introuvable: ${city}`);
  return { latitude: place.latitude, longitude: place.longitude, name: place.name ?? city };
}

// Sous-ensemble des codes météo WMO utilisés par Open-Meteo — suffisant pour une
// description courte, pas besoin de couvrir les 100 codes.
const WEATHER_CODE_LABELS: Record<number, string> = {
  0: "Ciel dégagé",
  1: "Plutôt dégagé",
  2: "Partiellement nuageux",
  3: "Couvert",
  45: "Brouillard",
  48: "Brouillard givrant",
  51: "Bruine légère",
  53: "Bruine",
  55: "Bruine forte",
  61: "Pluie légère",
  63: "Pluie",
  65: "Pluie forte",
  71: "Neige légère",
  73: "Neige",
  75: "Neige forte",
  80: "Averses",
  81: "Averses fortes",
  82: "Averses violentes",
  95: "Orage",
  96: "Orage avec grêle",
  99: "Orage violent",
};

/**
 * Adaptateur city_temperature — Open-Meteo (gratuit, sans clé API).
 * `unit` accepte "C"/"F" ou "°C"/"°F" (format utilisé par le wizard front).
 */
export async function fetchCityTemperature(config: CityTemperatureConfig): Promise<CityTemperature> {
  const unit: "C" | "F" = /f/i.test(config.unit) ? "F" : "C";

  if (env.WEATHERAPI_KEY) {
    const url = `https://api.weatherapi.com/v1/current.json?key=${env.WEATHERAPI_KEY}&q=${encodeURIComponent(config.city)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Impossible de récupérer la météo (${res.status}: ${await res.text()})`);
    const data = (await res.json()) as WeatherApiCurrentResponse;
    if (!data.current) throw new Error("Réponse météo invalide");
    return {
      city: resolvedCityName(data.location, config.city),
      temperature: Math.round((unit === "F" ? data.current.temp_f : data.current.temp_c) * 10) / 10,
      unit,
      description: data.current.condition?.text ?? "Conditions inconnues",
    };
  }

  const place = await geocode(config.city);
  const temperatureUnit = unit === "F" ? "fahrenheit" : "celsius";

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}` +
    `&current=temperature_2m,weather_code&timezone=auto&temperature_unit=${temperatureUnit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Impossible de récupérer la météo (${res.status}: ${await res.text()})`);
  const data = (await res.json()) as CurrentWeatherResponse;
  if (!data.current) throw new Error("Réponse météo invalide");

  return {
    city: place.name,
    temperature: Math.round(data.current.temperature_2m * 10) / 10,
    unit,
    description: WEATHER_CODE_LABELS[data.current.weather_code] ?? "Conditions inconnues",
  };
}

/**
 * Adaptateur precipitation_forecast — Open-Meteo (gratuit, sans clé API).
 * PLAN.md §5 : on évite de gérer un secret de plus.
 */
export async function fetchPrecipitationForecast(
  config: PrecipitationConfig,
): Promise<PrecipitationDay[]> {
  const days = Math.min(Math.max(config.days, 1), 7);

  if (env.WEATHERAPI_KEY) {
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${env.WEATHERAPI_KEY}&q=${encodeURIComponent(config.city)}&days=${days}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Impossible de récupérer la météo (${res.status}: ${await res.text()})`);
    const data = (await res.json()) as WeatherApiForecastResponse;
    if (!data.forecast) throw new Error("Réponse météo invalide");
    return data.forecast.forecastday.map((d) => ({
      day: d.date,
      precipitation_mm: Math.round(d.day.totalprecip_mm * 10) / 10,
    }));
  }

  const place = await geocode(config.city);

  const forecastUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}` +
    `&daily=precipitation_sum&timezone=auto&forecast_days=${days}`;
  const forecastRes = await fetch(forecastUrl);
  if (!forecastRes.ok)
    throw new Error(`Impossible de récupérer la météo (${forecastRes.status}: ${await forecastRes.text()})`);
  const data = (await forecastRes.json()) as ForecastResponse;
  if (!data.daily) throw new Error("Réponse météo invalide");

  return data.daily.time.map((day, i) => ({
    day,
    precipitation_mm: Math.round((data.daily!.precipitation_sum[i] ?? 0) * 10) / 10,
  }));
}
