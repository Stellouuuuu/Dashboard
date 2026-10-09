# POC - Database: PostgreSQL

[English](#english) · [Français](#français)

---

<a id="english"></a>

## English

Minimal proof of concept: a Postgres database plus a tiny Node app (native `pg` driver, no ORM) that stores one widget and reads it back over HTTP.

### Run it

```
docker compose up --build
curl http://localhost:4201/widget
```

Only the app's HTTP port (`4201`) is published to the host - Postgres itself stays on the compose-internal network.

### What it does

1. `app` waits for Postgres to be healthy (`pg_isready` healthcheck + a connect-retry loop as a fallback).
2. Creates the `widgets` table if missing (`id`, `name`, `config jsonb`).
3. Inserts one mocked widget (`city_temperature`) if the table is empty.
4. `GET /widget` reads it back and returns it as JSON.

### Observed (measured on this machine)

- **Setup time**: ~5s for a clean `docker compose up --build` once the `postgres:16-alpine` base image is already pulled (image pull time itself depends on network/first run and isn't included in this number).
- **Lines of code**: 87 total (`docker-compose.yml` 22, `app/server.js` 51, `app/Dockerfile` 6, `app/package.json` 8).
- **Ease of use**: straightforward. `pg_isready` in the official image made the healthcheck trivial to write, and the native `pg` driver's API (`client.query(sql, params)`) is simple parameterized SQL - no query builder to learn.
- **Weaknesses observed**: the driver is raw SQL only - table creation, JSON serialization (`JSON.stringify` on the way in) are all manual, nothing is typed. Fine for a POC, would get tedious fast on a real schema with many tables/relations (this is exactly the gap an ORM fills - see `bonus/poc/orm/`).

### Verified

```
$ curl -s http://localhost:4201/widget
{"id":1,"name":"city_temperature","config":{"city":"Paris","unit":"C"}}
```

```
app-1  | Widget inserted
app-1  | POC database/postgresql app listening on :3000
```

---

<a id="français"></a>

## Français

Preuve de concept minimale : une base Postgres plus une petite app Node (driver natif `pg`, pas d'ORM) qui stocke un widget et le relit via HTTP.

### Lancer

```
docker compose up --build
curl http://localhost:4201/widget
```

Seul le port HTTP de l'app (`4201`) est exposé à l'hôte - Postgres reste uniquement sur le réseau interne du compose.

### Ce que ça fait

1. `app` attend que Postgres soit healthy (healthcheck `pg_isready` + boucle de retry de connexion en secours).
2. Crée la table `widgets` si absente (`id`, `name`, `config jsonb`).
3. Insère un widget mocké (`city_temperature`) si la table est vide.
4. `GET /widget` le relit et le renvoie en JSON.

### Observé (mesuré sur cette machine)

- **Temps de mise en place** : ~5s pour un `docker compose up --build` propre une fois l'image `postgres:16-alpine` déjà tirée (le temps de pull de l'image dépend du réseau/premier lancement et n'est pas inclus dans ce chiffre).
- **Lignes de code** : 87 au total (`docker-compose.yml` 22, `app/server.js` 51, `app/Dockerfile` 6, `app/package.json` 8).
- **Facilité** : simple. `pg_isready` dans l'image officielle rend le healthcheck trivial à écrire, et l'API du driver natif `pg` (`client.query(sql, params)`) reste du SQL paramétré basique - pas de query builder à apprendre.
- **Points faibles observés** : le driver est du SQL brut uniquement - création de table, sérialisation JSON (`JSON.stringify` à l'insertion) sont toutes manuelles, rien n'est typé. Correct pour un POC, deviendrait vite pénible sur un vrai schéma avec plusieurs tables/relations (c'est exactement le trou que comble un ORM - voir `bonus/poc/orm/`).

### Vérifié

```
$ curl -s http://localhost:4201/widget
{"id":1,"name":"city_temperature","config":{"city":"Paris","unit":"C"}}
```

```
app-1  | Widget inserted
app-1  | POC database/postgresql app listening on :3000
```
