import {
  pgTable,
  serial,
  integer,
  text,
  boolean,
  timestamp,
  jsonb,
  primaryKey,
  doublePrecision,
  date,
} from "drizzle-orm/pg-core";

// 8 tables du périmètre obligatoire (PLAN.md §4.4) + 3 tables bonus (widget_history,
// widget_alerts, daily_briefs — voir docs/TECH_CHOICES.md §"Bonus features" et
// PLAN.md §11). Pas de tables `services`/`widgets` : le registre en code
// (src/widgets/registry.ts) est la seule source de vérité pour le catalogue.

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  // Nullable : un compte créé via "Se connecter avec Google" n'a pas de mot de
  // passe tant que l'utilisateur n'en définit pas un explicitement.
  passwordHash: text("password_hash"),
  googleId: text("google_id").unique(), // sub OAuth Google, si le compte est lié
  name: text("name"), // nom affiché, optionnel — édité depuis le profil (PATCH /auth/profile)
  role: text("role").notNull().default("user"), // 'user' | 'admin'
  emailConfirmed: boolean("email_confirmed").notNull().default(false),
  suspended: boolean("suspended").notNull().default(false),
  language: text("language").notNull().default("fr"), // 'fr' | 'en' — préférence i18n mémorisée sur le compte
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** purpose: 'confirm' (inscription) | 'reset' (mot de passe oublié) — code OTP 6 chiffres hashé. */
export const emailTokens = pgTable("email_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  purpose: text("purpose").notNull().default("confirm"),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const refreshTokens = pgTable("refresh_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revoked: boolean("revoked").notNull().default(false),
});

export const oauthAccounts = pgTable("oauth_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // 'github'
  providerUserId: text("provider_user_id").notNull(),
  accessToken: text("access_token").notNull(), // chiffré AES-256-GCM, voir lib/crypto.ts
  scope: text("scope"),
});

export const userServices = pgTable(
  "user_services",
  {
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    serviceName: text("service_name").notNull(), // 'weather' | 'github' | 'rss' | 'finance' | 'hackernews'
    subscribedAt: timestamp("subscribed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.serviceName] })],
);

export const widgetInstances = pgTable("widget_instances", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  widgetName: text("widget_name").notNull(), // clé dans widgets/registry.ts (ex: "precipitation_forecast")
  config: jsonb("config").notNull().$type<Record<string, unknown>>(),
  position: integer("position").notNull().default(0),
  refreshRate: integer("refresh_rate").notNull().default(60),
  lastRefreshedAt: timestamp("last_refreshed_at", { withTimezone: true }),
  status: text("status").notNull().default("pending"), // 'pending' | 'ok' | 'error'
});

export const widgetCache = pgTable("widget_cache", {
  widgetInstanceId: integer("widget_instance_id")
    .primaryKey()
    .references(() => widgetInstances.id, { onDelete: "cascade" }),
  payload: jsonb("payload").notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
});

// Historique de valeurs numériques par instance (sparkline) — au-delà du périmètre
// obligatoire du sujet (PLAN.md §3 "bonus" dans le sens notation, pas dossier :
// voir docs/TECH_CHOICES.md). Un seul chiffre par widget (lib/metrics.ts), pas le
// payload complet — widget_cache garde déjà la dernière réponse brute.
export const widgetHistory = pgTable("widget_history", {
  id: serial("id").primaryKey(),
  widgetInstanceId: integer("widget_instance_id")
    .notNull()
    .references(() => widgetInstances.id, { onDelete: "cascade" }),
  value: doublePrecision("value").notNull(),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
});

// Alerte seuil optionnelle sur un widget à valeur numérique (bonus — voir plus haut).
// Un seul seuil par instance : plus simple à configurer/afficher qu'une liste.
export const widgetAlerts = pgTable("widget_alerts", {
  widgetInstanceId: integer("widget_instance_id")
    .primaryKey()
    .references(() => widgetInstances.id, { onDelete: "cascade" }),
  operator: text("operator").notNull(), // 'above' | 'below'
  threshold: doublePrecision("threshold").notNull(),
  lastNotifiedAt: timestamp("last_notified_at", { withTimezone: true }),
});

// Brief quotidien généré par IA (bonus — voir plus haut) : un par utilisateur et par
// jour, régénéré au plus une fois par jour pour limiter les appels à l'API Gemini.
export const dailyBriefs = pgTable(
  "daily_briefs",
  {
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    briefDate: date("brief_date").notNull(),
    text: text("text").notNull(),
    generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.briefDate] })],
);

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
