# POC - NestJS

[English](#english) · [Français](#français)

---

<a id="english"></a>

## English

### Run it

```bash
npm install
npm start
# GET http://localhost:4103/widgets
```

3 files (`main.ts`, `app.module.ts`, `widgets.controller.ts`) - **hand-assembled**, not scaffolded with `nest new`.

### A deliberate setup choice

We installed only `@nestjs/core @nestjs/common @nestjs/platform-express reflect-metadata rxjs` plus `typescript`/`ts-node` as dev dependencies, instead of running the full `nest new` CLI scaffold. `nest new` also generates a test suite, ESLint/Prettier config, a `nest-cli.json`, `.spec.ts` files, etc. - useful for a real project, but it would have inflated both the install and the line count for what is meant to be a minimal, comparable POC. This is itself part of the "ease of use" comparison: Nest expects you to go through its CLI; assembling it by hand means manually wiring the module/controller/bootstrap trio that the CLI would generate for you.

### What we observed

- **Setup time (measured, install → verified `curl` response):** ~2 min - clearly the slowest of the three. Breakdown: heavier dependency tree (DI container, decorators, Express adapter under the hood) plus **one real blocker**: the default `npm install -D typescript` resolved to `typescript@7.0.2` (a very recent major), which broke `ts-node` outright (`TypeError: Cannot read properties of undefined (reading 'fileExists')` - `ts-node`'s internal API assumes the TS 5.x `ts.sys` shape). Had to pin `typescript@5.7.3` explicitly to get it running.
- **Lines of code:** 35 across 3 files, for the exact same single route the other two POCs implement in 18 lines in one file - the decorator/module/DI boilerplate has a real, measurable cost even at this trivial scale.
- **Ease of use:** Once assembled, the code itself reads cleanly (`@Controller()` / `@Get("widgets")` is arguably more declarative than `app.get(...)`), but getting there requires understanding Nest's module system (`@Module({ controllers: [...] })`) and bootstrap (`NestFactory.create`) - there's a real conceptual floor before "hello world" works, unlike Express/Fastify.
- **Weaknesses observed:** Slowest install, most boilerplate for a trivial route, and a live dependency-compatibility trap (`typescript@7` vs `ts-node`) that Express/Fastify never exposed since they don't need a TS build step to run this POC at all.

---

<a id="français"></a>

## Français

### Lancer

```bash
npm install
npm start
# GET http://localhost:4103/widgets
```

3 fichiers (`main.ts`, `app.module.ts`, `widgets.controller.ts`) - **montés à la main**, pas générés avec `nest new`.

### Un choix de mise en place assumé

On a installé uniquement `@nestjs/core @nestjs/common @nestjs/platform-express reflect-metadata rxjs` plus `typescript`/`ts-node` en dev dependencies, plutôt que de lancer le scaffold complet `nest new`. `nest new` génère aussi une suite de tests, une config ESLint/Prettier, un `nest-cli.json`, des fichiers `.spec.ts`, etc. - utile pour un vrai projet, mais ça aurait gonflé l'install et le nombre de lignes pour ce qui doit rester un POC minimal et comparable. Ça fait partie en soi de la comparaison "facilité" : Nest s'attend à ce qu'on passe par sa CLI ; le monter à la main veut dire câbler soi-même le trio module/contrôleur/bootstrap que la CLI aurait généré.

### Ce qu'on a observé

- **Temps de mise en place (mesuré, install → réponse `curl` vérifiée) :** ~2 min - clairement le plus lent des trois. Détail : arbre de dépendances plus lourd (conteneur DI, décorateurs, adaptateur Express en dessous) plus **un vrai blocage** : le `npm install -D typescript` par défaut a résolu vers `typescript@7.0.2` (une version majeure très récente), qui a cassé `ts-node` net (`TypeError: Cannot read properties of undefined (reading 'fileExists')` - l'API interne de `ts-node` suppose la forme `ts.sys` de TS 5.x). Il a fallu épingler `typescript@5.7.3` explicitement pour que ça tourne.
- **Lignes de code :** 35 réparties sur 3 fichiers, pour exactement la même route unique que les deux autres POC implémentent en 18 lignes dans un seul fichier - le boilerplate décorateurs/module/DI a un coût réel et mesurable même à cette échelle triviale.
- **Facilité :** Une fois monté, le code lui-même se lit proprement (`@Controller()` / `@Get("widgets")` est presque plus déclaratif que `app.get(...)`), mais y arriver demande de comprendre le système de modules de Nest (`@Module({ controllers: [...] })`) et le bootstrap (`NestFactory.create`) - il y a un vrai plancher conceptuel avant le "hello world", contrairement à Express/Fastify.
- **Points faibles observés :** Install la plus lente, le plus de boilerplate pour une route triviale, et un piège de compatibilité de dépendances rencontré en direct (`typescript@7` vs `ts-node`) qu'Express/Fastify n'ont jamais exposé puisqu'ils n'ont besoin d'aucune étape de build TS pour faire tourner ce POC.
