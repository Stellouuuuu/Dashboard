import { isLinked as isGithubLinked } from "../auth/github-oauth.service.js";
import { httpError } from "../../lib/httpError.js";
import * as repo from "./services.repository.js";

// PLAN.md §5 : weather, rss, finance et hackernews sont disponibles par défaut (pas
// d'abonnement requis, pas de clé/compte tiers), github exige une liaison OAuth avant
// de pouvoir s'y abonner.
const SERVICE_NAMES = ["weather", "github", "rss", "finance", "hackernews"] as const;
export type ServiceName = (typeof SERVICE_NAMES)[number];
const OAUTH_REQUIRED = new Set<ServiceName>(["github"]);

function assertKnownService(name: string): asserts name is ServiceName {
  if (!SERVICE_NAMES.includes(name as ServiceName)) {
    throw httpError(404, "SERVICE_UNKNOWN", `Service inconnu: ${name}`);
  }
}

export interface PublicService {
  name: ServiceName;
  requiresOAuth: boolean;
  subscribed: boolean;
}

export async function listServices(userId: number): Promise<PublicService[]> {
  const subscriptions = new Set(await repo.listSubscriptions(userId));
  return SERVICE_NAMES.map((name) => ({
    name,
    requiresOAuth: OAUTH_REQUIRED.has(name),
    subscribed: OAUTH_REQUIRED.has(name) ? subscriptions.has(name) : true,
  }));
}

export async function subscribe(userId: number, name: string): Promise<void> {
  assertKnownService(name);
  if (!OAUTH_REQUIRED.has(name)) return; // déjà disponible par défaut, no-op idempotent

  const linked = await isGithubLinked(userId);
  if (!linked)
    throw httpError(400, "SERVICE_OAUTH_REQUIRED", "Lie ton compte GitHub avant de t'abonner à ce service");
  await repo.subscribe(userId, name);
}

export async function unsubscribe(userId: number, name: string): Promise<void> {
  assertKnownService(name);
  if (!OAUTH_REQUIRED.has(name)) {
    throw httpError(
      400,
      "SERVICE_CANNOT_UNSUBSCRIBE_DEFAULT",
      `${name} est disponible par défaut et ne peut pas être désabonné`,
    );
  }
  await repo.unsubscribe(userId, name);
}
