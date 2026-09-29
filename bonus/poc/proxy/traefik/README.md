# Proxy POC - Traefik

[English](#english) · [Français](#français)

---

<a id="english"></a>

## English

### What this does

Same contract as the other two proxy POCs (`../nginx`, `../caddy`): a backend exposes `GET /api/widgets` (mocked JSON), the proxy serves a static page at `/` and forwards `/api/*` to the backend. Unlike nginx/Caddy, **Traefik has no built-in static file server** - routing is all it does - so a third container (`static`, plain `nginx:alpine` just serving the `html/` folder, no custom config) is needed to have something to route `/` to. Routing rules are declared as **Docker labels** on `backend` and `static`, not in a proxy config file: `traefik` itself only gets CLI flags (`--providers.docker=true`) telling it to watch the Docker socket and discover services by their labels. `PathPrefix(\`/api\`)` on the backend automatically outranks `PathPrefix(\`/\`)` on `static` (Traefik prioritizes more specific rules by default), so no manual priority was needed.

### Run it

```sh
docker compose up -d --build
curl http://localhost:8083/
curl http://localhost:8083/api/widgets
docker compose down
```

One command, `docker compose up`.

### What was observed

- **Setup time:** took noticeably longer to *design* than nginx/Caddy - not because the labels are individually hard, but because the mental model is different (config lives scattered across 3 services instead of one file) and getting the routing priority right without an explicit `priority` label required checking Traefik's default rule-specificity behavior rather than just reading top-to-bottom like an nginx/Caddy file.
- **⚠️ Still could not be executed end-to-end, but no longer a pull/network problem.** With `traefik:v3.1` cached locally (`docker pull` done ahead of time), `docker compose up -d --build` started all 3 containers fine, but Traefik itself never routed a single request - both `curl http://localhost:8083/` and `curl .../api/widgets` returned Traefik's own `404 page not found`. Its logs showed the real cause: `Error response from daemon: client version 1.24 is too old. Minimum supported API version is 1.44` - Traefik's Docker-provider client kept negotiating API `1.24` against a Docker Engine `29.1.3` daemon that (correctly, per Docker's own deprecation policy) refuses anything below `1.44`, so it could never read the container labels needed to build any route. This is a known upstream bug ([traefik/traefik#12253](https://github.com/traefik/traefik/issues/12253)): Docker Engine ≥29 dropped API 1.24, and Traefik's vendored SDK doesn't negotiate around it - only fixed starting **Traefik v3.6.1**. Tried the commonly-documented workaround, setting `DOCKER_API_VERSION=1.44` as an environment variable on the `traefik` service (now left in `docker-compose.yml`, see the comment there) - confirmed the variable *did* reach the container (`docker exec ... env`), but `v3.1`'s provider ignored it and kept sending `1.24` anyway, confirming this specific version predates the fix. No `traefik:v3.6+`/`:latest` image was available to test instead (no outbound registry access in this sandbox to pull one). The label-based routing config itself is correct by inspection (same contract as the verified nginx/Caddy POCs) but remains unverified end-to-end - re-run with `traefik:v3.6.1` or newer (or remove the pinned `DOCKER_API_VERSION` once on a matching image) before relying on it for the defense.
- **Lines of config:** **31 lines**, all in `docker-compose.yml` - there is no separate "proxy config file" at all, which is itself an observation: the routing logic is not centralized, it's spread as labels on whatever service needs to be exposed. Comparing raw line counts to nginx (26) / Caddy (24) undersells the real complexity here, since 3 services are involved instead of 2.
- **Ease:** steepest learning curve of the three - understanding *why* label-based discovery works (Traefik watching the Docker socket, matching containers by label, auto-ranking rules by specificity) takes more upfront reading than nginx's or Caddy's "config file lists routes top to bottom" model. Once understood, adding a 4th service needs zero proxy-file edits (just labels on the new service) - that's Traefik's actual selling point (auto-discovery in a dynamic/orchestrated fleet), which a static 2-service POC like this one doesn't really showcase.
- **Weaknesses:** requires mounting the Docker socket (`/var/run/docker.sock`) into the proxy container - a real privilege-escalation surface to be aware of in production (whoever controls that socket can control every container on the host); needs an extra container just for static files, unlike nginx/Caddy which do both jobs; the dashboard (disabled here on purpose to avoid a second host port) is a separate thing to secure if enabled.

---

<a id="français"></a>

## Français

### Ce que ça fait

Même contrat que les deux autres POC de proxy (`../nginx`, `../caddy`) : un backend expose `GET /api/widgets` (JSON mocké), le proxy sert une page statique sur `/` et redirige `/api/*` vers le backend. Contrairement à nginx/Caddy, **Traefik n'a pas de serveur de fichiers statiques intégré** - il ne fait que du routage - donc un troisième conteneur (`static`, simple `nginx:alpine` servant le dossier `html/`, sans config custom) est nécessaire pour avoir quelque chose vers quoi router `/`. Les règles de routage sont déclarées via des **labels Docker** sur `backend` et `static`, pas dans un fichier de config du proxy : `traefik` lui-même ne reçoit que des flags CLI (`--providers.docker=true`) lui disant de surveiller le socket Docker et de découvrir les services via leurs labels. `PathPrefix(\`/api\`)` sur le backend passe automatiquement devant `PathPrefix(\`/\`)` sur `static` (Traefik priorise les règles les plus spécifiques par défaut), donc aucune priorité manuelle n'a été nécessaire.

### Lancer

```sh
docker compose up -d --build
curl http://localhost:8083/
curl http://localhost:8083/api/widgets
docker compose down
```

Une seule commande, `docker compose up`.

### Ce qui a été observé

- **Temps de mise en place :** sensiblement plus long à *concevoir* que nginx/Caddy - pas parce que les labels sont individuellement difficiles, mais parce que le modèle mental est différent (la config vit éparpillée sur 3 services au lieu d'un seul fichier) et obtenir la bonne priorité de routage sans label `priority` explicite a demandé de vérifier le comportement par défaut de Traefik sur la spécificité des règles, plutôt que de simplement lire un fichier nginx/Caddy de haut en bas.
- **⚠️ Toujours pas exécutable de bout en bout, mais ce n'est plus un problème de pull/réseau.** Avec `traefik:v3.1` en cache local (`docker pull` fait à l'avance), `docker compose up -d --build` a démarré les 3 conteneurs sans problème, mais Traefik lui-même n'a jamais routé une seule requête - `curl http://localhost:8083/` et `curl .../api/widgets` renvoyaient tous les deux le `404 page not found` propre à Traefik. Ses logs montrent la vraie cause : `Error response from daemon: client version 1.24 is too old. Minimum supported API version is 1.44` - le client du provider Docker de Traefik négociait systématiquement l'API `1.24` contre un daemon Docker Engine `29.1.3` qui refuse (à juste titre, selon la politique de dépréciation de Docker) tout ce qui est en dessous de `1.44`, donc il n'a jamais pu lire les labels des conteneurs pour construire la moindre route. C'est un bug upstream connu ([traefik/traefik#12253](https://github.com/traefik/traefik/issues/12253)) : Docker Engine ≥29 a retiré l'API 1.24, et le SDK vendored de Traefik ne négocie pas autour - corrigé seulement à partir de **Traefik v3.6.1**. Tenté le contournement généralement documenté, régler `DOCKER_API_VERSION=1.44` en variable d'environnement sur le service `traefik` (laissé dans `docker-compose.yml`, voir le commentaire) - confirmé que la variable atteignait bien le conteneur (`docker exec ... env`), mais le provider de la `v3.1` l'a ignorée et a continué d'envoyer `1.24`, confirmant que cette version précise précède le correctif. Aucune image `traefik:v3.6+`/`:latest` n'était disponible pour tester à la place (pas d'accès sortant au registre dans ce bac à sable pour en tirer une). La config de routage par labels est correcte par relecture (même contrat que les POC nginx/Caddy vérifiés) mais reste non vérifiée de bout en bout - à relancer avec `traefik:v3.6.1` ou plus récent (ou à retirer le `DOCKER_API_VERSION` épinglé une fois sur une image compatible) avant de s'appuyer dessus en soutenance.
- **Lignes de config :** **31 lignes**, entièrement dans `docker-compose.yml` - il n'y a pas de "fichier de config du proxy" séparé du tout, ce qui est en soi une observation : la logique de routage n'est pas centralisée, elle est éparpillée en labels sur chaque service à exposer. Comparer les lignes brutes à nginx (26) / Caddy (24) sous-estime la vraie complexité ici, puisque 3 services sont impliqués au lieu de 2.
- **Facilité :** la courbe d'apprentissage la plus raide des trois - comprendre *pourquoi* la découverte par labels fonctionne (Traefik surveille le socket Docker, matche les conteneurs par label, priorise automatiquement par spécificité) demande plus de lecture en amont que le modèle "le fichier de config liste les routes de haut en bas" de nginx/Caddy. Une fois compris, ajouter un 4ème service ne demande aucune modif du fichier de proxy (juste des labels sur le nouveau service) - c'est le vrai argument de vente de Traefik (découverte auto dans une flotte dynamique/orchestrée), qu'un POC statique à 2 services comme celui-ci ne met pas vraiment en valeur.
- **Points faibles :** nécessite de monter le socket Docker (`/var/run/docker.sock`) dans le conteneur du proxy - une vraie surface d'escalade de privilèges à connaître en production (qui contrôle ce socket contrôle tous les conteneurs de l'hôte) ; a besoin d'un conteneur en plus juste pour les fichiers statiques, contrairement à nginx/Caddy qui font les deux ; le dashboard (désactivé ici volontairement pour éviter un deuxième port hôte) est une surface supplémentaire à sécuriser s'il est activé.
