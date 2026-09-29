# Technology POCs / POC technologiques

[English](#english) · [Français](#français)

---

<a id="english"></a>

## English

Hands-on proofs of concept backing the comparisons in [`docs/TECH_CHOICES.md`](../../docs/TECH_CHOICES.md). Each POC in a given layer does the exact same minimal task across 3 technologies, so they're directly comparable. Every one was actually run and verified (curl / build / console output) - not just scaffolded - except where noted below. Setup time and LOC in each POC's own README are measured, not estimated; "performance" was never load-tested and is called out as such rather than invented.

**Status: 14/15 actually verified working.**

| Layer | Tech | Status | POC |
| --- | --- | --- | --- |
| Frontend | React | ✅ Verified | [`frontend/react/`](frontend/react/) |
| Frontend | Vue | ✅ Verified | [`frontend/vue/`](frontend/vue/) |
| Frontend | Angular | ✅ Verified | [`frontend/angular/`](frontend/angular/) |
| Backend | Express | ✅ Verified | [`backend/express/`](backend/express/) |
| Backend | Fastify | ✅ Verified | [`backend/fastify/`](backend/fastify/) |
| Backend | NestJS | ✅ Verified | [`backend/nestjs/`](backend/nestjs/) |
| Database | PostgreSQL | ✅ Verified | [`database/postgresql/`](database/postgresql/) |
| Database | MySQL | ✅ Verified | [`database/mysql/`](database/mysql/) |
| Database | MongoDB | ✅ Verified | [`database/mongodb/`](database/mongodb/) |
| ORM | Drizzle | ✅ Verified | [`orm/drizzle/`](orm/drizzle/) |
| ORM | Prisma | ✅ Verified | [`orm/prisma/`](orm/prisma/) |
| ORM | TypeORM | ✅ Verified | [`orm/typeorm/`](orm/typeorm/) |
| Proxy | nginx | ✅ Verified | [`proxy/nginx/`](proxy/nginx/) |
| Proxy | Caddy | ✅ Verified | [`proxy/caddy/`](proxy/caddy/) |
| Proxy | Traefik | ⚠️ Not working | [`proxy/traefik/`](proxy/traefik/) |

**The one that doesn't work - Traefik, and it's not an environment/network issue.** `traefik:v3.1` is cached locally and starts fine, but its Docker-provider client only ever negotiates API version `1.24`, which this machine's Docker Engine (`29.1.3`) rejects outright (`client version 1.24 is too old. Minimum supported API version is 1.44`) - so Traefik can never read the container labels it needs to build any route, and every request gets its own `404`. This is a known upstream bug, [traefik/traefik#12253](https://github.com/traefik/traefik/issues/12253): Docker Engine ≥29 dropped API 1.24 support, and only Traefik **v3.6.1+** negotiates around it. The commonly-documented `DOCKER_API_VERSION` environment-variable workaround was tried (confirmed to actually reach the container) and did not help on `v3.1` - expected, since the fix only shipped later. No newer Traefik image was available to test instead (no outbound registry access in this sandbox to pull one). See [`proxy/traefik/README.md`](proxy/traefik/README.md) for the full trace. **Action before the defense:** re-run this one POC with `traefik:v3.6.1` or newer on a machine with normal internet access.

### Ports used (nothing on 8080 - the real app already owns it)

| Layer | Tech | Port(s) |
| --- | --- | --- |
| Frontend | React / Vue / Angular | 5174 / 5175 / 4200 |
| Backend | Express / Fastify / NestJS | 4101 / 4102 / 4103 |
| Database | PostgreSQL / MySQL / MongoDB | 4201 / 4202 / 4203 (app's HTTP port only - the DB itself is never published to the host) |
| Proxy | nginx / Caddy / Traefik | 8081 / 8082 / 8083 |
| ORM | Drizzle / Prisma / TypeORM | none (local SQLite file, no server) |

### Running one yourself

Each POC is fully self-contained and launches in one command:

- Frontend / Backend / ORM: `cd bonus/poc/<layer>/<tech> && npm install && npm start` (or `npm run dev` for frontend - see each README).
- Database / Proxy: `cd bonus/poc/<layer>/<tech> && docker compose up -d --build`, then `docker compose down` (add `-v` for database POCs, to also drop the volume) once you're done.

None of this is wired into the real app's `docker-compose.yml` - it's comparison material only, kept entirely under `bonus/`.

---

<a id="français"></a>

## Français

Preuves de concept concrètes qui étayent les comparatifs de [`docs/TECH_CHOICES.md`](../../docs/TECH_CHOICES.md). Chaque POC d'une couche donnée fait exactement la même tâche minimale sur 3 technologies, pour être directement comparables. Chacun a réellement été lancé et vérifié (curl / build / sortie console) - pas juste scaffoldé - sauf mention contraire ci-dessous. Le temps de mise en place et les LOC dans le README de chaque POC sont mesurés, pas estimés ; la "performance" n'a jamais été testée en charge et c'est signalé comme tel plutôt qu'inventé.

**Statut : 14/15 réellement vérifiés fonctionnels.**

| Couche | Techno | Statut | POC |
| --- | --- | --- | --- |
| Frontend | React | ✅ Vérifié | [`frontend/react/`](frontend/react/) |
| Frontend | Vue | ✅ Vérifié | [`frontend/vue/`](frontend/vue/) |
| Frontend | Angular | ✅ Vérifié | [`frontend/angular/`](frontend/angular/) |
| Backend | Express | ✅ Vérifié | [`backend/express/`](backend/express/) |
| Backend | Fastify | ✅ Vérifié | [`backend/fastify/`](backend/fastify/) |
| Backend | NestJS | ✅ Vérifié | [`backend/nestjs/`](backend/nestjs/) |
| Database | PostgreSQL | ✅ Vérifié | [`database/postgresql/`](database/postgresql/) |
| Database | MySQL | ✅ Vérifié | [`database/mysql/`](database/mysql/) |
| Database | MongoDB | ✅ Vérifié | [`database/mongodb/`](database/mongodb/) |
| ORM | Drizzle | ✅ Vérifié | [`orm/drizzle/`](orm/drizzle/) |
| ORM | Prisma | ✅ Vérifié | [`orm/prisma/`](orm/prisma/) |
| ORM | TypeORM | ✅ Vérifié | [`orm/typeorm/`](orm/typeorm/) |
| Proxy | nginx | ✅ Vérifié | [`proxy/nginx/`](proxy/nginx/) |
| Proxy | Caddy | ✅ Vérifié | [`proxy/caddy/`](proxy/caddy/) |
| Proxy | Traefik | ⚠️ Ne fonctionne pas | [`proxy/traefik/`](proxy/traefik/) |

**Celui qui ne fonctionne pas - Traefik, et ce n'est pas un problème d'environnement/réseau.** `traefik:v3.1` est en cache local et démarre sans problème, mais son client du provider Docker ne négocie jamais que l'API version `1.24`, que le Docker Engine de cette machine (`29.1.3`) rejette purement et simplement (`client version 1.24 is too old. Minimum supported API version is 1.44`) - donc Traefik ne peut jamais lire les labels des conteneurs dont il a besoin pour construire la moindre route, et chaque requête reçoit son propre `404`. C'est un bug upstream connu, [traefik/traefik#12253](https://github.com/traefik/traefik/issues/12253) : Docker Engine ≥29 a retiré le support de l'API 1.24, et seul Traefik **v3.6.1+** négocie autour. Le contournement généralement documenté via la variable d'environnement `DOCKER_API_VERSION` a été tenté (confirmé qu'elle atteignait bien le conteneur) et n'a rien changé sur la `v3.1` - attendu, puisque le correctif n'est arrivé que plus tard. Aucune image Traefik plus récente n'était disponible pour tester à la place (pas d'accès sortant au registre dans ce bac à sable pour en tirer une). Voir [`proxy/traefik/README.md`](proxy/traefik/README.md) pour la trace complète. **Action avant la soutenance :** relancer ce seul POC avec `traefik:v3.6.1` ou plus récent sur une machine avec un accès internet normal.

### Ports utilisés (rien sur 8080 - la vraie app l'occupe déjà)

| Couche | Techno | Port(s) |
| --- | --- | --- |
| Frontend | React / Vue / Angular | 5174 / 5175 / 4200 |
| Backend | Express / Fastify / NestJS | 4101 / 4102 / 4103 |
| Database | PostgreSQL / MySQL / MongoDB | 4201 / 4202 / 4203 (port HTTP de l'app seulement - la base elle-même n'est jamais exposée à l'hôte) |
| Proxy | nginx / Caddy / Traefik | 8081 / 8082 / 8083 |
| ORM | Drizzle / Prisma / TypeORM | aucun (fichier SQLite local, pas de serveur) |

### Lancer un POC soi-même

Chaque POC est autonome et se lance en une commande :

- Frontend / Backend / ORM : `cd bonus/poc/<couche>/<techno> && npm install && npm start` (ou `npm run dev` pour le frontend - voir chaque README).
- Database / Proxy : `cd bonus/poc/<couche>/<techno> && docker compose up -d --build`, puis `docker compose down` (ajouter `-v` pour les POC database, pour aussi supprimer le volume) une fois terminé.

Rien de tout ça n'est branché sur le `docker-compose.yml` de la vraie app - c'est du matériel de comparaison uniquement, entièrement sous `bonus/`.
