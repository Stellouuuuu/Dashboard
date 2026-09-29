# ✅ Vérification exhaustive des exigences du sujet

> Ce document croise chaque exigence du PDF du projet Dashboard EPITECH (G-WEB-500, binôme X = 2) avec l'état actuel du code dans le dépôt.

---

## 1. Workflow global

| # | Exigence | Statut | Preuve |
|---|----------|--------|--------|
| 1.1 | L'utilisateur crée un compte et confirme son inscription | ✅ Fait | `POST /api/v1/auth/register` + `POST /api/v1/auth/confirm` (OTP 6 chiffres par email) |
| 1.2 | Il s'authentifie et accède à la plateforme | ✅ Fait | `POST /api/v1/auth/login` → JWT cookie HttpOnly |
| 1.3 | Il s'abonne aux services souhaités (OAuth ou identifiants) | ✅ Fait | `POST /api/v1/services/:name/subscribe` + OAuth GitHub |
| 1.4 | Chaque service propose un ensemble de widgets | ✅ Fait | `GET /api/v1/widgets` retourne le catalogue depuis `widgets/registry.ts` |
| 1.5 | Il construit son dashboard en ajoutant des instances configurées | ✅ Fait | `POST /api/v1/dashboard/widgets` avec config JSON |
| 1.6 | Un Timer rafraîchit périodiquement les données | ✅ Fait | `useWidgetRefresh.ts` + `TimerRing.tsx` côté front, `refreshRate` persisté en BD |

---

## 2. User management

| # | Exigence | Statut | Preuve |
|---|----------|--------|--------|
| 2.1 | Inscription via formulaire (email/mot de passe) | ✅ Fait | `RegisterPage.tsx` + `auth.controller.ts` (register) |
| 2.2 | Confirmation d'inscription avant accès | ✅ Fait | OTP 6 chiffres hashé en BD (`emailTokens`), `ConfirmPage.tsx` |
| 2.3 | Section d'administration pour gérer les utilisateurs | ✅ Fait | `AdminPage.tsx` + `admin.controller.ts` (liste, suspend, delete) |

---

## 3. Identity & permissions

