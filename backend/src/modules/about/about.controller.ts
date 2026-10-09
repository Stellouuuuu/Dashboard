import type { Request, Response } from "express";
import { listWidgetDefinitions } from "../../widgets/registry.js";

/**
 * GET /about.json — réponse générée depuis widgets/registry.ts (source unique,
 * PLAN.md §4.2/§7), jamais écrite à la main. `client.host` = IP réelle du client
 * (nécessite app.set('trust proxy', 1), voir app.ts), `current_time` en secondes.
 */
export function getAbout(req: Request, res: Response) {
  const clientHost = req.ip ?? req.socket?.remoteAddress ?? "unknown";

  const byService = new Map<string, { name: string; description: string; params: { name: string; type: string }[] }[]>();
  for (const widget of listWidgetDefinitions()) {
    const list = byService.get(widget.service) ?? [];
    list.push({
      name: widget.name,
      description: widget.description,
      params: widget.params.map((p) => ({ name: p.name, type: p.type })),
    });
    byService.set(widget.service, list);
  }

  res.json({
    client: { host: clientHost },
    server: {
      current_time: Math.floor(Date.now() / 1000),
      services: Array.from(byService.entries()).map(([name, widgets]) => ({ name, widgets })),
    },
  });
}
