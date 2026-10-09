import { existsSync, unlinkSync } from "node:fs";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import { widgets } from "./schema.js";

const DB_FILE = "poc.sqlite";
if (existsSync(DB_FILE)) unlinkSync(DB_FILE); // run repeatable from a clean slate

const sqlite = new Database(DB_FILE);
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS widgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    config TEXT NOT NULL
  )
`);

const db = drizzle(sqlite);

const mock = { name: "city_temperature", config: JSON.stringify({ city: "Paris", unit: "C" }) };
console.log("Widget stored:", mock);

const [inserted] = db.insert(widgets).values(mock).returning().all();
const reread = db.select().from(widgets).where(eq(widgets.id, inserted.id)).get();

console.log("Widget read back:", reread);
