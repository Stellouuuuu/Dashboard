# Architecture

← [Back to README](../README.md) · [Retour au README](../README.md)

[English](#english) · [Français](#français)

---

<a id="english"></a>

## English

### Overview

Threshold is a Dockerized SPA + API. The browser only talks to nginx on port **8080**. nginx serves the built React app and proxies `/api/*` and `/about.json` to the Express API. The API owns authentication, widget configuration, caching, and outbound calls to third-party services.

### Runtime components

| Component | Role |
| --- | --- |
| **nginx** | Static assets + reverse proxy |
| **api** | Express REST API, Zod validation, Drizzle ORM |
| **postgres** | Persistent state (users, widgets, cache, audit) |
| **mailpit** | Local SMTP catcher for OTP emails (optional if using Gmail SMTP) |
| **api_secrets** | Volume holding auto-generated `JWT_SECRET` / `CRYPTO_KEY` |

### Authentication

- Email + password registration → **6-digit OTP** emailed via SMTP (Mailpit or Gmail)
- Forgot password → same OTP pattern, then set a new password
- Session: httpOnly cookies (`access_token`, `refresh_token`)
- Passwords hashed with bcrypt; OAuth tokens encrypted with AES-256-GCM (`CRYPTO_KEY`)
- Roles: `user` | `admin`

### Widget pipeline

1. User creates an instance (`POST /dashboard/widgets`) with a config validated against the **widget registry**
2. Client timer fires → `GET /dashboard/widgets/:id/data`
3. API checks `widget_cache`; on miss/stale, calls the adapter and stores the result
4. Minimum refresh interval: 30 seconds

The registry (`backend/src/widgets/registry.ts`) is the single source of truth for `/about.json`, catalogue endpoints, and config validation.

### GitHub OAuth

Optional. When `GITHUB_CLIENT_ID` / `SECRET` are unset, link endpoints return `OAUTH_NOT_CONFIGURED` (503) and GitHub widgets cannot be added (`SERVICE_OAUTH_REQUIRED`).

Scopes requested: `read:user`, `repo`, `security_events` (needed for private repos and Dependabot alerts). Organization policies may still block access to some org repositories.

### Frontend

React 19 SPA with i18n (French / English), theme toggle, and API clients under `frontend/src/api/`. Protected routes wait on `/auth/me`.

---

<a id="français"></a>

## Français

### Vue d’ensemble

Threshold est une SPA + API dockerisées. Le navigateur ne parle qu’à nginx sur le port **8080**. nginx sert l’app React buildée et proxyfie `/api/*` et `/about.json` vers l’API Express. L’API gère l’authentification, la configuration des widgets, le cache et les appels sortants vers les services tiers.

### Composants runtime

| Composant | Rôle |
| --- | --- |
| **nginx** | Assets statiques + reverse proxy |
| **api** | API REST Express, validation Zod, Drizzle ORM |
| **postgres** | État persistant (users, widgets, cache, audit) |
| **mailpit** | Catcher SMTP local pour les emails OTP (optionnel si SMTP Gmail) |
| **api_secrets** | Volume des secrets auto-générés (`JWT_SECRET` / `CRYPTO_KEY`) |

### Authentification

- Inscription email + mot de passe → **OTP à 6 chiffres** envoyé par SMTP (Mailpit ou Gmail)
- Mot de passe oublié → même schéma OTP, puis nouveau mot de passe
- Session : cookies httpOnly (`access_token`, `refresh_token`)
- Mots de passe hashés avec bcrypt ; tokens OAuth chiffrés AES-256-GCM (`CRYPTO_KEY`)
- Rôles : `user` | `admin`

### Pipeline des widgets

1. L’utilisateur crée une instance (`POST /dashboard/widgets`) avec une config validée contre le **registre de widgets**
2. Le timer client déclenche → `GET /dashboard/widgets/:id/data`
3. L’API consulte `widget_cache` ; en miss/stale, appelle l’adapter et stocke le résultat
4. Intervalle de rafraîchissement minimum : 30 secondes

Le registre (`backend/src/widgets/registry.ts`) est la seule source de vérité pour `/about.json`, les endpoints catalogue et la validation des configs.

### OAuth GitHub

Optionnel. Sans `GITHUB_CLIENT_ID` / `SECRET`, les endpoints de liaison renvoient `OAUTH_NOT_CONFIGURED` (503) et les widgets GitHub ne peuvent pas être ajoutés (`SERVICE_OAUTH_REQUIRED`).

Scopes demandés : `read:user`, `repo`, `security_events` (nécessaires pour les dépôts privés et les alertes Dependabot). Les politiques d’organisation peuvent encore bloquer l’accès à certains repos d’orga.

### Frontend

SPA React 19 avec i18n (français / anglais), bascule de thème, et clients API sous `frontend/src/api/`. Les routes protégées attendent `/auth/me`.
