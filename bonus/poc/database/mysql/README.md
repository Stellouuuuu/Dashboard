# POC - Database: MySQL

[English](#english) · [Français](#français)

---

<a id="english"></a>

## English

Minimal proof of concept: a MySQL database plus a tiny Node app (native `mysql2` driver, no ORM) that stores one widget and reads it back over HTTP.

> **Verified working.** `docker compose up --build` (image `mysql:8.4` already cached locally, no pull needed) → `curl http://localhost:4202/widget` → `{"id":1,"name":"city_temperature","config":{"city":"Paris","unit":"C"}}`. Real finding along the way: the Docker healthcheck (`mysqladmin ping`) reported the container healthy on the *first* `mysqld` process, but MySQL's well-known first-boot behavior is to initialize then restart its own server process internally - the app's connection was refused during that window and needed its own retry loop (8 attempts, ~20s) to get through, even though Compose already considered the container "healthy". A healthcheck passing is not the same guarantee as "the server you'll actually connect to is up".

### Run it

```
docker compose up --build
curl http://localhost:4202/widget
```

Only the app's HTTP port (`4202`) is published to the host - MySQL itself stays on the compose-internal network.

### What it does

1. `app` waits for MySQL to be healthy (`mysqladmin ping` healthcheck + a connect-retry loop as a fallback - MySQL's first boot/init is typically the slowest of the three engines, hence a higher retry count than the Postgres/Mongo POCs).
2. Creates the `widgets` table if missing (`id`, `name`, `config JSON`).
3. Inserts one mocked widget (`city_temperature`) if the table is empty.
4. `GET /widget` reads it back and returns it as JSON.

### Observed

- **Setup time**: ~25s measured from `docker compose up --build` (cached image) to a verified `curl` response - clearly the slowest of the three database POCs to actually answer, confirmed: MySQL's first-boot init-then-restart cycle (see finding above) added a real ~20s the Postgres/Mongo POCs didn't have.
- **Lines of code**: 89 total (`docker-compose.yml` 23, `app/server.js` 52, `app/Dockerfile` 6, `app/package.json` 8) - comparable to Postgres, `mysql2`'s promise API (`pool.query(sql, params)`) is essentially the same shape as `pg`'s.
- **Ease of use**: near-identical to the Postgres POC in code - same parameterized-SQL style, same manual `CREATE TABLE`. `mysql2` requires a connection pool (`createPool`) rather than a single client for reliable reconnects, a small extra step `pg` doesn't need for this scale.
- **Weaknesses observed**: same raw-SQL manual typing as Postgres, plus the real one above - MySQL's healthcheck-vs-actual-availability gap is a genuine operational footgun that Postgres and MongoDB did not exhibit in their own POCs (their `depends_on: condition: service_healthy` was sufficient on its own; MySQL's needed the app-level retry loop as a second line of defense).

---

<a id="français"></a>

## Français

Preuve de concept minimale : une base MySQL plus une petite app Node (driver natif `mysql2`, pas d'ORM) qui stocke un widget et le relit via HTTP.

> **Vérifié, fonctionne.** `docker compose up --build` (image `mysql:8.4` déjà en cache local, aucun pull nécessaire) → `curl http://localhost:4202/widget` → `{"id":1,"name":"city_temperature","config":{"city":"Paris","unit":"C"}}`. Constat réel en cours de route : le healthcheck Docker (`mysqladmin ping`) a signalé le conteneur healthy sur le *premier* process `mysqld`, mais le comportement bien connu de MySQL au premier boot est de s'initialiser puis de redémarrer son propre process serveur en interne - la connexion de l'app a été refusée pendant cette fenêtre et a eu besoin de sa propre boucle de retry (8 tentatives, ~20s) pour passer, alors même que Compose considérait déjà le conteneur "healthy". Un healthcheck qui passe n'est pas la même garantie que "le serveur auquel tu vas réellement te connecter est up".

### Lancer

```
docker compose up --build
curl http://localhost:4202/widget
```

Seul le port HTTP de l'app (`4202`) est exposé à l'hôte - MySQL reste uniquement sur le réseau interne du compose.

### Ce que ça fait

1. `app` attend que MySQL soit healthy (healthcheck `mysqladmin ping` + boucle de retry de connexion en secours - le premier démarrage/init de MySQL est généralement le plus lent des trois moteurs, d'où un nombre de retries plus élevé que pour les POC Postgres/Mongo).
2. Crée la table `widgets` si absente (`id`, `name`, `config JSON`).
3. Insère un widget mocké (`city_temperature`) si la table est vide.
4. `GET /widget` le relit et le renvoie en JSON.

### Observé

- **Temps de mise en place** : ~25s mesurées entre `docker compose up --build` (image en cache) et une réponse `curl` vérifiée - clairement le plus lent des trois POC database à répondre réellement, confirmé : le cycle init-puis-redémarrage du premier boot MySQL (voir constat ci-dessus) a ajouté ~20s réelles que les POC Postgres/Mongo n'ont pas eues.
- **Lignes de code** : 89 au total (`docker-compose.yml` 23, `app/server.js` 52, `app/Dockerfile` 6, `app/package.json` 8) - comparable à Postgres, l'API promise de `mysql2` (`pool.query(sql, params)`) a quasiment la même forme que celle de `pg`.
- **Facilité** : quasi identique au POC Postgres côté code - même style SQL paramétré, même `CREATE TABLE` manuel. `mysql2` demande un pool de connexions (`createPool`) plutôt qu'un client unique pour des reconnexions fiables, une petite étape en plus que `pg` ne demande pas à cette échelle.
- **Points faibles observés** : même typage SQL brut manuel que Postgres, plus le constat réel ci-dessus - l'écart healthcheck-vs-disponibilité-réelle de MySQL est un vrai piège opérationnel que Postgres et MongoDB n'ont pas montré dans leurs POC respectifs (leur `depends_on: condition: service_healthy` a suffi seul ; celui de MySQL a eu besoin de la boucle de retry côté app comme seconde ligne de défense).
