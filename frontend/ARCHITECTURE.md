# Architecture technique — Threshold (Dashboard)

> Document de proposition à valider en binôme **avant** toute implémentation backend / Docker.  
> Aucun fichier de code, de config ou de dépendance n’est créé ici : ce document décrit uniquement la cible.

**Statut :** brouillon à valider  
**Projet :** Dashboard full-stack (groupe de 2) — plateforme **Threshold**  
**Frontend actuel :** prototype React (Vite + TypeScript) déjà présent à la racine du dépôt ; à déplacer dans `frontend/` au moment du bascule monorepo.

---

## Table des matières

1. [Structure du repo (monorepo)](#1-structure-du-repo-monorepo)
2. [Architecture backend](#2-architecture-backend)
3. [Schéma de base de données](#3-schéma-de-base-de-données)
4. [Le Timer (rafraîchissement par widget)](#4-le-timer-rafraîchissement-par-widget)
5. [Endpoints API prévus](#5-endpoints-api-prévus)
6. [docker-compose.yml (description textuelle)](#6-docker-composeyml-description-textuelle)
7. [Décisions ouvertes à valider](#7-décisions-ouvertes-à-valider)

---

## 1. Structure du repo (monorepo)

Arborescence **cible** (à créer plus tard, pas maintenant) :

```text
Dashboard/                          # racine du monorepo
├── ARCHITECTURE.md                 # ce document
├── README.md                       # démarrage : docker-compose up, etc.
├── docker-compose.yml              # orchestre server, frontend, db [, redis]
├── .env.example                    # variables documentées (jamais de secrets commités)
│
├── frontend/                       # app React actuelle (déplacée depuis la racine)
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   ├── public/
│   └── src/
│       ├── api/                    # client HTTP réel (remplace demo.ts)
│       ├── auth/
│       ├── components/
│       ├── context/
│       ├── dashboard/
│       ├── data/                   # catalogue widgets (aligné avec about.json)
│       ├── layouts/
│       ├── pages/
│       └── ...
│
├── backend/                        # API Node.js / Express (port 8080)
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   ├── index.js                # (ou .ts) point d’entrée Express
│   │   ├── config/                 # env, catalogue services/widgets, constantes
│   │   ├── routes/                 # définition des URLs
│   │   ├── controllers/            # orchestration req/res
│   │   ├── middleware/             # auth JWT, validation, erreurs, Helmet déjà appliqué au boot
│   │   ├── services/               # logique métier + appels APIs externes
│   │   ├── models/                 # accès DB (requêtes / ORM)
│   │   ├── jobs/                   # (optionnel) workers Timer / files d’attente
│   │   └── utils/                  # hash, tokens, helpers
│   └── migrations/                 # schéma SQL versionné
│
└── bonus/                          # fonctionnalités hors scope minimal (docs + code bonus)
    ├── README.md                   # liste des bonus et comment les activer
    └── ...                         # ex. thème, admin avancé, 4ᵉ service, etc.
```

### Rôles des dossiers racine

| Élément | Rôle |
|---------|------|
| `frontend/` | SPA React servie (en prod via nginx ou Vite preview) ; parle au backend via HTTP. |
| `backend/` | API unique exposée sur **8080**, y compris `GET /about.json`. |
| `docker-compose.yml` | Lance et relie tous les services d’un coup (`build` + `up`). |
| `bonus/` | Isoler clairement le « nice to have » du socle noté. |

### Note de migration

Aujourd’hui le frontend vit à la racine (`src/`, `package.json`, …).  
**Proposition :** au démarrage du backend, déplacer ce contenu dans `frontend/` sans changer la logique React, puis brancher un vrai client API.

---

## 2. Architecture backend

### 2.1 Stack proposée

| Couche | Choix | Pourquoi |
|--------|-------|----------|
| Runtime | **Node.js** | Cohérent avec le backlog (JWT, Helmet) et avec le frontend JS/TS. |
| Framework HTTP | **Express** | Simple, bien documenté, adapté à une API REST scolaire. |
| Auth | **JWT access + refresh token** (backlog) | Access court en header `Authorization: Bearer …` ; refresh pour renouveler sans re-login (aligné prototype TTL ~2 h côté session). |
| Sécurité HTTP | **Helmet** + **CORS** + **rate limiting** (backlog) | Headers de sécu, origines contrôlées, protection brute-force sur `/api/auth`. |
| Mots de passe | **bcrypt** (ou argon2) | Jamais de mot de passe en clair. |
| Base de données | **PostgreSQL** | Relations claires (users ↔ abonnements ↔ widgets) + **JSONB** pour configs variables. |
| Accès DB | **pg** + migrations SQL **ou** Prisma/Knex | À trancher (voir §7) ; l’essentiel est un schéma versionné. |
| APIs externes | `fetch` / axios dans `services/` | Weather, GitHub, RSS. |
| OAuth | Passport GitHub (ou flow manuel OAuth2) | Aligné avec le bootstrap déjà exploré et le sujet. |

Langage backend : **JavaScript** pour aller vite, ou **TypeScript** pour aligner FE/BE — à valider en binôme (§7).

### 2.2 Organisation des dossiers backend

| Dossier | Rôle (une phrase) |
|---------|-------------------|
| `routes/` | Déclare les chemins HTTP et les branche aux controllers (sans logique métier). |
| `controllers/` | Lit la requête, appelle un service, renvoie le statut et le JSON de réponse. |
| `middleware/` | Intercepte la requête (JWT, rôles admin, validation Zod/Joi, gestion d’erreurs). |
| `services/` | Contient la logique métier et les appels aux APIs externes / à la file Timer. |
| `models/` | Encapsule les lectures/écritures PostgreSQL pour chaque table. |
| `config/` | Centralise l’env, le catalogue services/widgets (source de vérité de `/about.json`). |
| `jobs/` *(optionnel)* | Workers BullMQ / cron si on choisit un Timer côté serveur. |
| `utils/` | Helpers transverses (hash, génération de token de confirmation, IP client, etc.). |

### 2.3 Flux typique d’une requête

```text
Client React
  → Express (Helmet, CORS, JSON parser)
    → middleware auth (si route protégée)
      → route → controller → service → model (PostgreSQL)
                                         ↘ API externe (si refresh widget)
      ← JSON { data | error }
```

### 2.4 Catalogue services / widgets (source de vérité)

Le catalogue (3 services × 2 widgets = 6, déjà présent côté frontend) doit vivre côté **backend** dans `config/catalog.js` (ou équivalent), et le frontend s’aligne dessus via l’API / `about.json`.

| Service | Widgets | Params (types `string` \| `integer`) |
|---------|---------|--------------------------------------|
| `weather` | `city_temperature` | `city` (string), `unit` (string) |
| `weather` | `precipitation_forecast` | `city` (string), `days` (integer) |
| `github` | `recent_commits` | `repo` (string), `limit` (integer) |
| `github` | `security_alerts` | `repo` (string), `severity` (string) |
| `rss` | `article_list` | `feed_url` (string), `number` (integer) |
| `rss` | `feed_summary` | `feed_url` (string), `label` (string) |

- **Weather :** disponible par défaut (pas d’OAuth).  
- **GitHub :** abonnement via **OAuth 2.0**.  
- **RSS :** abonnement via URL de flux (pas d’OAuth).

---

## 3. Schéma de base de données

SGBD proposé : **PostgreSQL**.

### 3.1 Vue d’ensemble

```text
users 1 ──< service_subscriptions
users 1 ──< widget_instances
```

### 3.2 Table `users`

| Colonne | Type | Contraintes | Pourquoi |
|---------|------|-------------|----------|
| `id` | `UUID` | PK, default `gen_random_uuid()` | Identifiant stable, non séquentiel. |
| `name` | `TEXT` | NOT NULL | Affichage profil / admin. |
| `email` | `CITEXT` ou `TEXT` | UNIQUE, NOT NULL | Login. |
| `password_hash` | `TEXT` | NOT NULL | Mot de passe hashé (jamais en clair). |
| `role` | `TEXT` | NOT NULL, CHECK (`user` \| `admin`) | Accès `/api/admin/...`. |
| `is_confirmed` | `BOOLEAN` | NOT NULL, default `false` | Blocage login tant que non confirmé. |
| `confirm_token` | `TEXT` | NULL, UNIQUE | Lien `/confirm/:token`. |
| `confirm_token_expires_at` | `TIMESTAMPTZ` | NULL | Expiration du token. |
| `service_defaults` | `JSONB` | NOT NULL, default `{}` | Hints profil (`githubUsername`, `weatherDefaultCity`, `rssDefaultFeed`). |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | Audit / admin. |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | Suivi des modifications. |

### 3.3 Table `service_subscriptions`

| Colonne | Type | Contraintes | Pourquoi |
|---------|------|-------------|----------|
| `id` | `UUID` | PK | Identifiant d’abonnement. |
| `user_id` | `UUID` | FK → `users`, NOT NULL | Propriétaire. |
| `service` | `TEXT` | NOT NULL, CHECK (`weather` \| `github` \| `rss`) | Quel service. |
| `status` | `TEXT` | NOT NULL (`active` \| `revoked`) | Permet de « se désabonner » sans tout effacer. |
| `credentials` | `JSONB` | NOT NULL, default `{}` | Tokens OAuth GitHub, URL RSS, etc. (chiffrer en bonus). |
| `subscribed_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | Historique. |
| — | — | **UNIQUE (`user_id`, `service`)** | Un seul abonnement actif par service et par user. |

Weather peut être créé automatiquement à l’inscription (`status = active`, `credentials = {}`).

### 3.4 Table `widget_instances`

| Colonne | Type | Contraintes | Pourquoi |
|---------|------|-------------|----------|
| `id` | `UUID` | PK | Identifiant d’instance (remplace `uid` du prototype). |
| `user_id` | `UUID` | FK → `users`, NOT NULL, ON DELETE CASCADE | Dashboard personnel. |
| `service` | `TEXT` | NOT NULL | Dénormalisé pour filtres / jobs (dérivable du catalogue). |
| `widget_type` | `TEXT` | NOT NULL | Ex. `city_temperature` (type catalogue, pas l’instance). |
| `config` | `JSONB` | NOT NULL | Params propres à l’instance (ville, repo, …). |
| `refresh_interval_sec` | `INTEGER` | NOT NULL, CHECK (> 0) | Taux de rafraîchissement choisi dans le wizard. |
| `position` | `INTEGER` | NOT NULL, default `0` | Ordre après drag & drop. |
| `last_refreshed_at` | `TIMESTAMPTZ` | NULL | Debug Timer / admin. |
| `last_payload` | `JSONB` | NULL | Cache optionnel du dernier résultat (évite de re-fetch à chaque ouverture). |
| `last_error` | `TEXT` | NULL | Afficher l’état erreur côté UI. |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | — |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | — |

Plusieurs lignes peuvent partager le même `widget_type` avec des `config` différentes → **deux instances du même widget** sont autorisées (exigence sujet).

### 3.5 Pourquoi `config` en JSONB (et pas une table par widget) ?

| Approche | Avantages | Inconvénients |
|----------|-----------|---------------|
| **JSONB sur `widget_instances` (retenu)** | Un seul modèle CRUD ; ajoute un widget sans migration de schéma ; colle au catalogue et à `about.json` (`params` dynamiques). | Moins de contraintes SQL fortes (validation dans le service + schéma Zod par `widget_type`). |
| Une table par widget (`widget_city_temperature`, …) | Colonnes typées strictement. | Explosion de tables/migrations ; jointures lourdes ; chaque nouveau widget = DDL. |
| Table `widget_params` EAV (clé/valeur) | Flexible. | Requêtes pénibles, typage faible, plus de code pour peu de gain ici. |

**Règle :** le backend valide `config` contre le catalogue (`name` + `type` string/integer) avant INSERT/UPDATE. JSONB stocke, le catalogue contraint.

### 3.6 Schéma relationnel (texte)

```text
┌─────────────────────┐
│ users               │
│  id (PK)            │
│  email, role, …     │
└─────────┬───────────┘
          │ 1
          │
    ┌─────┴──────────────┐
    │ N                  │ N
┌───▼─────────────────┐  ┌───▼──────────────────┐
│ service_subscriptions│  │ widget_instances     │
│  user_id + service   │  │  widget_type         │
│  credentials JSONB   │  │  config JSONB        │
└──────────────────────┘  │  refresh_interval_sec│
                          │  position            │
                          └──────────────────────┘
```

---

## 4. Le Timer (rafraîchissement par widget)

Objectif sujet : chaque **instance** a son `refresh_interval_sec` ; le système doit pouvoir **rafraîchir périodiquement** les données.

### 4.1 Ce que fait déjà le prototype frontend

`TimerRing` côté React déclenche un cycle toutes les N secondes et appelle un mock.  
C’est une bonne UX de décompte, mais **pas** encore un Timer backend.

### 4.2 Options proposées

#### Option A — Timer client + endpoint de refresh (recommandée pour le socle)

```text
Pour chaque WidgetCard montée :
  toutes les refresh_interval_sec secondes
    → GET /api/dashboard/widgets/:id/data
      → backend appelle l’API externe avec config + credentials
      → renvoie le payload (et met à jour last_payload / last_error)
```

| Avantages | Inconvénients |
|-----------|---------------|
| Simple à implémenter et à debugger | Pas de refresh si l’onglet est fermé |
| Réutilise l’UI Timer déjà là | Charge API si beaucoup d’onglets ouverts |
| Pas de Redis obligatoire | Moins « impressionnant » en soutenance sur le côté serveur |
| Suffisant pour le MVP noté | — |

#### Option B — `setInterval` / node-cron dans le process Node

Le serveur maintient une map `instanceId → interval` et pré-fetch en tâche de fond.

| Avantages | Inconvénients |
|-----------|---------------|
| Refresh même sans client | Perdu au redémarrage du container |
| Pas de dépendance Redis | Fragile avec plusieurs replicas |
| — | Gestion manuelle create/update/delete d’intervalles |

#### Option C — Redis + BullMQ (jobs répétables)

Chaque instance = job répétable ; un worker appelle le service externe et écrit `last_payload`.

| Avantages | Inconvénients |
|-----------|---------------|
| Propre, durable, scalable | Infra + complexité (Redis, workers, retries) |
| Bon story « architecture » / bonus | Overkill pour 6 widgets et 2 développeurs |
| Survits aux redémarrages | Plus de surface de bugs Docker |

### 4.3 Proposition de décision (alignée backlog)

Le backlog prévoit explicitement : **« Timer BullMQ + Redis cache »**.

| Phase | Choix |
|-------|--------|
| **Cible backlog** | **Option C** : Redis + BullMQ (jobs répétables par instance) + cache du dernier payload ; le frontend `TimerRing` peut rester un indicateur UX et/ou déclencher un refresh manuel. |
| **Filet de secours** | Garder l’endpoint `GET .../widgets/:id/data` (Option A) pour refresh à la demande, debug, et si Redis est down. |

Contrat API unique : `GET /api/dashboard/widgets/:id/data` consomme le cache Redis/DB si frais, sinon fetch externe.

---

## 5. Endpoints API prévus

Base URL serveur : `http://localhost:8080`  
Préfixe métier : `/api/...`  
Auth : header `Authorization: Bearer <jwt>` sauf routes publiques.

### 5.1 Auth — `/api/auth`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `POST` | `/api/auth/register` | Non | Inscription → crée user + `confirm_token` (+ abonnement weather). |
| `GET` | `/api/auth/confirm/:token` | Non | Confirme le compte (équivalent page `/confirm/:token`). |
| `POST` | `/api/auth/login` | Non | Login ; refuse si mauvais MDP ou non confirmé ; renvoie **access JWT** + **refresh token** + user public. |
| `POST` | `/api/auth/refresh` | Non* | Échange un refresh token valide contre un nouvel access token (*protégé par le secret refresh, pas l’access JWT). |
| `GET` | `/api/auth/me` | Oui | Profil courant (session). |
| `PATCH` | `/api/auth/me` | Oui | Mise à jour nom / `service_defaults` / mot de passe. |
| `POST` | `/api/auth/logout` | Oui | Invalide le refresh token côté serveur (révocation) + purge côté client. |

### 5.2 Services — `/api/services`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `GET` | `/api/services` | Oui | Liste des services + statut d’abonnement de l’utilisateur. |
| `POST` | `/api/services/:service/subscribe` | Oui | Abonnement (RSS : body `{ feed_url }` ; weather : no-op / déjà actif). |
| `DELETE` | `/api/services/:service/subscribe` | Oui | Désabonnement (révoque credentials, optionnellement archive widgets liés). |
| `GET` | `/api/services/github/oauth/start` | Oui | Redirige vers GitHub OAuth. |
| `GET` | `/api/services/github/oauth/callback` | Non* | Callback OAuth ; lie le compte puis redirige vers le frontend. |

\*Le callback est public côté HTTP mais protégé par `state` OAuth.

### 5.3 Dashboard / widgets — `/api/dashboard`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `GET` | `/api/dashboard/widgets` | Oui | Liste des instances de l’utilisateur (ordre `position`). |
| `POST` | `/api/dashboard/widgets` | Oui | Crée une instance (`widget_type`, `config`, `refresh_interval_sec`) si abonné au service. |
| `PATCH` | `/api/dashboard/widgets/:id` | Oui | Reconfigure config / refresh / position. |
| `PUT` | `/api/dashboard/widgets/order` | Oui | Persiste le nouvel ordre après drag & drop (`[{ id, position }]`). |
| `DELETE` | `/api/dashboard/widgets/:id` | Oui | Supprime l’instance. |
| `GET` | `/api/dashboard/widgets/:id/data` | Oui | **Refresh** : fetch API externe + retourne le payload (Timer). |

### 5.4 Admin — `/api/admin` (rôle `admin`)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `GET` | `/api/admin/users` | Admin | Liste utilisateurs. |
| `GET` | `/api/admin/users/:id` | Admin | Détail (+ abonnements, nb widgets). |
| `PATCH` | `/api/admin/users/:id` | Admin | Bonus : confirmer / désactiver / changer rôle. |
| `GET` | `/api/admin/stats` | Admin | Compteurs (users, widgets, refreshes…). |

### 5.5 Route imposée — `GET /about.json`

- **URL exacte :** `http://localhost:8080/about.json`  
- **Méthode :** `GET`  
- **Auth :** aucune  
- **Port :** **8080** (process `server` dans Docker)  
- **Rôle :** décrire le client appelant + l’horloge serveur + le catalogue services/widgets/params.

#### Structure exacte imposée par le sujet

```json
{
  "client": {
    "host": "127.0.0.1"
  },
  "server": {
    "current_time": 1726900000,
    "services": [
      {
        "name": "weather",
        "widgets": [
          {
            "name": "city_temperature",
            "description": "Température et ciel actuels pour une ville.",
            "params": [
              { "name": "city", "type": "string" },
              { "name": "unit", "type": "string" }
            ]
          },
          {
            "name": "precipitation_forecast",
            "description": "Chances de pluie sur les prochains jours.",
            "params": [
              { "name": "city", "type": "string" },
              { "name": "days", "type": "integer" }
            ]
          }
        ]
      },
      {
        "name": "github",
        "widgets": [
          {
            "name": "recent_commits",
            "description": "Derniers commits d'un dépôt.",
            "params": [
              { "name": "repo", "type": "string" },
              { "name": "limit", "type": "integer" }
            ]
          },
          {
            "name": "security_alerts",
            "description": "Alertes de sécurité ouvertes.",
            "params": [
              { "name": "repo", "type": "string" },
              { "name": "severity", "type": "string" }
            ]
          }
        ]
      },
      {
        "name": "rss",
        "widgets": [
          {
            "name": "article_list",
            "description": "Derniers articles d'un flux.",
            "params": [
              { "name": "feed_url", "type": "string" },
              { "name": "number", "type": "integer" }
            ]
          },
          {
            "name": "feed_summary",
            "description": "Un titre qui tourne depuis un flux.",
            "params": [
              { "name": "feed_url", "type": "string" },
              { "name": "label", "type": "string" }
            ]
          }
        ]
      }
    ]
  }
}
```

#### Règles d’implémentation (à respecter)

| Champ | Règle |
|-------|--------|
| `client.host` | IP du client HTTP (via `req.socket.remoteAddress` / `X-Forwarded-For` si derrière un proxy Docker). |
| `server.current_time` | Timestamp Unix **en secondes** (entier), pas une string ISO. |
| `services[].name` | Identifiant du service (`weather`, `github`, `rss`). |
| `widgets[].name` | Identifiant technique du type de widget. |
| `widgets[].description` | Texte libre. |
| `params[].name` | Nom du paramètre configurable. |
| `params[].type` | Uniquement `"string"` ou `"integer"`. |
| Contenu | Généré depuis `config/catalog` — **pas** un fichier JSON statique figé (sinon `current_time` et le catalogue divergent). |

Le frontend n’a **pas** besoin d’appeler `about.json` pour fonctionner au quotidien (c’est surtout une route d’audit / sujet), mais le catalogue partagé doit rester cohérent avec cette structure.

---

## 6. docker-compose.yml (description textuelle)

> Pas de fichier Compose dans ce document — uniquement le plan.

### 6.1 Services prévus

| Service Compose | Image / build | Port hôte | Rôle |
|-----------------|---------------|-----------|------|
| `server` | build `./backend` | **8080:8080** | API Express + `GET /about.json`. |
| `frontend` | build `./frontend` (nginx servant le build Vite) | **80:80** (ou 8081:80) | UI React. |
| `db` | `postgres:16-alpine` | 5432 interne (exposé optionnel en dev) | PostgreSQL persistant (`volume`). |
| `redis` | `redis:7-alpine` | interne | **Prévu (backlog)** — file BullMQ + cache payloads Timer. |

### 6.2 Communication entre services

```text
Navigateur
  │
  ├─ http://localhost/          → service frontend (nginx)
  │                                 └── proxy /api et /about.json  →  http://server:8080
  │                                 (recommandé : un seul origin pour éviter les galères CORS)
  │
  └─ (alt.) http://localhost:8080 → accès direct API / about.json (exigé par le sujet)

server (Express)
  ├── TCP db:5432          (DATABASE_URL=postgres://...@db:5432/threshold)
  └── TCP redis:6379       (si Timer BullMQ)
```

Points importants :

1. **Le sujet exige le serveur sur 8080** — `about.json` doit répondre sur ce port.  
2. Dans le réseau Docker, les services se parlent par **nom de service** (`db`, `redis`, `server`), pas `localhost`.  
3. `server` attend que `db` soit healthy (`depends_on` + healthcheck) avant de migrer / démarrer.  
4. Secrets (`JWT_SECRET`, `GITHUB_CLIENT_ID/SECRET`, mots de passe DB) via variables d’environnement / `.env` non versionné.  
5. Commandes finales attendues : `docker-compose build` puis `docker-compose up`.

### 6.3 Variante CORS vs reverse-proxy

| Approche | Description | Recommandation |
|----------|-------------|----------------|
| **A — Reverse-proxy nginx (frontend)** | Le navigateur ne parle qu’à `:80` ; nginx forward `/api/*` et `/about.json` vers `server:8080`. | Confort UX + CORS simple. |
| **B — Deux origins** | FE `:80`, API `:8080` ; CORS configuré sur Express. | OK aussi ; `about.json` reste testable directement sur `:8080`. |

On peut combiner : proxy pour l’app **et** port 8080 publié pour l’audit `about.json`.

---

## 7. Décisions ouvertes à valider

Cases à cocher en binôme avant de coder :

| # | Décision | Options | Proposition |
|---|----------|---------|-------------|
| 1 | Langage backend | JS / TS | **TS** si on veut coller au frontend, sinon JS pour vitesse |
| 2 | ORM | `pg` brut + SQL / Prisma / Knex | **Prisma** ou **SQL migrations + pg** |
| 3 | Timer | A / B / C | **C (BullMQ + Redis)** — déjà au backlog |
| 4 | Endpoint refresh à la demande | Oui / Non | **Oui** (filet + refresh manuel UI) |
| 5 | Redis dans Compose dès le début | Oui / Non | **Oui** (requis par le Timer backlog) |
| 6 | Confirmation email réelle | Lien front-only / vrai SMTP | Lien front + token DB d’abord ; SMTP = bonus |
| 7 | Chiffrement `credentials` OAuth | Non / oui (bonus) | Non au départ ; documenter le risque |
| 8 | Port frontend | 80 / 8081 | **80** (avec 8080 pour l’API) |

---

## Annexe A — Alignement avec le prototype frontend actuel

| Concept prototype | Concept cible backend |
|-------------------|------------------------|
| `localStorage` users/session | Table `users` + JWT |
| `githubConnected` / `rssUrl` | `service_subscriptions` |
| `WidgetInstance.uid` | `widget_instances.id` (UUID) |
| `widgetId` + `config` + `refresh` | `widget_type` + `config` JSONB + `refresh_interval_sec` |
| `TimerRing` → `apiRefreshWidget` | `TimerRing` → `GET /api/dashboard/widgets/:id/data` |
| `CATALOG` dans `catalog.ts` | `config/catalog` backend (+ miroir FE ou fetch) |
| Admin lecture seule | `/api/admin/...` (+ écriture en bonus) |

---

## Annexe B — Ordre de réalisation suggéré (après validation)

1. Valider ce document (cases §7).  
2. Créer le monorepo (`frontend/`, `backend/`, Compose minimal `server` + `db`).  
3. Auth complète (register → confirm → login → JWT → `/me`).  
4. CRUD widgets + abonnements services.  
5. Intégrations externes (Weather, RSS, GitHub OAuth).  
6. Brancher le Timer (Option A) sur les vrais endpoints.  
7. `GET /about.json` conforme.  
8. Docker `build` / `up` de bout en bout.  
9. Bonus (`bonus/`, Redis/BullMQ, admin avancé, SMTP, …).

---

*Fin du document — à annoter librement avec ta coéquipière (✅ / ❌ / commentaires dans les sections).*
