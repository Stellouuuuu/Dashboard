# Delivery plan (summary)

← [Back to README](../README.md)

Full French working notes historically lived in the repo root as `PLAN.md` / `plan.html`. This page is the English summary for newcomers.

## Target

- Module: **G-WEB-500** (group of 2 → ≥ 3 services, ≥ 6 widgets)
- Deliverable: `docker compose up` on port **8080** with valid `/about.json`
- Auth (email confirm) + at least one OAuth 2.0 link (GitHub)
- Persistable dashboard CRUD + per-widget refresh timers
- Admin user management
- Root README + `bonus/` for out-of-scope extras

## What shipped in this repo

| Area | Status |
| --- | --- |
| Docker / nginx / Mailpit | Done |
| Auth + confirm + cookies | Done |
| GitHub OAuth (optional env) | Done |
| 5 services / 10 widgets | Done (above minimum) |
| Dashboard CRUD + `/data` cache | Done |
| Admin + audit log | Done |
| Auto secrets + demo admin seed | Done |
| i18n fr/en | Done |

## Cut / deferred

- Google OIDC, Steam, Redis workers, full CI — see `bonus/` if revisited
- Tech-choice write-up — fill [`TECH_CHOICES.md`](./TECH_CHOICES.md)
