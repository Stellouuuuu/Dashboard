import { db } from "../../db/db.js";
import { userServices } from "../../db/schema.js";
import { eq, and } from "drizzle-orm";

export async function findSubscription(userId: number, serviceName: string) {
  const [row] = await db
    .select()
    .from(userServices)
    .where(and(eq(userServices.userId, userId), eq(userServices.serviceName, serviceName)));
  return row ?? null;
}

export async function listSubscriptions(userId: number): Promise<string[]> {
  const rows = await db
    .select({ serviceName: userServices.serviceName })
    .from(userServices)
    .where(eq(userServices.userId, userId));
  return rows.map((r) => r.serviceName);
}

export async function subscribe(userId: number, serviceName: string): Promise<void> {
  const existing = await findSubscription(userId, serviceName);
  if (existing) return; // idempotent
  await db.insert(userServices).values({ userId, serviceName });
}

export async function unsubscribe(userId: number, serviceName: string): Promise<void> {
  await db
    .delete(userServices)
    .where(and(eq(userServices.userId, userId), eq(userServices.serviceName, serviceName)));
}
