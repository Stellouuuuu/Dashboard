import { db } from "../../database/db.js";
import { widgets } from "../../database/schema.js";
import { eq } from "drizzle-orm";

/** Retourne le catalogue complet des widgets */
export async function findAll() {
  return db.select().from(widgets);
}

/** Retourne un widget par son id */
export async function findById(id: number) {
  const [row] = await db.select().from(widgets).where(eq(widgets.id, id));
  return row ?? null;
}

/** Retourne un widget par son slug */
export async function findBySlug(slug: string) {
  const [row] = await db.select().from(widgets).where(eq(widgets.slug, slug));
  return row ?? null;
}
