import { getWidgetDefinition, listWidgetDefinitions, type WidgetDefinition } from "../../widgets/registry.js";

interface PublicWidget {
  name: string;
  service: string;
  description: string;
  params: WidgetDefinition["params"];
}

function toPublic(widget: WidgetDefinition): PublicWidget {
  return {
    name: widget.name,
    service: widget.service,
    description: widget.description,
    params: widget.params,
  };
}

/** Catalogue complet — sert la modale de config du front (PLAN.md §4.2). */
export function getCatalog(): PublicWidget[] {
  return listWidgetDefinitions().map(toPublic);
}

export function getWidget(name: string): PublicWidget {
  const widget = getWidgetDefinition(name);
  if (!widget) throw new Error("Widget introuvable");
  return toPublic(widget);
}
