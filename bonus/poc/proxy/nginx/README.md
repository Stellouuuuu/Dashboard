# Proxy POC - nginx

[English](#english) · [Français](#français)

---

<a id="english"></a>

## English

### What this does

Same contract as the other two proxy POCs (`../caddy`, `../traefik`): a tiny backend exposes `GET /api/widgets` (mocked JSON), and the proxy (1) serves a static `index.html` at `/`, (2) forwards everything under `/api/` to the backend. This mirrors the real project's `nginx/nginx.conf` pattern (exact-match `/about.json` + prefix `/api/` - see `docs/DEFENSE.md` §5/§6), just trimmed to the minimum.

### Run it

```sh
docker compose up -d --build
curl http://localhost:8081/
curl http://localhost:8081/api/widgets
docker compose down
```

One command, `docker compose up`. No manual step.

### What was observed

- **Setup time (measured):** writing `nginx.conf` + `docker-compose.yml` + `index.html` took a few minutes (13 lines each, straightforward copy of a pattern already used in the real project). `docker compose up -d --build`: **28s** for `npm install` inside the backend image, then containers start in ~2s.
- **Lines of config:** `nginx.conf` (13) + `docker-compose.yml` (13) = **26 lines**.
- **Verified working** - actual output:
  ```
  $ curl http://localhost:8081/
  <!doctype html>...<h1>Hello from nginx proxy</h1>...

  $ curl http://localhost:8081/api/widgets
  [{"id":1,"name":"weather","city":"Paris"},{"id":2,"name":"crypto","coin":"BTC"}]
  ```
- **Ease:** the `location` block syntax is terse but the two gotchas from the real project (exact match must come before the prefix match; `try_files` for SPA fallback) still apply here - it's easy to write a `location /` that silently swallows `/api/` if declared in the wrong order.
- **Weaknesses:** config is plain text with its own DSL (not JSON/YAML), no native health-check-based retry logic without extra directives, reload needs a signal (`nginx -s reload`) or container restart - nothing dynamic by default (unlike Traefik's auto-discovery).

---

<a id="français"></a>

## Français

### Ce que ça fait

Même contrat que les deux autres POC de proxy (`../caddy`, `../traefik`) : un petit backend expose `GET /api/widgets` (JSON mocké), et le proxy (1) sert un `index.html` statique sur `/`, (2) redirige tout ce qui est sous `/api/` vers le backend. Ça reprend le pattern du vrai `nginx/nginx.conf` du projet (match exact `/about.json` + préfixe `/api/` - voir `docs/DEFENSE.md` §5/§6), juste réduit au minimum.

### Lancer

```sh
docker compose up -d --build
curl http://localhost:8081/
curl http://localhost:8081/api/widgets
docker compose down
```

Une seule commande, `docker compose up`. Aucune étape manuelle.

### Ce qui a été observé

- **Temps de mise en place (mesuré) :** écrire `nginx.conf` + `docker-compose.yml` + `index.html` a pris quelques minutes (13 lignes chacun, reprise directe d'un pattern déjà utilisé dans le vrai projet). `docker compose up -d --build` : **28s** pour le `npm install` dans l'image du backend, puis démarrage des conteneurs en ~2s.
- **Lignes de config :** `nginx.conf` (13) + `docker-compose.yml` (13) = **26 lignes**.
- **Vérifié fonctionnel** - sortie réelle :
  ```
  $ curl http://localhost:8081/
  <!doctype html>...<h1>Hello from nginx proxy</h1>...

  $ curl http://localhost:8081/api/widgets
  [{"id":1,"name":"weather","city":"Paris"},{"id":2,"name":"crypto","coin":"BTC"}]
  ```
- **Facilité :** la syntaxe des blocs `location` est concise mais les deux pièges du vrai projet (le match exact doit précéder le match par préfixe ; `try_files` pour le fallback SPA) s'appliquent aussi ici - facile d'écrire un `location /` qui avale silencieusement `/api/` si l'ordre est mauvais.
- **Points faibles :** config en texte brut avec son propre DSL (pas JSON/YAML), pas de retry natif basé sur health-check sans directives supplémentaires, un reload demande un signal (`nginx -s reload`) ou un redémarrage du conteneur - rien de dynamique par défaut (contrairement à la découverte auto de Traefik).
