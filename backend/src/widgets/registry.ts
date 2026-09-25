import { z, type ZodType } from "zod";
import { fetchCityTemperature, fetchPrecipitationForecast } from "../adapters/weather.adapter.js";
import { fetchRecentCommits, fetchSecurityAlerts } from "../adapters/github.adapter.js";
import { fetchArticleList, fetchFeedSummary } from "../adapters/rss.adapter.js";
import { fetchExchangeRate, fetchCryptoPrice } from "../adapters/finance.adapter.js";
import { fetchTopStories, fetchStorySearch } from "../adapters/hackernews.adapter.js";

export interface WidgetParam {
  name: string;
  type: "string" | "integer";
  label: string;
}

export interface WidgetContext {
  userId: number;
}

export interface WidgetDefinition<C = any> {
  service: "weather" | "github" | "rss" | "finance" | "hackernews";
  name: string;
  description: string;
  params: WidgetParam[];
  schema: ZodType<C>;
  fetch: (config: C, ctx: WidgetContext) => Promise<unknown>;
}

/**
 * Registre unique des widgets (PLAN.md §4.2) : à partir d'ici on génère /about.json,
 * on valide les configs (create/reconfigure) et on sert GET /api/v1/widgets.
 * Plus de table `widgets` ni de catalogue codé en dur ailleurs.
 *
 */
export const WIDGET_REGISTRY = {
  city_temperature: {
    service: "weather",
    name: "city_temperature",
    description: "Display the current temperature for a city",
    params: [
      { name: "city", type: "string", label: "Ville" },
      { name: "unit", type: "string", label: "Unité (C/F)" },
    ],
    schema: z.object({
      city: z.string().min(1),
      unit: z.string().min(1),
    }),
    fetch: (config) => fetchCityTemperature(config),
  },
  precipitation_forecast: {
    service: "weather",
    name: "precipitation_forecast",
    description: "Display the precipitation forecast for the next days",
    params: [
      { name: "city", type: "string", label: "Ville" },
      { name: "days", type: "integer", label: "Jours" },
    ],
    schema: z.object({
      city: z.string().min(1),
      days: z.number().int().min(1).max(7),
    }),
    fetch: (config) => fetchPrecipitationForecast(config),
  },
  security_alerts: {
    service: "github",
    name: "security_alerts",
    description: "Display the security alerts of a repository",
    params: [
      { name: "repository", type: "string", label: "Dépôt (owner/repo)" },
      { name: "severity", type: "string", label: "Sévérité" },
    ],
    schema: z.object({
      repository: z.string().regex(/^[^/\s]+\/[^/\s]+$/, "Format attendu: owner/repo"),
      severity: z.string().optional(),
    }),
    fetch: (config, ctx) => fetchSecurityAlerts(config, ctx),
  },
  recent_commits: {
    service: "github",
    name: "recent_commits",
    description: "Display the recent commits of a repository",
    params: [
      { name: "repository", type: "string", label: "Dépôt (owner/repo)" },
      { name: "limit", type: "integer", label: "Limite" },
    ],
    schema: z.object({
      repository: z.string().regex(/^[^/\s]+\/[^/\s]+$/, "Format attendu: owner/repo"),
      limit: z.number().int().min(1).max(20),
    }),
    fetch: (config, ctx) => fetchRecentCommits(config, ctx),
  },
  feed_summary: {
    service: "rss",
    name: "feed_summary",
    description: "Display the latest articles merged from several feeds",
    params: [
      { name: "links", type: "string", label: "URLs des flux (séparées par des virgules)" },
      { name: "number", type: "integer", label: "Nombre d'articles" },
    ],
    schema: z.object({
      links: z.string().min(1),
      number: z.number().int().min(1).max(20),
    }),
    fetch: (config) => fetchFeedSummary(config),
  },
  article_list: {
    service: "rss",
    name: "article_list",
    description: "Display the list of the last articles",
    params: [
      { name: "link", type: "string", label: "URL du flux" },
      { name: "number", type: "integer", label: "Nombre d'articles" },
    ],
    schema: z.object({
      link: z.string().url(),
      number: z.number().int().min(1).max(20),
    }),
    fetch: (config) => fetchArticleList(config),
  },
  exchange_rate: {
    service: "finance",
    name: "exchange_rate",
    description: "Display the exchange rate between two currencies",
    params: [
      { name: "base", type: "string", label: "Devise de base" },
      { name: "target", type: "string", label: "Devise cible" },
    ],
    schema: z.object({
      base: z.string().regex(/^[A-Za-z]{3}$/, "Code devise ISO à 3 lettres (ex: USD)"),
      target: z.string().regex(/^[A-Za-z]{3}$/, "Code devise ISO à 3 lettres (ex: EUR)"),
    }),
    fetch: (config) => fetchExchangeRate(config),
  },
  crypto_price: {
    service: "finance",
    name: "crypto_price",
    description: "Display the current price of a cryptocurrency",
    params: [
      { name: "coin", type: "string", label: "Cryptomonnaie (id CoinGecko)" },
      { name: "currency", type: "string", label: "Devise" },
    ],
    schema: z.object({
      coin: z.string().min(1),
      currency: z.string().min(1),
    }),
    fetch: (config) => fetchCryptoPrice(config),
  },
  top_stories: {
    service: "hackernews",
    name: "top_stories",
    description: "Display the top Hacker News stories",
    params: [{ name: "number", type: "integer", label: "Nombre d'actus" }],
    schema: z.object({
      number: z.number().int().min(1).max(30),
    }),
    fetch: (config) => fetchTopStories(config),
  },
  story_search: {
    service: "hackernews",
    name: "story_search",
    description: "Search Hacker News stories by keyword",
    params: [
      { name: "query", type: "string", label: "Recherche" },
      { name: "number", type: "integer", label: "Nombre de résultats" },
    ],
    schema: z.object({
      query: z.string().min(1),
      number: z.number().int().min(1).max(30),
    }),
    fetch: (config) => fetchStorySearch(config),
  },
} satisfies Record<string, WidgetDefinition<any>>;

export type WidgetName = keyof typeof WIDGET_REGISTRY;

export function getWidgetDefinition(name: string): WidgetDefinition | undefined {
  return (WIDGET_REGISTRY as Record<string, WidgetDefinition>)[name];
}

export function listWidgetDefinitions(): WidgetDefinition[] {
  return Object.values(WIDGET_REGISTRY);
}
