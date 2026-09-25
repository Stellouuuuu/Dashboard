# Delivery plan / Plan de livraison (summary)

← [Back to README](../README.md) · [Retour au README](../README.md)

[English](#english) · [Français](#français)

Le plan de travail détaillé en français reste dans [`PLAN.md`](../PLAN.md) à la racine du dépôt.

---

<a id="english"></a>

## English

Full French working notes live at the repo root as `PLAN.md` / `plan.html`. This page is the short bilingual summary.

### Target

- Module: **G-WEB-500** (group of 2 → ≥ 3 services, ≥ 6 widgets)
- Deliverable: `docker compose up` on port **8080** with valid `/about.json`
- Auth (email confirm) + at least one OAuth 2.0 link (GitHub)
- Persistable dashboard CRUD + per-widget refresh timers
- Admin user management
- Root README + `bonus/` for out-of-scope extras

### What shipped in this repo

| Area | Status |
| --- | --- |
| Docker / nginx / Mailpit | Done |
| Auth + OTP confirm + cookies | Done |
| Forgot / reset password (OTP) | Done |
| GitHub OAuth (optional env) | Done |
| 5 services / 10 widgets | Done (above minimum) |
| Dashboard CRUD + `/data` cache | Done |
| Admin + audit log | Done |
| Auto secrets + demo admin seed | Done |
| i18n fr/en | Done |

### Cut / deferred

- Google OIDC, Steam, Redis workers, full CI — see `bonus/` if revisited
- Tech-choice write-up — fill [`TECH_CHOICES.md`](./TECH_CHOICES.md)

---

<a id="français"></a>

## Français

Les notes de travail détaillées sont dans `PLAN.md` / `plan.html` à la racine. Cette page est le résumé bilingue court.

### Objectif

- Module : **G-WEB-500** (binôme → ≥ 3 services, ≥ 6 widgets)
- Livrable : `docker compose up` sur le port **8080** avec un `/about.json` valide
- Auth (confirmation email) + au moins un lien OAuth 2.0 (GitHub)
- CRUD dashboard persisté + timers de rafraîchissement par widget
- Gestion admin des utilisateurs
- README racine + `bonus/` pour les extras hors périmètre

### Ce qui est livré dans ce dépôt

| Zone | Statut |
| --- | --- |
| Docker / nginx / Mailpit | Fait |
| Auth + confirmation OTP + cookies | Fait |
| Mot de passe oublié / reset (OTP) | Fait |
| OAuth GitHub (env optionnelle) | Fait |
| 5 services / 10 widgets | Fait (au-dessus du minimum) |
| CRUD dashboard + cache `/data` | Fait |
| Admin + journal d’audit | Fait |
| Secrets auto + seed admin démo | Fait |
| i18n fr/en | Fait |

### Coupé / reporté

- OIDC Google, Steam, workers Redis, CI complète — voir `bonus/` si repris
- Rédaction des choix tech — compléter [`TECH_CHOICES.md`](./TECH_CHOICES.md)
