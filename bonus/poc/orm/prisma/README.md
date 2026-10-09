# POC - Prisma ORM

[English](#english) · [Français](#français)

---

<a id="english"></a>

## English

Minimal script: define a `Widget` model, insert one mock widget, read it back by id, print both to the console.

### Run it

```bash
cd bonus/poc/orm/prisma
npm install
npm start
```

`npm start` itself runs `prisma generate && prisma db push --skip-generate && tsx src/index.ts` - Prisma needs its client **generated** from `schema.prisma` before it can be imported, and the SQLite file needs to be created/synced with `db push`. Both are chained into the one `start` script so it's still a single command to type, but under the hood it's 3 steps, not 1.

### Observed output

```
Prisma schema loaded from prisma/schema.prisma
✔ Generated Prisma Client (v5.22.0) to ./node_modules/@prisma/client in 175ms

Prisma schema loaded from prisma/schema.prisma
Datasource "db": SQLite database "poc.sqlite" at "file:../poc.sqlite"
SQLite database poc.sqlite created at file:../poc.sqlite
🚀  Your database is now in sync with your Prisma schema. Done in 22ms

Widget stored: { name: 'city_temperature', config: '{"city":"Paris","unit":"C"}' }
Widget read back: {
  id: 1,
  name: 'city_temperature',
  config: '{"city":"Paris","unit":"C"}'
}
```

### What we observed

- **Setup time (measured):** `npm install` ≈ 1m 0s (no native compile - Prisma ships a prebuilt query engine binary, much faster than the `better-sqlite3` addon used by Drizzle/TypeORM). `npm start` (generate + db push + run) ≈ 3.5s.
- **Lines of code:** 27 (14 for `prisma/schema.prisma`, 13 for `src/index.ts`).
- **Ease of use:** the schema DSL (`schema.prisma`) is its own tiny language, not TypeScript - very readable, but it's one more syntax to learn on top of TS. The generated client is fully typed and the query API (`prisma.widget.create`, `.findUnique`) is arguably the most guessable of the three once generated.
- **Weaknesses observed:** the mandatory `generate` step is a real extra moving part - forget to run it (e.g. after pulling schema changes from git) and the app fails with a stale/missing client, a class of error the other two ORMs here don't have. The generated client also lives in `node_modules/@prisma/client`, so it must be regenerated in CI/Docker builds too, not just locally.

---

<a id="français"></a>

## Français

Script minimal : définit un modèle `Widget`, insère un widget mocké, le relit par id, affiche les deux dans la console.

### Lancer

```bash
cd bonus/poc/orm/prisma
npm install
npm start
```

`npm start` exécute en interne `prisma generate && prisma db push --skip-generate && tsx src/index.ts` - Prisma a besoin que son client soit **généré** à partir de `schema.prisma` avant de pouvoir être importé, et le fichier SQLite doit être créé/synchronisé via `db push`. Les deux sont enchaînés dans le script `start` pour que ça reste une seule commande à taper, mais en coulisses ce sont 3 étapes, pas 1.

### Sortie observée

```
Prisma schema loaded from prisma/schema.prisma
✔ Generated Prisma Client (v5.22.0) to ./node_modules/@prisma/client in 175ms

Prisma schema loaded from prisma/schema.prisma
Datasource "db": SQLite database "poc.sqlite" at "file:../poc.sqlite"
SQLite database poc.sqlite created at file:../poc.sqlite
🚀  Your database is now in sync with your Prisma schema. Done in 22ms

Widget stored: { name: 'city_temperature', config: '{"city":"Paris","unit":"C"}' }
Widget read back: {
  id: 1,
  name: 'city_temperature',
  config: '{"city":"Paris","unit":"C"}'
}
```

### Ce qu'on a observé

- **Temps de mise en place (mesuré) :** `npm install` ≈ 1 min 0 s (pas de compilation native - Prisma embarque un binaire de moteur de requêtes précompilé, bien plus rapide que le module natif `better-sqlite3` utilisé par Drizzle/TypeORM). `npm start` (generate + db push + run) ≈ 3,5 s.
- **Lignes de code :** 27 (14 pour `prisma/schema.prisma`, 13 pour `src/index.ts`).
- **Facilité :** le DSL du schéma (`schema.prisma`) est un petit langage à part, pas du TypeScript - très lisible, mais c'est une syntaxe de plus à apprendre en plus de TS. Le client généré est entièrement typé et l'API de requête (`prisma.widget.create`, `.findUnique`) est sans doute la plus devinable des trois une fois générée.
- **Points faibles observés :** l'étape `generate` obligatoire est une vraie complexité en plus - l'oublier (ex : après avoir pull des changements de schéma) et l'app plante avec un client obsolète/manquant, une classe d'erreur que les deux autres ORM ici n'ont pas. Le client généré vit aussi dans `node_modules/@prisma/client`, donc il faut le régénérer en CI/build Docker aussi, pas seulement en local.
