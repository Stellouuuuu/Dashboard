# Proxy POC - Caddy

[English](#english) · [Français](#français)

---

<a id="english"></a>

## English

### What this does

Same contract as the other two proxy POCs (`../nginx`, `../traefik`): a tiny backend exposes `GET /api/widgets` (mocked JSON), and the proxy (1) serves a static `index.html` at `/`, (2) forwards everything under `/api/` to the backend, keeping the `/api` prefix (`handle /api/*` - not `handle_path`, which would strip it and break the match on the backend).

### Run it

```sh
docker compose up -d --build
curl http://localhost:8082/
curl http://localhost:8082/api/widgets
docker compose down
```

One command, `docker compose up`.

### What was observed

- **Setup time:** authoring the `Caddyfile` + `docker-compose.yml` + `index.html` was comparable to nginx, arguably faster - the Caddyfile reads closer to plain English (`reverse_proxy`, `file_server`) and needs no `proxy_set_header` boilerplate (Caddy sets sane forwarding headers by default).
- **✅ Verified end-to-end.** `docker compose up -d --build` (image `caddy:alpine` already cached locally, no pull needed) → `curl http://localhost:8082/` returned the static `index.html` (`Hello from Caddy proxy`), `curl http://localhost:8082/api/widgets` returned the backend's mocked JSON (`[{"id":1,"name":"weather","city":"Paris"},{"id":2,"name":"crypto","coin":"BTC"}]`) through the proxy, prefix preserved as designed. Confirmed clean shutdown with `docker compose down` afterward.
- **Lines of config:** `Caddyfile` (11) + `docker-compose.yml` (13) = **24 lines** - 2 lines shorter than the equivalent nginx setup, for a config that's noticeably easier to read (no `proxy_set_header` repetition, `try_files` syntax is simpler).
- **Ease:** the friendliest syntax of the three proxies tested here - a newcomer can guess what `reverse_proxy` and `file_server` do without reading docs. HTTPS/certs would be automatic in a real deployment (not exercised here, plain HTTP on `:80`).
- **Weaknesses:** smaller ecosystem/community than nginx (fewer Stack Overflow answers, fewer third-party modules), and - same as nginx - no built-in service discovery: the backend hostname (`backend:4000`) is hardcoded, same as nginx's `api:3000` in the real project.

---

<a id="français"></a>

## Français

### Ce que ça fait

Même contrat que les deux autres POC de proxy (`../nginx`, `../traefik`) : un petit backend expose `GET /api/widgets` (JSON mocké), et le proxy (1) sert un `index.html` statique sur `/`, (2) redirige tout ce qui est sous `/api/` vers le backend, en conservant le préfixe `/api` (`handle /api/*` - pas `handle_path`, qui le retirerait et casserait le match côté backend).

### Lancer

```sh
docker compose up -d --build
curl http://localhost:8082/
curl http://localhost:8082/api/widgets
docker compose down
```

Une seule commande, `docker compose up`.

### Ce qui a été observé

- **Temps de mise en place :** écrire le `Caddyfile` + `docker-compose.yml` + `index.html` a été comparable à nginx, plutôt plus rapide - le Caddyfile se lit presque comme de l'anglais courant (`reverse_proxy`, `file_server`) et n'a pas besoin du boilerplate `proxy_set_header` (Caddy pose des en-têtes de forwarding sensés par défaut).
- **✅ Vérifié de bout en bout.** `docker compose up -d --build` (image `caddy:alpine` déjà en cache local, aucun pull nécessaire) → `curl http://localhost:8082/` a renvoyé le `index.html` statique (`Hello from Caddy proxy`), `curl http://localhost:8082/api/widgets` a renvoyé le JSON mocké du backend (`[{"id":1,"name":"weather","city":"Paris"},{"id":2,"name":"crypto","coin":"BTC"}]`) à travers le proxy, préfixe conservé comme prévu. Arrêt propre confirmé avec `docker compose down` ensuite.
- **Lignes de config :** `Caddyfile` (11) + `docker-compose.yml` (13) = **24 lignes** - 2 lignes de moins que l'équivalent nginx, pour une config sensiblement plus lisible (pas de répétition de `proxy_set_header`, syntaxe `try_files` plus simple).
- **Facilité :** la syntaxe la plus accueillante des trois proxys testés ici - un nouveau venu peut deviner ce que font `reverse_proxy` et `file_server` sans lire la doc. HTTPS/certificats seraient automatiques en vrai déploiement (non testé ici, HTTP simple sur `:80`).
- **Points faibles :** écosystème/communauté plus petits que nginx (moins de réponses Stack Overflow, moins de modules tiers), et - comme nginx - pas de découverte de service native : le nom d'hôte du backend (`backend:4000`) est codé en dur, comme `api:3000` dans le vrai projet.
