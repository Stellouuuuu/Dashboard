# Tech choices / Choix techniques

← [Back to README](../README.md) · [Retour au README](../README.md)

[English](#english) · [Français](#français)

---

<a id="english"></a>

## English

Based on hands-on POCs (`bonus/poc/`) - each one built to do the exact same minimal task across 3 technologies, actually run, and verified (curl/build/console output). Setup time and LOC are measured, not estimated; "Performance" was not load-tested (out of scope for a same-day POC) and is called out as such rather than invented. Two POCs (MySQL, Caddy, Traefik) could not be executed in this environment - no outbound Docker Hub access for images not already cached locally - their code is written and reviewed, but unverified; this is flagged explicitly below.

### Frontend framework

- **Decision: React** (already the frontend of this project).
- Alternatives considered: Vue, Angular - POCs at [`bonus/poc/frontend/`](../bonus/poc/frontend/).
- Why: lowest setup friction of the three that were actually measured, largest ecosystem/hiring pool, and it's what the team had already built the real dashboard with before this comparison was written up - switching now had no upside big enough to justify a rewrite.

| | React | Vue | Angular |
| --- | --- | --- | --- |
| Setup time (measured, scaffold → verified dev server) | ~123s | ~102s (fastest) | ~327s (slowest - see below) |
| LOC (same weather-widget screen) | 215 | 105 (leanest) | 92 (leanest, but boilerplate is hidden in the CLI-generated shell, not absent) |
| Learning curve | JSX mixes markup/logic in one file - familiar fast, easy to write inconsistently at scale | Template syntax is Vue-specific but reads close to plain HTML - gentle | Steepest: modules, decorators, DI, CLI conventions to learn before writing a line of business logic |
| Performance | Not benchmarked by the POC (no load test) | Not benchmarked | Not benchmarked |
| Ecosystem | Largest (libraries, Stack Overflow answers, hiring) | Smaller than React, still healthy, strong official tooling (Pinia, Vue Router) | Full "batteries-included" framework, but a smaller and more opinionated ecosystem |
| Project fit | Matches the existing codebase exactly | Would mean a full rewrite of the real app for no functional gain | Would also mean a full rewrite; its DI/module ceremony buys nothing for a project this size |

Notable finding from the Angular POC: the latest Angular CLI (22.x) refused to start on this machine's Node version (22.22.1; it requires ≥22.22.3) - had to pin `@angular/cli@19`. That's a real-world "it depends on your Node version" cost the other two frameworks didn't have.

### Backend runtime & framework

- **Decision: Express** (already the backend of this project, running on Node.js).
- Alternatives considered: Fastify, NestJS - POCs at [`bonus/poc/backend/`](../bonus/poc/backend/).
- Why: for a REST API this size (a dozen routes, no heavy JSON-schema validation on the hot path), Express's near-zero ceremony matched Fastify's on setup time, and NestJS's module/DI structure is overhead this project's scope doesn't need. Express is also what the real backend was already built with.

| | Express | Fastify | NestJS |
| --- | --- | --- | --- |
| Setup time (measured, install → verified `GET /widgets`) | ~35s | ~55s | ~2min (slowest - see below) |
| LOC (same single route) | 18 | 18 (identical shape to Express) | 35 across 3 files (module/controller/bootstrap ceremony, even hand-assembled without the full CLI scaffold) |
| Learning curve | Minimal - one function, one route | Minimal, same shape as Express; its real differentiator (schema-based validation/serialization) isn't exercised by a route this trivial | Real conceptual floor before anything runs: modules, controllers, dependency injection, decorators |
| Performance | Not benchmarked (Fastify's main pitch is throughput, but this POC didn't load-test it) | Not benchmarked | Not benchmarked |
| Ecosystem | Largest of the three, most middleware available | Smaller, growing, official plugin ecosystem | Large but opinionated - most third-party code expects the Nest module system |
| Project fit | Already the real stack - zero migration cost | No measured benefit at this project's scale to justify a switch | Structure would help on a much bigger API surface; overkill for ~30 routes |

Notable finding from the NestJS POC: the default `npm install -D typescript` resolved `typescript@7.0.2`, which broke `ts-node` (`Cannot read properties of undefined (reading 'fileExists')`) - had to pin `typescript@5.7.3`. Express and Fastify hit no equivalent dependency trap.

### Database & ORM

- **Decision: PostgreSQL + Drizzle ORM** (already the stack of this project).
- Alternatives considered - database engine: MySQL, MongoDB; ORM: Prisma, TypeORM - POCs at [`bonus/poc/database/`](../bonus/poc/database/) and [`bonus/poc/orm/`](../bonus/poc/orm/).
- Why: the data is fully relational (users, widget instances, cache rows, audit log, all with foreign keys) - no document-shaped data that would justify MongoDB's schema flexibility. Postgres over MySQL was already the working assumption going in; the POC didn't surface a reason to revisit it (see honesty note below). Drizzle over Prisma/TypeORM: its query builder is closest to raw SQL (least "magic" to debug under deadline pressure) and its SQLite POC needed no extra generation step beyond `npm install && npm start`, unlike Prisma.

**Database engine:**

| | PostgreSQL | MySQL | MongoDB |
| --- | --- | --- | --- |
| Setup time (measured) | ~5s (image already cached locally) | **not measured** - no mysql/mariadb image available in this sandbox (no Docker Hub egress for uncached images) | ~24s (`mongo:6.0.5` pinned and cached; `mongo:7` wasn't available) |
| LOC (compose + store/read-back script) | 87 | 89 (written, not run) | 79 |
| Learning curve | SQL + `pg` driver - standard | Same shape as Postgres with `mysql2` - standard | Different mental model (documents, no joins) for a project that has none of that shape of data |
| Performance | Not benchmarked | Not benchmarked / not run at all | Not benchmarked |
| Ecosystem | Very large, mature Docker image, Drizzle/Prisma/TypeORM all first-class | Equally large ecosystem, but nothing project-specific favors it over Postgres | Large ecosystem but oriented around a data shape (documents) this project doesn't have |
| Project fit | Matches relational schema (FKs everywhere: `users` ↔ `widget_instances` ↔ `widget_cache` ↔ `audit_logs`) | Would fit the same relational schema equally well - no functional reason to switch | Would need denormalizing the relational schema for no benefit |

**Honesty note:** MySQL's POC could not actually be executed in this sandbox (Docker Hub pull timed out, no cached image) - its comparison row above is based on the code written, not on an observed run. This means the Postgres-vs-MySQL decision documented here was **not** empirically re-validated by this POC round; it rests on the existing schema design (already using Postgres-specific Drizzle types) plus general knowledge, not on a fresh side-by-side run of both. Worth actually running the MySQL POC on a machine with normal Docker Hub access before citing this table as hard evidence at the defense.

**ORM (all 3 tested against local SQLite, one `npm` command):**

| | Drizzle | Prisma | TypeORM |
| --- | --- | --- | --- |
| Setup time (measured, install → verified store+read console output) | ~4m9s (native `better-sqlite3` compile) | ~1m0s (fastest - precompiled query engine, no native build) | ~4m0s (same native compile cost as Drizzle) |
| LOC (schema + script) | 34 (schema 7 + script 27) - leanest | 27 (schema 14 + script 13) | 44 (entity 13 + script 31) |
| Learning curve | Plain TypeScript, no code generation step, no decorators | Clean, well-typed DSL, but requires a mandatory `prisma generate` step - a classic footgun if forgotten after a pull | Decorator-based (familiar if coming from NestJS), but relies on `synchronize: true` to stay a one-command POC - TypeORM's own docs explicitly discourage that in production |
| Performance | Not benchmarked | Not benchmarked | Not benchmarked |
| Ecosystem | Smaller but growing fast, good Postgres-specific type support (already used in the real backend) | Largest ORM ecosystem/tooling (Prisma Studio, etc.) | Long-established, very common in NestJS projects |
| Project fit | Already the real backend's ORM - zero migration cost, and its SQL-closeness matched how the team already reasons about queries | Extra generate step adds a CI/deploy footgun this project doesn't need | Decorator/`synchronize` model doesn't match the project's existing migration-based Drizzle workflow |

### Auth model (cookies vs bearer tokens)

- **Decision: httpOnly cookies** (`access_token` JWT, 15 min; `refresh_token` opaque random token, 30 days, hashed in DB, revocable) - no POC for this one, it's a real, already-shipped code decision (`backend/src/modules/auth/auth.service.ts`, `backend/src/middleware/auth.middleware.ts`).
- Alternative considered and actually tried first, then dropped: **bearer token in `localStorage`**, used in the early frontend prototype (see `PLAN.md` §2, row "Authentification | Identifiants ou OIDC | localStorage") before the real auth flow was built.
- Why dropped: a token in `localStorage` is readable by any JavaScript running on the page - one XSS bug anywhere in the app (including a third-party widget-rendering path) leaks every session, with no `HttpOnly` boundary to stop it. httpOnly cookies aren't readable from JS at all, closing that entire class of bug.
- A real trap hit while implementing cookies (`PLAN.md` §10, trap 3): `SameSite=Strict` cookies aren't sent back by the browser on the redirect from `github.com` during OAuth - the callback couldn't tell who was linking their account. Switched to `SameSite=Lax`, which still blocks cross-site POST/CSRF but allows the top-level GET navigation a GitHub OAuth redirect actually is.
- Split TTL (15 min access / 30 days refresh, refresh stored hashed and revocable) instead of one long-lived token: limits the blast radius of a leaked access token to 15 minutes, while `logout` / account deletion can actually kill a session server-side (impossible with a stateless long-lived JWT alone).

### Widget refresh strategy (client timer + server cache)

- **Decision: client-side timer + server-side cache**, minimum refresh rate enforced server-side at 30s (`backend/src/config/constants.ts:REFRESH_RATE_MIN`, `frontend/src/dashboard/useWidgetRefresh.ts` + `TimerRing.tsx`) - real, shipped code, no POC.
- Alternative considered and explicitly dismissed (`PLAN.md` §1: "Pas de worker BullMQ ni de Redis avant le 01/10", also listed as a bonus candidate in `bonus/README.md`): a **background job queue (BullMQ + Redis)** proactively refreshing every widget instance on a schedule, independent of whether a user has the dashboard open.
- Why the simpler approach: the client timer + cache means the server only ever does work when someone is actually looking at a widget (`GET /dashboard/widgets/:id/data` checks the cached row's age and only calls the adapter on a stale/miss). A BullMQ worker would refresh widgets nobody is currently viewing - extra load on the third-party APIs (several of which are rate-limited, e.g. GitHub at 60 req/h unauthenticated) for zero user-visible benefit, plus a whole extra piece of infrastructure (Redis) to run, monitor, and explain at the defense.
- Two other alternatives, dismissed without needing a written trap for it: pure client-side polling with **no server cache** (every refresh re-hits the third-party API even if two instances share the same config - wasteful and defeats the per-instance cache the subject implicitly rewards); and **WebSocket/SSE push** from server to client (would need the server to already know when fresh data exists, which still requires *something* to trigger the fetch server-side - doesn't remove the scheduling problem, just moves it, for a project with no requirement for sub-second freshness).

### Hosting / Docker layout

- **Decision: nginx** as the single public-facing reverse proxy in front of the API, serving the built SPA (`docker-compose.yml`, `nginx/nginx.conf`) - already the real stack.
- Alternatives considered: Caddy, Traefik - POCs at [`bonus/poc/proxy/`](../bonus/poc/proxy/).
- Why: nginx is the only one of the three actually verified end-to-end in this environment (static file + `/api/*` proxy, curl-confirmed on both routes); it's also what the project's `PLAN.md` §10 traps (exact-match `/about.json` location before the SPA catch-all, `trust proxy` for `client.host`) were already solved against - switching proxies now would mean re-solving already-solved problems for no functional gain.

| | nginx | Caddy | Traefik |
| --- | --- | --- | --- |
| Setup time (measured) | ~28s build, fully verified (`curl /` → HTML, `curl /api/widgets` → proxied JSON) | **not run** - 3× failed `docker pull caddy:alpine` (no Docker Hub egress for uncached images in this sandbox) | **not run** - same `traefik:v3.1` pull failure, same root cause |
| LOC (proxy config + compose) | 26 (`nginx.conf` 13 + compose 13) | 24 (`Caddyfile` 11 + compose 13) - written and reviewed, not executed | 31, all in compose (no dedicated config file - routing declared via Docker labels; Traefik has no built-in static file serving, so the POC needed a 3rd container just to serve `index.html`) |
| Learning curve | `location` blocks - verbose but explicit and exactly what the real project already uses | Reads the cleanest of the three (`handle /api/*` reverse-proxy block reads almost like English) | Steepest - routing logic lives in Docker labels/YAML instead of a proxy config file, an extra indirection to reason about |
| Performance | Not benchmarked | Not benchmarked (and not even run) | Not benchmarked (and not even run) |
| Ecosystem | Largest, most documented, what the team already has traps solved for | Smaller but modern (automatic HTTPS is Caddy's main selling point - irrelevant behind this project's own TLS-terminating setup) | Built for dynamic container orchestration (many services appearing/disappearing) - more capability than a 2-container app needs |
| Project fit | Zero migration cost, all existing `nginx.conf` traps already solved | Would require re-solving the exact-match `/about.json` trap in Caddy's syntax for no functional gain | Same re-solving cost, plus the extra static-file container this POC needed just to match nginx's behavior |

**Honesty note:** Caddy and Traefik could not actually be started in this sandbox (Docker Hub image pulls time out here for anything not already cached - nginx's image is cached because the real app already uses it, Caddy's and Traefik's aren't). Their rows above reflect code that was written and reviewed for correctness, not an observed run. Re-run both on a machine with normal internet access before treating this as a fully closed comparison.

### i18n

- **Decision: react-i18next** (+ `i18next-browser-languagedetector`) - real, shipped code (`frontend/src/i18n/locales/{fr,en}.json`), no POC.
- Alternatives considered: `react-intl` (FormatJS), LinguiJS, and a hand-rolled `React.Context` + plain JSON dictionary.
- Why: react-i18next already bundles namespace-based key lookup, interpolation, and pluralization without a build-time extraction/compile step (unlike LinguiJS, which needs one), and `i18next-browser-languagedetector` gave automatic browser-language detection for free - useful since the app also persists an explicit per-account language preference (`users.language`, `PATCH /api/v1/auth/language`) that has to *override* the detector, which the library's plugin order supports directly. `react-intl`'s ICU-message-focused API is solid for pluralization/dates but has a more rigid namespace/lazy-loading story than i18next for a two-language app this size. A hand-rolled context+JSON approach would have reinvented detection, interpolation, and fallback-language handling that i18next already provides - not worth it for two languages, but would become the wrong call to keep hand-rolling if a third language were ever added.

---

## What each of us already knew

*To be completed by us.*

| Technology | Member A - already knew? | Member B - already knew? |
| --- | --- | --- |
| React | To be completed by us | To be completed by us |
| Vue | To be completed by us | To be completed by us |
| Angular | To be completed by us | To be completed by us |
| Express | To be completed by us | To be completed by us |
| Fastify | To be completed by us | To be completed by us |
| NestJS | To be completed by us | To be completed by us |
| PostgreSQL | To be completed by us | To be completed by us |
| MySQL | To be completed by us | To be completed by us |
| MongoDB | To be completed by us | To be completed by us |
| Drizzle | To be completed by us | To be completed by us |
| Prisma | To be completed by us | To be completed by us |
| TypeORM | To be completed by us | To be completed by us |
| nginx | To be completed by us | To be completed by us |
| Caddy | To be completed by us | To be completed by us |
| Traefik | To be completed by us | To be completed by us |
| JWT / cookie auth | To be completed by us | To be completed by us |
| Docker / docker-compose | To be completed by us | To be completed by us |
| i18next | To be completed by us | To be completed by us |

---

<a id="français"></a>

## Français

Basé sur des POC concrets (`bonus/poc/`) - chacun construit pour faire exactement la même tâche minimale sur 3 technologies, réellement lancé, et vérifié (curl/build/sortie console). Les temps de mise en place et les lignes de code sont mesurés, pas estimés ; la "performance" n'a pas été testée en charge (hors périmètre pour des POC réalisés en une journée) et c'est signalé comme tel plutôt qu'inventé. Deux POC (MySQL, Caddy, Traefik) n'ont pas pu être exécutés dans cet environnement - pas d'accès sortant vers Docker Hub pour les images non déjà en cache localement - leur code est écrit et relu, mais non vérifié ; c'est signalé explicitement ci-dessous.

### Framework frontend

- **Décision : React** (déjà le frontend de ce projet).
- Alternatives envisagées : Vue, Angular - POC dans [`bonus/poc/frontend/`](../bonus/poc/frontend/).
- Pourquoi : la friction de mise en place la plus faible des trois réellement mesurées, le plus grand écosystème/bassin de recrutement, et c'est déjà ce avec quoi l'équipe avait construit le vrai dashboard avant que cette comparaison ne soit rédigée - en changer maintenant n'apportait aucun bénéfice suffisant pour justifier une réécriture.

| | React | Vue | Angular |
| --- | --- | --- | --- |
| Temps de mise en place (mesuré, scaffold → dev server vérifié) | ~123s | ~102s (le plus rapide) | ~327s (le plus lent - voir ci-dessous) |
| LOC (même écran widget météo) | 215 | 105 (le plus concis) | 92 (le plus concis, mais le boilerplate est caché dans le shell généré par le CLI, pas absent) |
| Courbe d'apprentissage | JSX mélange markup/logique dans un seul fichier - pris en main vite, facile à écrire de façon incohérente à grande échelle | Syntaxe de template spécifique à Vue mais proche du HTML classique - douce | La plus raide : modules, décorateurs, DI, conventions du CLI à apprendre avant d'écrire la moindre logique métier |
| Performance | Non testée par le POC (pas de test de charge) | Non testée | Non testée |
| Écosystème | Le plus grand (librairies, réponses Stack Overflow, recrutement) | Plus petit que React, toujours sain, tooling officiel solide (Pinia, Vue Router) | Framework "tout inclus", mais écosystème plus petit et plus prescriptif |
| Adéquation au projet | Correspond exactement au code existant | Impliquerait une réécriture complète de la vraie app pour aucun gain fonctionnel | Impliquerait aussi une réécriture complète ; sa cérémonie DI/modules n'apporte rien pour un projet de cette taille |

Constat notable du POC Angular : le CLI Angular le plus récent (22.x) a refusé de démarrer sur la version Node de cette machine (22.22.1 ; il exige ≥22.22.3) - a fallu épingler `@angular/cli@19`. Un vrai coût "ça dépend de ta version Node" que les deux autres frameworks n'ont pas eu.

### Runtime & framework backend

- **Décision : Express** (déjà le backend de ce projet, sur Node.js).
- Alternatives envisagées : Fastify, NestJS - POC dans [`bonus/poc/backend/`](../bonus/poc/backend/).
- Pourquoi : pour une API REST de cette taille (une douzaine de routes, pas de validation JSON-schema lourde sur le chemin critique), la cérémonie quasi nulle d'Express a égalé celle de Fastify en temps de mise en place, et la structure modules/DI de NestJS est un surcoût dont le périmètre de ce projet n'a pas besoin. Express est aussi ce avec quoi le vrai backend était déjà construit.

| | Express | Fastify | NestJS |
| --- | --- | --- | --- |
| Temps de mise en place (mesuré, install → `GET /widgets` vérifié) | ~35s | ~55s | ~2min (le plus lent - voir ci-dessous) |
| LOC (même route unique) | 18 | 18 (forme identique à Express) | 35 répartis sur 3 fichiers (cérémonie module/contrôleur/bootstrap, même montée à la main sans le scaffold CLI complet) |
| Courbe d'apprentissage | Minimale - une fonction, une route | Minimale, même forme qu'Express ; son vrai différenciateur (validation/sérialisation par schéma) n'est pas sollicité par une route aussi triviale | Vrai socle conceptuel avant que quoi que ce soit tourne : modules, contrôleurs, injection de dépendances, décorateurs |
| Performance | Non testée (l'argument principal de Fastify est le débit, mais ce POC ne l'a pas testé en charge) | Non testée | Non testée |
| Écosystème | Le plus grand des trois, le plus de middlewares disponibles | Plus petit, en croissance, écosystème de plugins officiel | Grand mais prescriptif - la plupart du code tiers suppose le système de modules Nest |
| Adéquation au projet | Déjà la vraie stack - coût de migration nul | Aucun bénéfice mesuré à l'échelle de ce projet pour justifier un changement | La structure aiderait sur une surface d'API bien plus grande ; surdimensionné pour ~30 routes |

Constat notable du POC NestJS : le `npm install -D typescript` par défaut a résolu `typescript@7.0.2`, ce qui a cassé `ts-node` (`Cannot read properties of undefined (reading 'fileExists')`) - il a fallu épingler `typescript@5.7.3`. Express et Fastify n'ont rencontré aucun piège de dépendance équivalent.

### Base de données & ORM

- **Décision : PostgreSQL + ORM Drizzle** (déjà la stack de ce projet).
- Alternatives envisagées - moteur de base de données : MySQL, MongoDB ; ORM : Prisma, TypeORM - POC dans [`bonus/poc/database/`](../bonus/poc/database/) et [`bonus/poc/orm/`](../bonus/poc/orm/).
- Pourquoi : les données sont entièrement relationnelles (users, instances de widgets, lignes de cache, journal d'audit, toutes avec des clés étrangères) - aucune donnée en forme de document qui justifierait la flexibilité de schéma de MongoDB. Postgres plutôt que MySQL était déjà l'hypothèse de travail au départ ; le POC n'a pas fait remonter de raison de la revoir (voir la note d'honnêteté ci-dessous). Drizzle plutôt que Prisma/TypeORM : son query builder est le plus proche du SQL brut (le moins de "magie" à déboguer sous pression), et son POC SQLite n'a nécessité aucune étape de génération supplémentaire au-delà de `npm install && npm start`, contrairement à Prisma.

**Moteur de base de données :**

| | PostgreSQL | MySQL | MongoDB |
| --- | --- | --- | --- |
| Temps de mise en place (mesuré) | ~5s (image déjà en cache local) | **non mesuré** - aucune image mysql/mariadb disponible dans ce sandbox (pas d'accès Docker Hub pour les images non en cache) | ~24s (`mongo:6.0.5` épinglé et en cache ; `mongo:7` indisponible) |
| LOC (compose + script store/relecture) | 87 | 89 (écrit, non exécuté) | 79 |
| Courbe d'apprentissage | SQL + driver `pg` - standard | Même forme que Postgres avec `mysql2` - standard | Modèle mental différent (documents, pas de jointures) pour un projet qui n'a aucune donnée de cette forme |
| Performance | Non testée | Non testée / pas exécutée du tout | Non testée |
| Écosystème | Très grand, image Docker mature, Drizzle/Prisma/TypeORM tous de premier ordre | Écosystème tout aussi grand, mais rien de spécifique au projet ne le favorise par rapport à Postgres | Grand écosystème mais orienté vers une forme de donnée (documents) que ce projet n'a pas |
| Adéquation au projet | Correspond au schéma relationnel (FK partout : `users` ↔ `widget_instances` ↔ `widget_cache` ↔ `audit_logs`) | Conviendrait tout aussi bien au même schéma relationnel - aucune raison fonctionnelle de changer | Nécessiterait de dénormaliser le schéma relationnel pour aucun bénéfice |

**Note d'honnêteté :** le POC MySQL n'a pas pu être réellement exécuté dans ce sandbox (le pull Docker Hub a expiré, aucune image en cache) - sa ligne dans le tableau ci-dessus repose sur le code écrit, pas sur une exécution observée. Ça signifie que la décision Postgres-vs-MySQL documentée ici n'a **pas** été revalidée empiriquement par cette session de POC ; elle repose sur le design du schéma existant (utilisant déjà des types Drizzle spécifiques à Postgres) et sur la connaissance générale, pas sur une comparaison fraîche des deux moteurs côte à côte. À relancer réellement sur une machine avec un accès Docker Hub normal avant de citer ce tableau comme preuve dure en soutenance.

**ORM (les 3 testés contre SQLite local, une seule commande `npm`) :**

| | Drizzle | Prisma | TypeORM |
| --- | --- | --- | --- |
| Temps de mise en place (mesuré, install → sortie console store+relecture vérifiée) | ~4min9 (compilation native de `better-sqlite3`) | ~1min (le plus rapide - moteur de requête précompilé, pas de build natif) | ~4min (même coût de compilation native que Drizzle) |
| LOC (schéma + script) | 34 (schéma 7 + script 27) - le plus concis | 27 (schéma 14 + script 13) | 44 (entité 13 + script 31) |
| Courbe d'apprentissage | TypeScript pur, aucune étape de génération de code, aucun décorateur | DSL propre et bien typé, mais exige une étape `prisma generate` obligatoire - piège classique si oubliée après un pull | Basé sur des décorateurs (familier si on vient de NestJS), mais repose sur `synchronize: true` pour rester un POC en une commande - la doc de TypeORM elle-même déconseille explicitement ça en production |
| Performance | Non testée | Non testée | Non testée |
| Écosystème | Plus petit mais en forte croissance, bon support des types spécifiques à Postgres (déjà utilisé dans le vrai backend) | Le plus grand écosystème/tooling d'ORM (Prisma Studio, etc.) | Bien établi, très courant dans les projets NestJS |
| Adéquation au projet | Déjà l'ORM du vrai backend - coût de migration nul, et sa proximité avec le SQL correspond à la façon dont l'équipe raisonne déjà sur les requêtes | L'étape de génération en plus ajoute un piège CI/déploiement dont ce projet n'a pas besoin | Le modèle décorateurs/`synchronize` ne correspond pas au workflow existant du projet basé sur les migrations Drizzle |

### Modèle d'auth (cookies vs tokens bearer)

- **Décision : cookies httpOnly** (`access_token` JWT, 15 min ; `refresh_token` token aléatoire opaque, 30 jours, haché en base, révocable) - pas de POC ici, c'est une vraie décision de code déjà livrée (`backend/src/modules/auth/auth.service.ts`, `backend/src/middleware/auth.middleware.ts`).
- Alternative envisagée et réellement essayée en premier, puis abandonnée : **token bearer dans `localStorage`**, utilisé dans le prototype frontend initial (voir `PLAN.md` §2, ligne "Authentification | Identifiants ou OIDC | localStorage") avant que le vrai flux d'auth ne soit construit.
- Pourquoi abandonné : un token dans `localStorage` est lisible par n'importe quel JavaScript tournant sur la page - un seul bug XSS n'importe où dans l'app (y compris dans un chemin de rendu d'un widget tiers) fuite toutes les sessions, sans barrière `HttpOnly` pour l'arrêter. Les cookies httpOnly ne sont pas du tout lisibles depuis JS, ce qui ferme toute cette classe de bug.
- Un vrai piège rencontré en implémentant les cookies (`PLAN.md` §10, piège 3) : les cookies `SameSite=Strict` ne sont pas renvoyés par le navigateur sur la redirection depuis `github.com` pendant l'OAuth - le callback ne pouvait plus savoir qui liait son compte. Passage à `SameSite=Lax`, qui bloque toujours le POST/CSRF cross-site mais autorise la navigation GET de premier niveau qu'est réellement une redirection OAuth GitHub.
- TTL scindé (15 min access / 30 jours refresh, refresh stocké haché et révocable) plutôt qu'un seul token longue durée : limite le rayon d'impact d'un access token fuité à 15 minutes, tandis que `logout` / la suppression de compte peuvent réellement tuer une session côté serveur (impossible avec un seul JWT longue durée stateless).

### Stratégie de rafraîchissement des widgets (timer client + cache serveur)

- **Décision : timer côté client + cache côté serveur**, refresh rate minimum imposé côté serveur à 30s (`backend/src/config/constants.ts:REFRESH_RATE_MIN`, `frontend/src/dashboard/useWidgetRefresh.ts` + `TimerRing.tsx`) - vrai code livré, pas de POC.
- Alternative envisagée et explicitement écartée (`PLAN.md` §1 : "Pas de worker BullMQ ni de Redis avant le 01/10", également listée comme candidate bonus dans `bonus/README.md`) : une **file de jobs en arrière-plan (BullMQ + Redis)** rafraîchissant proactivement chaque instance de widget selon un planning, indépendamment du fait qu'un utilisateur ait le dashboard ouvert ou non.
- Pourquoi l'approche plus simple : le timer client + cache signifie que le serveur ne travaille que quand quelqu'un regarde réellement un widget (`GET /dashboard/widgets/:id/data` vérifie l'âge de la ligne en cache et n'appelle l'adaptateur que sur un miss/périmé). Un worker BullMQ rafraîchirait des widgets que personne ne regarde actuellement - charge supplémentaire sur des API tierces dont plusieurs sont limitées en débit (ex : GitHub à 60 req/h sans authentification) pour aucun bénéfice visible côté utilisateur, plus toute une infrastructure supplémentaire (Redis) à faire tourner, superviser et expliquer en soutenance.
- Deux autres alternatives, écartées sans qu'il ait fallu un piège écrit pour ça : le polling pur côté client **sans cache serveur** (chaque rafraîchissement retape l'API tierce même si deux instances partagent la même config - gaspillage, et annule le cache par instance que le sujet valorise implicitement) ; et le **push WebSocket/SSE** du serveur vers le client (nécessiterait que le serveur sache déjà quand une donnée fraîche existe, ce qui exige toujours *quelque chose* pour déclencher le fetch côté serveur - ne supprime pas le problème de planification, le déplace juste, pour un projet qui n'a aucune exigence de fraîcheur à la seconde près).

### Hébergement / layout Docker

- **Décision : nginx** comme unique reverse proxy public devant l'API, servant la SPA buildée (`docker-compose.yml`, `nginx/nginx.conf`) - déjà la vraie stack.
- Alternatives envisagées : Caddy, Traefik - POC dans [`bonus/poc/proxy/`](../bonus/poc/proxy/).
- Pourquoi : nginx est le seul des trois réellement vérifié de bout en bout dans cet environnement (fichier statique + proxy `/api/*`, confirmé par curl sur les deux routes) ; c'est aussi celui pour lequel les pièges de `PLAN.md` §10 (location exacte `/about.json` avant le catch-all du SPA, `trust proxy` pour `client.host`) étaient déjà résolus - changer de proxy maintenant reviendrait à résoudre à nouveau des problèmes déjà résolus, pour aucun gain fonctionnel.

| | nginx | Caddy | Traefik |
| --- | --- | --- | --- |
| Temps de mise en place (mesuré) | ~28s de build, entièrement vérifié (`curl /` → HTML, `curl /api/widgets` → JSON proxifié) | **non exécuté** - 3 échecs de `docker pull caddy:alpine` (pas d'accès Docker Hub pour les images non en cache dans ce sandbox) | **non exécuté** - même échec de pull sur `traefik:v3.1`, même cause racine |
| LOC (config proxy + compose) | 26 (`nginx.conf` 13 + compose 13) | 24 (`Caddyfile` 11 + compose 13) - écrit et relu, non exécuté | 31, tout dans le compose (pas de fichier de config dédié - routage déclaré via labels Docker ; Traefik n'a pas de service de fichiers statiques intégré, donc le POC a eu besoin d'un 3e conteneur juste pour servir `index.html`) |
| Courbe d'apprentissage | Blocs `location` - verbeux mais explicite, exactement ce que le vrai projet utilise déjà | Se lit le plus proprement des trois (le bloc reverse-proxy `handle /api/*` se lit presque comme de l'anglais) | La plus raide - la logique de routage vit dans des labels Docker/YAML plutôt que dans un fichier de config proxy, une indirection en plus à comprendre |
| Performance | Non testée | Non testée (et même pas exécutée) | Non testée (et même pas exécutée) |
| Écosystème | Le plus grand, le plus documenté, celui pour lequel l'équipe a déjà résolu ses pièges | Plus petit mais moderne (le HTTPS automatique est l'argument principal de Caddy - non pertinent derrière la terminaison TLS déjà en place de ce projet) | Construit pour l'orchestration dynamique de conteneurs (beaucoup de services qui apparaissent/disparaissent) - plus de capacité qu'une app à 2 conteneurs n'en a besoin |
| Adéquation au projet | Coût de migration nul, tous les pièges du `nginx.conf` existant déjà résolus | Nécessiterait de résoudre à nouveau le piège de la location exacte `/about.json` dans la syntaxe de Caddy, pour aucun gain fonctionnel | Même coût de résolution, plus le conteneur de fichiers statiques supplémentaire que ce POC a dû ajouter pour égaler le comportement de nginx |

**Note d'honnêteté :** Caddy et Traefik n'ont pas pu être réellement démarrés dans ce sandbox (les pulls d'images Docker Hub expirent ici pour tout ce qui n'est pas déjà en cache - l'image nginx est en cache car la vraie app l'utilise déjà, celles de Caddy et Traefik non). Leurs lignes ci-dessus reflètent du code écrit et relu pour sa correction, pas une exécution observée. À relancer tous les deux sur une machine avec un accès internet normal avant de considérer cette comparaison comme définitivement close.

### i18n

- **Décision : react-i18next** (+ `i18next-browser-languagedetector`) - vrai code livré (`frontend/src/i18n/locales/{fr,en}.json`), pas de POC.
- Alternatives envisagées : `react-intl` (FormatJS), LinguiJS, et un `React.Context` fait main + dictionnaire JSON brut.
- Pourquoi : react-i18next embarque déjà la recherche de clés par namespace, l'interpolation et la pluralisation sans étape de build/extraction préalable (contrairement à LinguiJS, qui en exige une), et `i18next-browser-languagedetector` a donné la détection automatique de la langue du navigateur gratuitement - utile puisque l'app persiste aussi une préférence de langue explicite par compte (`users.language`, `PATCH /api/v1/auth/language`) qui doit *surclasser* le détecteur, ce que l'ordre des plugins de la librairie permet directement. L'API de `react-intl`, centrée sur les messages ICU, est solide pour la pluralisation/les dates mais a une gestion des namespaces/du lazy-loading plus rigide qu'i18next pour une app à deux langues de cette taille. Une approche context + JSON fait main aurait réinventé la détection, l'interpolation et la gestion des langues de repli qu'i18next fournit déjà - pas rentable pour deux langues, mais deviendrait le mauvais choix de continuer à faire à la main si une troisième langue était un jour ajoutée.

---

## Ce que chacun savait déjà

*À compléter par nous.*

| Technologie | Membre A - savait déjà ? | Membre B - savait déjà ? |
| --- | --- | --- |
| React | À compléter par nous | À compléter par nous |
| Vue | À compléter par nous | À compléter par nous |
| Angular | À compléter par nous | À compléter par nous |
| Express | À compléter par nous | À compléter par nous |
| Fastify | À compléter par nous | À compléter par nous |
| NestJS | À compléter par nous | À compléter par nous |
| PostgreSQL | À compléter par nous | À compléter par nous |
| MySQL | À compléter par nous | À compléter par nous |
| MongoDB | À compléter par nous | À compléter par nous |
| Drizzle | À compléter par nous | À compléter par nous |
| Prisma | À compléter par nous | À compléter par nous |
| TypeORM | À compléter par nous | À compléter par nous |
| nginx | À compléter par nous | À compléter par nous |
| Caddy | À compléter par nous | À compléter par nous |
| Traefik | À compléter par nous | À compléter par nous |
| JWT / auth par cookie | À compléter par nous | À compléter par nous |
| Docker / docker-compose | À compléter par nous | À compléter par nous |
| i18next | À compléter par nous | À compléter par nous |
