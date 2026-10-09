# POC - Drizzle ORM

[English](#english) · [Français](#français)

---

<a id="english"></a>

## English

Minimal script: define a `widgets` table, insert one mock widget, read it back by id, print both to the console.

### Run it

```bash
cd bonus/poc/orm/drizzle
npm install
npm start
```

One command after install - no separate migration/generate step, the script creates the table itself with a raw `CREATE TABLE IF NOT EXISTS` on a local SQLite file (`poc.sqlite`, deleted and recreated on every run so it's repeatable).

### Observed output

```
Widget stored: { name: 'city_temperature', config: '{"city":"Paris","unit":"C"}' }
Widget read back: {
  id: 1,
  name: 'city_temperature',
  config: '{"city":"Paris","unit":"C"}'
}
```

### What we observed

- **Setup time (measured):** `npm install` ≈ 4m 9s (dominated by compiling the `better-sqlite3` native addon via node-gyp/prebuild-install - not Drizzle-specific, the same cost hits TypeORM below). `npm start` ≈ 2.6s.
- **Lines of code:** 34 (7 for the schema in `src/schema.ts`, 27 for the script in `src/index.ts`).
- **Ease of use:** schema is plain TypeScript function calls (`sqliteTable`, `text`, `integer`) - reads like the table definition itself, no decorators, no codegen step, no separate CLI to learn to get this POC running. Query builder (`db.insert(...).values(...).returning()`, `db.select().from(...).where(eq(...))`) stays close to SQL, easy to guess.
- **Weaknesses observed:** for anything beyond a throwaway script, you'd want `drizzle-kit` to manage migrations properly instead of a hand-written `CREATE TABLE IF NOT EXISTS` - that's an extra tool/step this POC intentionally skips to stay minimal. Native `better-sqlite3` dependency means the install cost above is real for any Drizzle + SQLite setup, not just this POC.

---

<a id="français"></a>

## Français

Script minimal : définit une table `widgets`, insère un widget mocké, le relit par id, affiche les deux dans la console.

### Lancer

```bash
cd bonus/poc/orm/drizzle
npm install
npm start
```

Une seule commande après l'install - pas d'étape de migration/génération séparée, le script crée lui-même la table via un `CREATE TABLE IF NOT EXISTS` brut sur un fichier SQLite local (`poc.sqlite`, supprimé et recréé à chaque run pour que ce soit rejouable).

### Sortie observée

```
Widget stored: { name: 'city_temperature', config: '{"city":"Paris","unit":"C"}' }
Widget read back: {
  id: 1,
  name: 'city_temperature',
  config: '{"city":"Paris","unit":"C"}'
}
```

### Ce qu'on a observé

- **Temps de mise en place (mesuré) :** `npm install` ≈ 4 min 9 s (dominé par la compilation du module natif `better-sqlite3` via node-gyp/prebuild-install - pas spécifique à Drizzle, TypeORM ci-dessous paie le même coût). `npm start` ≈ 2,6 s.
- **Lignes de code :** 34 (7 pour le schéma dans `src/schema.ts`, 27 pour le script dans `src/index.ts`).
- **Facilité :** le schéma est du TypeScript pur (`sqliteTable`, `text`, `integer`) - ça se lit comme la définition de la table elle-même, pas de décorateurs, pas d'étape de génération de code, pas de CLI séparée à apprendre pour faire tourner ce POC. Le query builder (`db.insert(...).values(...).returning()`, `db.select().from(...).where(eq(...))`) reste proche du SQL, facile à deviner.
- **Points faibles observés :** au-delà d'un script jetable, il faudrait `drizzle-kit` pour gérer de vraies migrations plutôt qu'un `CREATE TABLE IF NOT EXISTS` écrit à la main - c'est un outil/une étape en plus que ce POC saute volontairement pour rester minimal. La dépendance native `better-sqlite3` fait que le coût d'install ci-dessus est réel pour tout setup Drizzle + SQLite, pas propre à ce POC.
