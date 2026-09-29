import "reflect-metadata";
import { existsSync, unlinkSync } from "node:fs";
import { DataSource } from "typeorm";
import { Widget } from "./entity.js";

const DB_FILE = "poc.sqlite";
if (existsSync(DB_FILE)) unlinkSync(DB_FILE); // run repeatable from a clean slate

const AppDataSource = new DataSource({
  type: "better-sqlite3",
  database: DB_FILE,
  entities: [Widget],
  synchronize: true,
});

async function main() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Widget);

  const mock = { name: "city_temperature", config: JSON.stringify({ city: "Paris", unit: "C" }) };
  console.log("Widget stored:", mock);

  const inserted = await repo.save(mock);
  const reread = await repo.findOneBy({ id: inserted.id });

  console.log("Widget read back:", reread);

  await AppDataSource.destroy();
}

main();
