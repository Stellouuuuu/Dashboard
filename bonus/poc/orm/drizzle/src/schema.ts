import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const widgets = sqliteTable("widgets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  config: text("config").notNull(),
});
