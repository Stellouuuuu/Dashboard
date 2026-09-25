# Architecture

← [Back to README](../README.md)

## Overview

Threshold is a Dockerized SPA + API. The browser only talks to nginx on port **8080**. nginx serves the built React app and proxies `/api/*` and `/about.json` to the Express API. The API owns authentication, widget configuration, caching, and outbound calls to third-party services.

## Runtime components

| Component | Role |
| --- | --- |
| **nginx** | Static assets + reverse proxy |
| **api** | Express REST API, Zod validation, Drizzle ORM |
| **postgres** | Persistent state (users, widgets, cache, audit) |
| **mailpit** | Local SMTP catcher for confirmation emails |
| **api_secrets** | Volume holding auto-generated `JWT_SECRET` / `CRYPTO_KEY` |

## Authentication

- Email + password registration → confirmation token emailed via SMTP
- Session: httpOnly cookies (`access_token`, `refresh_token`)
- Passwords hashed with bcrypt; OAuth tokens encrypted with AES-256-GCM (`CRYPTO_KEY`)
- Roles: `user` | `admin`

## Widget pipeline

1. User creates an instance (`POST /dashboard/widgets`) with a config validated against the **widget registry**
2. Client timer fires → `GET /dashboard/widgets/:id/data`
3. API checks `widget_cache`; on miss/stale, calls the adapter and stores the result
4. Minimum refresh interval: 30 seconds

The registry (`backend/src/widgets/registry.ts`) is the single source of truth for `/about.json`, catalogue endpoints, and config validation.

## GitHub OAuth

Optional. When `GITHUB_CLIENT_ID` / `SECRET` are unset, link endpoints return `OAUTH_NOT_CONFIGURED` (503) and GitHub widgets cannot be added (`SERVICE_OAUTH_REQUIRED`).

## Frontend

React 19 SPA with i18n (French / English), theme toggle, and API clients under `frontend/src/api/`. Protected routes wait on `/auth/me`.
