import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./db.js";

export async function runMigrations(): Promise<void> {
  await migrate(db, { migrationsFolder: "./drizzle" });
}

// Exécutable directement : npm run db:migrate
const isMain = process.argv[1]?.endsWith("migrate.ts") || process.argv[1]?.endsWith("migrate.js");
if (isMain) {
  runMigrations()
    .then(() => {
      console.log("Migrations appliquées.");
      return pool.end();
    })
    .catch((err) => {
      console.error("Échec des migrations:", err);
      process.exit(1);
    });
}
