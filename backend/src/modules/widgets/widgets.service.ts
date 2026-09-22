import * as repo from "./widgets.repository.js";

export async function getCatalog() {
  return repo.findAll();
}

export async function getWidget(id: number) {
  const widget = await repo.findById(id);
  if (!widget) throw new Error("Widget introuvable");
  return widget;
}
