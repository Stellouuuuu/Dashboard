import { app } from "./app.js";
import { env } from "./config/env.js";
import { runMigrations } from "./db/migrate.js";
import { seedAdmin } from "./db/seed-admin.js";

async function main() {
  await runMigrations();
  await seedAdmin();
  app.listen(env.PORT, () => {
    console.log(`API démarrée sur :${env.PORT}`);
  });
}

main().catch((err) => {
  console.error("Échec du démarrage de l'API:", err);
  process.exit(1);
});
