# POC - Database: MongoDB

[English](#english) · [Français](#français)

---

<a id="english"></a>

## English

Minimal proof of concept: a MongoDB instance plus a tiny Node app (native `mongodb` driver) that stores one widget and reads it back over HTTP.

### Run it

```
docker compose up --build
curl http://localhost:4203/widget
```

Only the app's HTTP port (`4203`) is published to the host - MongoDB itself stays on the compose-internal network. Image pinned to `mongo:6.0.5` (available offline in this environment; any recent `mongo` image works the same way).

### What it does

1. `app` waits for MongoDB to be healthy (`mongosh --eval "db.adminCommand('ping')"` healthcheck + a connect-retry loop as a fallback).
2. No schema/collection creation needed - Mongo creates `widgets` implicitly on first insert.
3. Inserts one mocked widget (`city_temperature`) if the collection is empty.
4. `GET /widget` reads it back and returns it as JSON.

### Observed (measured on this machine)

- **Setup time**: ~24s for a clean `docker compose up --build` (image already cached) - mostly Mongo's own startup/init time, which is slower than Postgres's here.
- **Lines of code**: 79 total (`docker-compose.yml` 18, `app/server.js` 47, `app/Dockerfile` 6, `app/package.json` 8) - slightly less than the Postgres POC, mainly because there's no `CREATE TABLE` step.
- **Ease of use**: very easy to start writing to - no schema to define upfront, `insertOne`/`findOne` map directly to the JS object shape. That absence of schema is also the main risk: nothing stops a second insert with a different shape for `config`.
- **Weaknesses observed**: `mongosh` isn't bundled in every Mongo image tag (had to pin a version known to include it for the healthcheck to work); no upfront schema means data-shape consistency is entirely the app's responsibility, unlike Postgres's `jsonb` column which is still inside a typed table.

### Verified

```
$ curl -s http://localhost:4203/widget
{"_id":"6abba2bfb1d8972c99dc0eeb","name":"city_temperature","config":{"city":"Paris","unit":"C"}}
```

```
app-1  | Widget inserted
app-1  | POC database/mongodb app listening on :3000
```

---

<a id="français"></a>

## Français

Preuve de concept minimale : une instance MongoDB plus une petite app Node (driver natif `mongodb`) qui stocke un widget et le relit via HTTP.

### Lancer

```
docker compose up --build
curl http://localhost:4203/widget
```

Seul le port HTTP de l'app (`4203`) est exposé à l'hôte - MongoDB reste uniquement sur le réseau interne du compose. Image figée sur `mongo:6.0.5` (disponible hors-ligne dans cet environnement ; n'importe quelle image `mongo` récente fonctionne pareil).

### Ce que ça fait

1. `app` attend que MongoDB soit healthy (healthcheck `mongosh --eval "db.adminCommand('ping')"` + boucle de retry de connexion en secours).
2. Pas de création de schéma/collection nécessaire - Mongo crée `widgets` implicitement au premier insert.
3. Insère un widget mocké (`city_temperature`) si la collection est vide.
4. `GET /widget` le relit et le renvoie en JSON.

### Observé (mesuré sur cette machine)

- **Temps de mise en place** : ~24s pour un `docker compose up --build` propre (image déjà en cache) - essentiellement le temps de démarrage/init de Mongo lui-même, plus lent que Postgres ici.
- **Lignes de code** : 79 au total (`docker-compose.yml` 18, `app/server.js` 47, `app/Dockerfile` 6, `app/package.json` 8) - un peu moins que le POC Postgres, principalement parce qu'il n'y a pas d'étape `CREATE TABLE`.
- **Facilité** : très facile pour commencer à écrire - pas de schéma à définir en amont, `insertOne`/`findOne` correspondent directement à la forme de l'objet JS. Cette absence de schéma est aussi le principal risque : rien n'empêche un second insert avec une forme différente pour `config`.
- **Points faibles observés** : `mongosh` n'est pas embarqué dans tous les tags d'image Mongo (il a fallu figer une version connue pour l'inclure, pour que le healthcheck fonctionne) ; l'absence de schéma en amont rend la cohérence de la forme des données entièrement à la charge de l'app, contrairement à la colonne `jsonb` de Postgres qui reste malgré tout dans une table typée.

### Vérifié

```
$ curl -s http://localhost:4203/widget
{"_id":"6abba2bfb1d8972c99dc0eeb","name":"city_temperature","config":{"city":"Paris","unit":"C"}}
```

```
app-1  | Widget inserted
app-1  | POC database/mongodb app listening on :3000
```
