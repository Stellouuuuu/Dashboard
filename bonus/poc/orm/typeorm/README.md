# POC - TypeORM

[English](#english) · [Français](#français)

---

<a id="english"></a>

## English

Minimal script: define a `Widget` entity, insert one mock widget, read it back by id, print both to the console.

### Run it

```bash
cd bonus/poc/orm/typeorm
npm install
npm start
```

One command after install - `synchronize: true` on the `DataSource` makes TypeORM create/update the SQLite schema from the entity automatically at startup, no separate migration/generate step needed for this POC.

### Observed output

```
Widget stored: { name: 'city_temperature', config: '{"city":"Paris","unit":"C"}' }
Widget read back: Widget {
  id: 1,
  name: 'city_temperature',
  config: '{"city":"Paris","unit":"C"}'
}
```

### What we observed

- **Setup time (measured):** `npm install` ≈ 4m 0s (same `better-sqlite3` native compile cost as Drizzle). `npm start` ≈ 2.6s.
- **Lines of code:** 44 (13 for the entity in `src/entity.ts`, 31 for the script in `src/index.ts`).
- **Ease of use:** decorator-based entities (`@Entity`, `@PrimaryGeneratedColumn`, `@Column`) read close to other backend frameworks used in this project (NestJS-style), which lowers the learning curve if the team already knows decorators. Needed `experimentalDecorators` + `emitDecoratorMetadata` in `tsconfig.json` and an explicit `import "reflect-metadata"` at the entry point - invisible plumbing that has to be right or nothing works, and the failure mode (a cryptic reflection error) is less obvious than a missing generate step.
- **Weaknesses observed:** `synchronize: true` (used here to keep the POC to one command) is explicitly documented by TypeORM as unsafe for production - it can drop/alter columns silently on schema changes. A real project needs TypeORM's separate migration CLI instead, which reintroduces an extra step similar to Prisma's `generate`/`db push`.

---

<a id="français"></a>

## Français

Script minimal : définit une entité `Widget`, insère un widget mocké, le relit par id, affiche les deux dans la console.

### Lancer

```bash
cd bonus/poc/orm/typeorm
npm install
npm start
```

Une seule commande après l'install - `synchronize: true` sur le `DataSource` fait créer/mettre à jour le schéma SQLite par TypeORM automatiquement au démarrage, pas d'étape de migration/génération séparée nécessaire pour ce POC.

### Sortie observée

```
Widget stored: { name: 'city_temperature', config: '{"city":"Paris","unit":"C"}' }
Widget read back: Widget {
  id: 1,
  name: 'city_temperature',
  config: '{"city":"Paris","unit":"C"}'
}
```

### Ce qu'on a observé

- **Temps de mise en place (mesuré) :** `npm install` ≈ 4 min 0 s (même coût de compilation native `better-sqlite3` que Drizzle). `npm start` ≈ 2,6 s.
- **Lignes de code :** 44 (13 pour l'entité dans `src/entity.ts`, 31 pour le script dans `src/index.ts`).
- **Facilité :** les entités à base de décorateurs (`@Entity`, `@PrimaryGeneratedColumn`, `@Column`) se lisent proche des autres frameworks backend utilisés dans ce projet (style NestJS), ce qui réduit la courbe d'apprentissage si l'équipe connaît déjà les décorateurs. Il a fallu `experimentalDecorators` + `emitDecoratorMetadata` dans `tsconfig.json` et un `import "reflect-metadata"` explicite au point d'entrée - de la plomberie invisible qui doit être correcte sinon rien ne marche, et le mode d'échec (une erreur de réflexion cryptique) est moins évident qu'une étape de génération manquante.
- **Points faibles observés :** `synchronize: true` (utilisé ici pour garder le POC à une seule commande) est explicitement documenté par TypeORM comme dangereux en production - ça peut supprimer/modifier des colonnes silencieusement lors de changements de schéma. Un vrai projet a besoin de la CLI de migration séparée de TypeORM, ce qui réintroduit une étape en plus, similaire au `generate`/`db push` de Prisma.
