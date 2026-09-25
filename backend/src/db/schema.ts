import {
  pgTable,
  serial,
  integer,
  text,
  boolean,
  timestamp,
  jsonb,
  primaryKey,
} from "drizzle-orm/pg-core";

// 8 tables — voir PLAN.md §4.4. Pas de tables `services`/`widgets` : le registre
// en code (src/widgets/registry.ts) est la seule source de vérité pour le catalogue.

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"), // nom affiché, optionnel — édité depuis le profil (PATCH /auth/profile)
  role: text("role").notNull().default("user"), // 'user' | 'admin'
  emailConfirmed: boolean("email_confirmed").notNull().default(false),
  suspended: boolean("suspended").notNull().default(false),
  language: text("language").notNull().default("fr"), // 'fr' | 'en' — préférence i18n mémorisée sur le compte
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const emailTokens = pgTable("email_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