| # | Exigence | Statut | Preuve |
|---|----------|--------|--------|
| 3.1 | Authentification (identifie l'utilisateur) | ✅ Fait | JWT access token (15 min) + refresh token (cookie HttpOnly) |
| 3.2 | Autorisation (widgets accèdent aux services via OAuth 2.0) | ✅ Fait | OAuth GitHub → token chiffré AES-256-GCM → utilisé par les widgets GitHub |
| 3.3 | Lier le compte tiers à un utilisateur existant | ✅ Fait | `github-oauth.service.ts` + table `oauth_accounts` |
| 3.4 | RBAC : user / admin | ✅ Fait | Champ `role` dans table `users`, middleware `requireAdmin` |

---

## 4. Abonnement aux services

| # | Exigence | Statut | Preuve |
|---|----------|--------|--------|
| 4.1 | Services sans compte externe disponibles par défaut | ✅ Fait | Weather, RSS, Finance, HackerNews ne nécessitent aucun OAuth |
| 4.2 | Services avec compte : OAuth pour lier | ✅ Fait | GitHub nécessite OAuth → `ServicesPage.tsx` + `OAuthModal.tsx` |
| 4.3 | Données sensibles manipulées avec prudence | ✅ Fait | Tokens chiffrés AES-256-GCM (`lib/crypto.ts`), jamais exposés au frontend |

---

## 5. Widgets

| # | Exigence | Statut | Preuve |
|---|----------|--------|--------|
| 5.1 | Chaque service offre plusieurs widgets | ✅ Fait | 5 services × 2 widgets = **10 widgets** (au-dessus du minimum de 6) |
| 5.2 | Les instances sont configurables | ✅ Fait | `WizardModal.tsx` → formulaire dynamique basé sur `params` du registre |
| 5.3 | **Un widget doit avoir au moins un paramètre configurable** | ✅ Fait | Tous les 10 widgets ont >= 1 paramètre (vérifié dans `registry.ts`) |
| 5.4 | Deux instances du même widget avec configs différentes affichent des infos distinctes | ✅ Fait | Config stockée par instance (`widget_instances.config` en JSONB) |

---

## 6. Timer

| # | Exigence | Statut | Preuve |
|---|----------|--------|--------|
| 6.1 | Chaque instance communique son refresh rate au Timer | ✅ Fait | `refreshRate` persisté en BD, configurable par l'utilisateur |
| 6.2 | Le Timer déclenche les mises à jour aux intervalles appropriés | ✅ Fait | `useWidgetRefresh.ts` (front) + endpoint `GET /api/v1/dashboard/widgets/:id/data` |
| 6.3 | Refresh rate minimum 30 secondes | ✅ Fait | Enforced côté serveur |

---

## 7. Dashboard

| # | Exigence | Statut | Preuve |
|---|----------|--------|--------|
| 7.1 | Ajouter un widget (type, configurer, refresh rate, confirmer) | ✅ Fait | `WizardModal.tsx` → `POST /api/v1/dashboard/widgets` |
| 7.2 | Reconfigurer une instance existante | ✅ Fait | `PATCH /api/v1/dashboard/widgets/:id` |
| 7.3 | Déplacer une instance (drag & drop) | ✅ Fait | `WidgetGrid.tsx` avec @dnd-kit |
| 7.4 | Supprimer une instance | ✅ Fait | `DELETE /api/v1/dashboard/widgets/:id` |

---

## 8. Services & Widgets (X = 2 → min 3 services / 6 widgets)

| Service | Widget | Paramètres | Statut |
|---------|--------|------------|--------|
| **Weather** | `city_temperature` | `city` (string), `unit` (string) | ✅ Fait |
| **Weather** | `precipitation_forecast` | `city` (string), `days` (integer) | ✅ Fait |
| **GitHub** | `recent_commits` | `repository` (string), `limit` (integer) | ✅ Fait |
| **GitHub** | `security_alerts` | `repository` (string), `severity` (string) | ✅ Fait |
| **RSS** | `article_list` | `link` (string), `number` (integer) | ✅ Fait |
| **RSS** | `feed_summary` | `links` (string), `number` (integer) | ✅ Fait |
| **Finance** | `exchange_rate` | `base` (string), `target` (string) | ✅ Fait (bonus) |
| **Finance** | `crypto_price` | `coin` (string), `currency` (string) | ✅ Fait (bonus) |
| **Hacker News** | `top_stories` | `number` (integer) | ✅ Fait (bonus) |
| **Hacker News** | `story_search` | `query` (string), `number` (integer) | ✅ Fait (bonus) |

**Total : 5 services, 10 widgets** — largement au-dessus du minimum requis (3 services, 6 widgets).

---

## 9. Endpoint `/about.json` (exigence stricte)

| # | Exigence | Statut | Preuve |
|---|----------|--------|--------|
| 9.1 | Répond sur `http://localhost:8080/about.json` | ✅ Fait | Route dans `about.routes.ts`, proxy nginx configuré |
| 9.2 | Contient `client.host` (IP du client) | ✅ Fait | `req.ip` avec `trust proxy` activé dans `app.ts` |
| 9.3 | Contient `server.current_time` (timestamp UNIX en secondes) | ✅ Fait | `Math.floor(Date.now() / 1000)` |
| 9.4 | Contient `server.services[]` avec les widgets et params | ✅ Fait | Généré dynamiquement depuis `widgets/registry.ts` |
| 9.5 | Types de params uniquement `string` et `integer` | ✅ Fait | Vérifié dans le registre |

---

## 10. Docker & Livraison

| # | Exigence | Statut | Preuve |
|---|----------|--------|--------|
| 10.1 | `docker-compose.yml` à la racine | ✅ Fait | `./docker-compose.yml` présent |
| 10.2 | `docker compose build` + `docker compose up` fonctionnent | ✅ Fait | Testé et fonctionnel |
| 10.3 | Service serveur sur port **8080** | ✅ Fait | nginx expose `8080:80` |
| 10.4 | `http://localhost:8080/about.json` répond correctement | ✅ Fait | Vérifié par `tests/run_tests.sh` |
| 10.5 | Aucun service cloud tiers — tout tourne en local | ✅ Fait | PostgreSQL + Mailpit en conteneurs |

---

## 11. Livrables

| # | Exigence | Statut | Preuve |
|---|----------|--------|--------|
| 11.1 | Code source (hors binaires, temp, objets) | ✅ Fait | `.gitignore` configuré |
| 11.2 | `README.md` complet | ✅ Fait | 438 lignes, bilingue FR/EN |
| 11.3 | `docker-compose.yml` à la racine | ✅ Fait | Présent |
| 11.4 | Dossier `bonus/` | ✅ Fait | `bonus/README.md` présent |

---

## 12. Contenu obligatoire du README.md

| # | Exigence | Statut | Preuve |
|---|----------|--------|--------|
| 12.1 | Liste des fonctionnalités clés, services et widgets | ✅ Fait | Tableau complet des 10 widgets |
| 12.2 | Étapes reproductibles pour installer et builder | ✅ Fait | Section "Quick start" avec 3 commandes |
| 12.3 | Aperçu de l'objectif et cas d'utilisation | ✅ Fait | Introduction + section "What you can do" |
| 12.4 | Instructions pour lancer et utiliser l'app | ✅ Fait | Section "Usage" en 6 étapes |
| 12.5 | Technologies utilisées et structure du système | ✅ Fait | Tableau "Stack" + "Repository structure" |
| 12.6 | Schémas de conception | ✅ Fait | 3 diagrammes Mermaid |

---

## 13. Sécurité

| # | Exigence | Statut | Preuve |
|---|----------|--------|--------|
| 13.1 | JWT (access + refresh) | ✅ Fait | `lib/token.ts`, cookie HttpOnly |
| 13.2 | Validation des entrées (Zod) | ✅ Fait | `validate.middleware.ts` + schémas Zod |
| 13.3 | Rate limiting | ✅ Fait | `rateLimit.middleware.ts` |
| 13.4 | Chiffrement des tokens OAuth au repos | ✅ Fait | AES-256-GCM dans `lib/crypto.ts` |
| 13.5 | Secrets pas commités | ✅ Fait | `.env.example` fourni, `.env` dans `.gitignore` |
| 13.6 | Audit logs | ✅ Fait | Table `audit_logs` + `lib/audit.ts` |

---

## 14. Fonctionnalités bonus implémentées

| Bonus | Statut |
|-------|--------|
| i18n FR/EN | ✅ Fait |
| Mot de passe oublié (OTP) | ✅ Fait |
| 2 services supplémentaires (Finance + HackerNews) | ✅ Fait |
| 4 widgets supplémentaires | ✅ Fait |
| Page profil utilisateur | ✅ Fait |
| Secrets auto-générés au premier boot | ✅ Fait |
| Admin démo avec mot de passe logué | ✅ Fait |
| Documentation HTML intégrée | ✅ Fait |

---

## Résultat final

| Catégorie | Obligatoire | Implémenté | Statut |
|-----------|-------------|------------|--------|
| Services | 3 minimum | **5** | ✅ |
| Widgets | 6 minimum | **10** | ✅ |
| User management | Inscription + confirm + admin | Tout fait | ✅ |
| Auth | JWT + OAuth | JWT + OAuth GitHub | ✅ |
| Dashboard CRUD | Ajouter / configurer / déplacer / supprimer | Tout fait | ✅ |
| Timer | Refresh automatique | Implémenté front + back | ✅ |
| `/about.json` | Format exact du sujet | Conforme | ✅ |
| Docker | `docker compose build/up` sur port 8080 | Fonctionnel | ✅ |
| README | Documentation complète | 438 lignes bilingue | ✅ |

> **🎯 Toutes les exigences obligatoires sont vérifiées sans exception.**
