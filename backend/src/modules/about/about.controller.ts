import type { Request, Response } from "express";

/**
 * GET /about.json – Membre B (widgets B)
 * Répond au format imposé par le sujet EPITECH.
 * Le client.host est l'IP du client qui effectue la requête.
 */
export function getAbout(req: Request, res: Response) {
  const forwarded = req.headers["x-forwarded-for"] as string | undefined;
  const clientHost =
    (forwarded ? forwarded.split(",")[0]?.trim() : undefined) ??
    req.socket?.remoteAddress ??
    "unknown";

  const payload = {
    client: {
      host: clientHost,
    },
    server: {
      current_time: Math.floor(Date.now() / 1000),
      services: [
        {
          name: "weather",
          widgets: [
            // Widget A : city_temperature (Membre A)
            {
              name: "city_temperature",
              description: "Display the current temperature for a city",
              params: [{ name: "city", type: "string" }],
            },
            // Widget B : precipitation_forecast (Membre B)
            {
              name: "precipitation_forecast",
              description: "Display precipitation forecast over N days",
              params: [
                { name: "city", type: "string" },
                { name: "days", type: "integer" },
              ],
            },
          ],
        },
        {
          name: "github",
          widgets: [
            // Widget A : recent_commits (Membre A)
            {
              name: "recent_commits",
              description: "Display the recent commits of a repository",
              params: [
                { name: "repository", type: "string" },
                { name: "limit", type: "integer" },
              ],
            },
            // Widget B : security_alerts (Membre B)
            {
              name: "security_alerts",
              description: "Display security alerts of a repository",
              params: [
                { name: "repository", type: "string" },
                { name: "severity", type: "string" },
              ],
            },
          ],
        },
        {
          name: "rss",
          widgets: [
            // Widget A : article_list (Membre A)
            {
              name: "article_list",
              description: "Display the list of the last articles from an RSS feed",
              params: [
                { name: "link", type: "string" },
                { name: "number", type: "integer" },
              ],
            },
            // Widget B : feed_summary (Membre B)
            {
              name: "feed_summary",
              description: "Display a summary of multiple RSS feeds",
              params: [
                { name: "link", type: "string" },
                { name: "number", type: "integer" },
              ],
            },
          ],
        },
      ],
    },
  };

  res.json(payload);
}
