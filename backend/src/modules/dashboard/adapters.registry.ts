import { fetchPrecipitationForecast } from "../../adapters/weather.adapter.js";
import { fetchSecurityAlerts } from "../../adapters/github.adapter.js";
import { fetchFeedSummary } from "../../adapters/rss.adapter.js";
import type { AdapterFn } from "../../adapters/adapter.interface.js";

/**
 * Registre des adaptateurs Membre B.
 * Chaque clé correspond au slug du widget en base.
 */
export const adapters: Record<string, AdapterFn> = {
  precipitation_forecast: fetchPrecipitationForecast as AdapterFn,
  security_alerts: fetchSecurityAlerts as AdapterFn,
  feed_summary: fetchFeedSummary as AdapterFn,
};