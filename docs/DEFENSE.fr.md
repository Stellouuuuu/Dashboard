# Préparation soutenance - Threshold Dashboard

← [Retour au README](../README.md) · [English version](./DEFENSE.md)

Document de travail pour la soutenance orale. Chaque affirmation technique ci-dessous a été vérifiée dans le code de la branche `develop` (chemin du fichier précisé à chaque fois). À lire avec ton binôme avant la soutenance - rien à cocher ici, ce n'est pas la grille de notation (voir `defense_kit.md`, supprimé une fois ce document créé), c'est le corrigé pour cette grille.

---

## 1. Démarrage du projet

- `docker-compose.yml` (racine du repo) définit 4 services : `nginx`, `api`, `postgres`, `mailpit`.
- `nginx` expose le **port 8080** (`docker-compose.yml:11`, `"8080:80"`) et sert la SPA buildée, en proxyfiant `/api/*` et `/about.json` vers `api` (`nginx/nginx.conf`).
- Aucune étape manuelle requise : `JWT_SECRET` et `CRYPTO_KEY` sont auto-générés au premier démarrage par `backend/src/config/secrets.ts` et persistés dans le volume Docker `api_secrets` (monté sur `/data/secrets`, voir `docker-compose.yml:39`). Le compte admin de démo est créé par `backend/src/db/seed-admin.ts`, exécuté depuis `backend/src/server.ts:7` avant que le serveur commence à écouter.
- L'ordre de démarrage est garanti par `depends_on` + un healthcheck Postgres (`docker-compose.yml:40-44`, `pg_isready`) : `api` attend que `postgres` soit réellement prêt, pas juste démarré.

## 2. `/about.json`

- Route : `GET /about.json` → `backend/src/modules/about/about.routes.ts` → `getAbout` dans `backend/src/modules/about/about.controller.ts`.
- `client.host` vient de `req.ip`, ce qui nécessite `app.set("trust proxy", 1)` dans `backend/src/app.ts:17` - sans ça, derrière nginx, `req.ip` renverrait l'adresse du proxy au lieu de celle du client.
- `server.current_time` est `Math.floor(Date.now() / 1000)` - secondes Unix (`about.controller.ts:26`).
- `server.services[]` est généré en regroupant `listWidgetDefinitions()` du registre par `service` (`about.controller.ts:12-21`) - rien n'est écrit à la main ici ; ajouter un widget au registre met automatiquement à jour cet endpoint.
- Les types de paramètres exposés sont uniquement `"string"` et `"integer"` (`WidgetParam["type"]`, `backend/src/widgets/registry.ts:10`).

## 3. Comptes

- Inscription : `POST /api/v1/auth/register` (`auth.routes.ts:22`) → `auth.service.ts:register` - mot de passe hashé avec **bcrypt, coût 12** (`auth.service.ts:58`), compte créé avec `emailConfirmed: false` (`db/schema.ts:21`), puis un OTP à 6 chiffres est envoyé par email.
- Vérification : l'OTP est un code aléatoire à 6 chiffres (`lib/token.ts:generateOtpCode`, `randomInt` complété à 6 chiffres), valable **15 minutes** (`auth.service.ts:12`, `OTP_TTL_MS`), stocké **hashé en SHA-256** dans `email_tokens.token_hash` (`lib/token.ts:hashToken`, `db/schema.ts:28-34`) - jamais en clair.
- Connexion : `POST /api/v1/auth/login` exige un compte confirmé et non suspendu (`auth.service.ts:121-123`) et renvoie deux cookies httpOnly (`auth.controller.ts:16-34`) : `access_token` (JWT, 15 min) et `refresh_token` (token opaque aléatoire, 30 jours, restreint au path `/api/v1/auth`).
- Lisibilité des mots de passe/tokens : les mots de passe ne sont jamais stockés en clair (hash bcrypt uniquement, `users.password_hash`) ; les refresh tokens et codes OTP sont stockés en hash SHA-256, jamais bruts ; les tokens OAuth sont stockés chiffrés AES-256-GCM (`oauth_accounts.access_token`, voir §5). Rien n'est non plus loggé en clair - `error.middleware.ts:10` logge l'objet erreur, pas les tokens.
- Comptes externes : GitHub est connecté via OAuth 2.0 **pour l'utilisateur actuellement connecté** - le flux de liaison exige `requireAuth` sur `GET /api/v1/auth/oauth/github` (`auth.routes.ts:36`) et le JWT `state` transporte `sub: userId` (`github-oauth.service.ts:49-53`), donc le callback (qui lui n'a pas de session, voir §5) lie toujours au compte qui a initié le flux.

## 4. Services et widgets

- **5 services**, **10 widgets** - 2 par service - tous déclarés dans le registre unique `backend/src/widgets/registry.ts:47-184` :

  | Service | Widgets |
  | --- | --- |
  | `weather` | `city_temperature`, `precipitation_forecast` |
  | `github` | `security_alerts`, `recent_commits` |
  | `rss` | `feed_summary`, `article_list` |
  | `finance` | `exchange_rate`, `crypto_price` |
  | `hackernews` | `top_stories`, `story_search` |

- Utilisables sans abonnement : `weather`, `rss`, `finance`, `hackernews` - `services.service.ts:8-10` n'exige l'OAuth que pour `github` (`OAUTH_REQUIRED = new Set(["github"])`) ; les quatre autres sont marqués `subscribed: true` sans condition (`services.service.ts:29`).
- Chaque paramètre de widget est typé (`"string" | "integer"`, `registry.ts:10`) et validé par un `schema` Zod propre à chaque widget (ex : `precipitation_forecast.days` doit être un entier entre 1 et 7, `registry.ts:72` ; les codes devise de `exchange_rate` doivent matcher `/^[A-Za-z]{3}$/`, `registry.ts:141-142`).
- Deux instances du même widget avec des configs différentes donnent des résultats différents au même instant car la config est stockée **par instance** dans `widget_instances.config` (JSONB, `db/schema.ts:67`) et la clé de cache par widget est l'**id de l'instance**, pas le nom du widget (`widget_cache.widget_instance_id`, `db/schema.ts:75-76`) - deux instances ne partagent jamais de ligne de cache.

## 5. Où vit chaque mécanisme

| Mécanisme | Fichier(s) |
| --- | --- |
| Hash du mot de passe | `backend/src/modules/auth/auth.service.ts` (`bcrypt.hash(password, 12)`) |
| Émission JWT access/refresh | `backend/src/modules/auth/auth.service.ts` (`signAccessToken`, `issueRefreshToken`) + `backend/src/lib/token.ts` |
| Garde d'authentification (vérification JWT) | `backend/src/middleware/auth.middleware.ts` (`requireAuth`, `requireAdmin`) |
| Génération/vérification OTP (inscription + mot de passe oublié) | `backend/src/lib/token.ts` (`generateOtpCode`, `hashToken`) + `backend/src/modules/auth/auth.service.ts` (`issueAndSendOtp`, `confirmEmail`, `resetPassword`) |
| Envoi de l'email OTP | `backend/src/lib/mailer.ts` (nodemailer/SMTP) + `backend/src/lib/emailTemplates.ts` (contenu HTML) |
| OAuth GitHub (URL d'autorisation, state, callback, échange de token) | `backend/src/modules/auth/github-oauth.service.ts` |
| Chiffrement des tokens/secrets au repos (AES-256-GCM) | `backend/src/lib/crypto.ts` (`encrypt`/`decrypt`), clé = `CRYPTO_KEY` depuis `backend/src/config/env.ts` |
| Persistance des secrets auto-générés (`JWT_SECRET`, `CRYPTO_KEY`) | `backend/src/config/secrets.ts` (écrit dans `SECRETS_DIR`, volume Docker `api_secrets`) |
| Registre des widgets (catalogue + validation config, source unique de vérité) | `backend/src/widgets/registry.ts` |
| Cache par instance de widget (lecture/écriture) | `backend/src/modules/dashboard/dashboard.repository.ts` (`getCachedPayload`, `upsertCachedPayload`) lisant/écrivant la table `widget_cache` (`backend/src/db/schema.ts:74-80`) |
| Décision de fraîcheur du cache / re-fetch | `backend/src/modules/dashboard/dashboard.service.ts:fetchWidgetData` (compare l'âge du payload à `instance.refreshRate`) |
| Plancher du refresh rate (30s) | `backend/src/config/constants.ts` (`REFRESH_RATE_MIN: 30`), appliqué dans `dashboard.service.ts:addWidget`/`reconfigureWidget` via `Math.max(...)` |
| Timer de rafraîchissement côté client | `frontend/src/dashboard/useWidgetRefresh.ts` (hook) + `frontend/src/dashboard/TimerRing.tsx` (compte à rebours visuel) |
| Rate limiting | `backend/src/middleware/rateLimit.middleware.ts` (`apiLimiter` : 100 req/min/IP global, `authLimiter` : 10 req/min/IP sur `/auth/*`) |
| Validation des entrées (Zod) | `backend/src/middleware/validate.middleware.ts` + `*.schemas.ts` par module |
| Mise en forme centralisée des erreurs | `backend/src/lib/httpError.ts` (`HttpError`, `ERROR_CODES`) + `backend/src/middleware/error.middleware.ts` |
| Journal d'audit | `backend/src/lib/audit.ts` (`logAudit`, `AUDIT_ACTIONS`) écrivant dans la table `audit_logs` |
| RBAC (`user` / `admin`) | Colonne `users.role` (`db/schema.ts:20`) + `requireAdmin` (`auth.middleware.ts:40`) |
| Amorçage du compte admin de démo | `backend/src/db/seed-admin.ts` |

## 6. Routes - méthode, auth, validation, codes de statut

Chemin de base `/api/v1` (proxyfié par nginx). Toutes les routes authentifiées reposent sur le cookie httpOnly `access_token` vérifié par `requireAuth` ; les routes admin vérifient en plus `role === "admin"` via `requireAdmin`.

### Publiques

| Méthode & chemin | Auth | Validation | Statuts possibles |
| --- | --- | --- | --- |
| `GET /about.json` | aucune | - | `200` |
| `GET /api/v1/widgets` | aucune | - | `200` |
| `GET /api/v1/widgets/:name` | aucune | - | `200`, `404` (widget inconnu) |
| `POST /api/v1/auth/register` | aucune | `registerSchema` (email, mot de passe ≥12 caractères, `confirmPassword` identique, nom) | `201`, `400` (`VALIDATION_ERROR`), `409` (`AUTH_EMAIL_TAKEN`), `429` (`RATE_LIMITED`) |
| `POST /api/v1/auth/confirm` | aucune | `confirmSchema` (email + code à 6 chiffres) | `200`, `400` (`VALIDATION_ERROR` ou `AUTH_CONFIRM_TOKEN_INVALID`), `429` |
| `POST /api/v1/auth/resend-confirm` | aucune | `resendConfirmSchema` (email) | `200` (toujours neutre, pas d'énumération), `429` |
| `POST /api/v1/auth/forgot-password` | aucune | `forgotPasswordSchema` (email) | `200` (toujours neutre), `429` |
| `POST /api/v1/auth/reset-password` | aucune | `resetPasswordSchema` (email, code, newPassword ≥12) | `200`, `400` (`VALIDATION_ERROR` ou `AUTH_RESET_TOKEN_INVALID`), `429` |
| `POST /api/v1/auth/login` | aucune | `loginSchema` (email, mot de passe) | `200`, `400` (`VALIDATION_ERROR`), `401` (`AUTH_INVALID_CREDENTIALS`), `403` (`AUTH_EMAIL_NOT_CONFIRMED` ou `AUTH_ACCOUNT_SUSPENDED`), `429` |
| `POST /api/v1/auth/refresh` | cookie refresh | - | `200`, `401` (`AUTH_SESSION_EXPIRED` si cookie absent/invalide), `429` |
| `POST /api/v1/auth/logout` | aucune (lit le cookie s'il existe) | - | `204` |

### Authentifiées (`requireAuth`)

| Méthode & chemin | Auth | Validation | Statuts possibles |
| --- | --- | --- | --- |
| `GET /api/v1/auth/me` | ✅ | - | `200`, `401` (`AUTH_UNAUTHENTICATED`/`AUTH_TOKEN_INVALID`), `404` (`AUTH_USER_NOT_FOUND`) |
| `PATCH /api/v1/auth/profile` | ✅ | `updateProfileSchema` (nom, 1-80 caractères) | `200`, `400` (`VALIDATION_ERROR`), `401` |
| `PATCH /api/v1/auth/language` | ✅ | `setLanguageSchema` (`"fr"\|"en"`) | `204`, `400`, `401` |
| `POST /api/v1/auth/change-password` | ✅ | `changePasswordSchema` (currentPassword, newPassword ≥12) | `204`, `400` (`VALIDATION_ERROR`), `401` (`AUTH_CURRENT_PASSWORD_INCORRECT`), `404` (`AUTH_USER_NOT_FOUND`) |
| `DELETE /api/v1/auth/me` | ✅ | `deleteAccountSchema` (password) | `204`, `400`, `401` (`AUTH_CURRENT_PASSWORD_INCORRECT`), `404` |
| `GET /api/v1/auth/oauth/github` | ✅ | - | `302` redirection vers GitHub, `503` (`OAUTH_NOT_CONFIGURED`) |
| `GET /api/v1/auth/oauth/github/callback` | aucune (identité via `state` signé, voir §3) | paramètres query `code`/`state` | `302` redirection vers `/services?github=linked` ou `?github=error`, `400` JSON inline si `code`/`state` manquants |
| `DELETE /api/v1/auth/oauth/github` | ✅ | - | `204` |
| `GET /api/v1/services` | ✅ | - | `200`, `401` |
| `POST /api/v1/services/:name/subscribe` | ✅ | - | `204`, `400` (`SERVICE_OAUTH_REQUIRED`), `404` (`SERVICE_UNKNOWN`) |
| `DELETE /api/v1/services/:name/subscribe` | ✅ | - | `204`, `400` (`SERVICE_CANNOT_UNSUBSCRIBE_DEFAULT`), `404` (`SERVICE_UNKNOWN`) |
| `GET /api/v1/dashboard` | ✅ | - | `200`, `401` |
| `POST /api/v1/dashboard/widgets` | ✅ | vérif. manuelle (`widgetName`, `config` requis) + `schema` Zod du widget | `201`, `400` (`VALIDATION_ERROR`, `SERVICE_OAUTH_REQUIRED`, `DASHBOARD_CONFIG_INVALID`), `404` (`DASHBOARD_WIDGET_UNKNOWN`) |
| `PATCH /api/v1/dashboard/widgets/:id` | ✅ | vérif. manuelle (`config` requis) + `schema` Zod du widget | `200`, `400` (`VALIDATION_ERROR`, `DASHBOARD_CONFIG_INVALID`), `404` (`DASHBOARD_INSTANCE_NOT_FOUND`, `DASHBOARD_WIDGET_UNKNOWN`) |
| `PATCH /api/v1/dashboard/widgets/:id/position` | ✅ | vérif. manuelle (`position` requis) | `200`, `400` (`VALIDATION_ERROR`), `404` (`DASHBOARD_INSTANCE_NOT_FOUND`) |
| `GET /api/v1/dashboard/widgets/:id/data` | ✅ | - | `200`, `404` (`DASHBOARD_INSTANCE_NOT_FOUND`, `DASHBOARD_ADAPTER_MISSING`), `502` (`DASHBOARD_FETCH_FAILED`) |
| `DELETE /api/v1/dashboard/widgets/:id` | ✅ | - | `204`, `404` (`DASHBOARD_INSTANCE_NOT_FOUND`) |

### Admin (`requireAdmin`)

| Méthode & chemin | Auth | Validation | Statuts possibles |
| --- | --- | --- | --- |
| `GET /api/v1/admin/stats` | ✅ admin | - | `200`, `401`, `403` (`AUTH_FORBIDDEN`) |
| `GET /api/v1/admin/audit-log` | ✅ admin | - | `200`, `401`, `403` |
| `GET /api/v1/admin/users` | ✅ admin | - | `200`, `401`, `403` |
| `PATCH /api/v1/admin/users/:id` | ✅ admin | `updateUserSchema` (`suspended?`, `role?`) + garde anti-auto-démotion | `200`, `400` (`ADMIN_SELF_ROLE_CHANGE_FORBIDDEN`, `VALIDATION_ERROR`), `401`, `403`, `404` (`ADMIN_USER_NOT_FOUND`) |
| `DELETE /api/v1/admin/users/:id` | ✅ admin | garde anti-auto-suppression | `204`, `400` (`ADMIN_SELF_DELETE_FORBIDDEN`), `401`, `403`, `404` (`ADMIN_USER_NOT_FOUND`) |

### Statuts transverses

- `429` (`RATE_LIMITED`) peut survenir sur n'importe quelle route derrière `apiLimiter` (100 req/min/IP, `app.ts:22`) ; les routes auth sont en plus derrière `authLimiter` (10 req/min/IP).
- `404` avec `code: "NOT_FOUND"` pour toute route non matchée (`error.middleware.ts:notFoundHandler`).
- `500` avec `code: "INTERNAL_ERROR"` en fallback pour toute erreur non interceptée (`error.middleware.ts:errorHandler`).

## 7. Tous les codes d'erreur (`backend/src/lib/httpError.ts`)

`ERROR_CODES` est la liste exhaustive et stable que le frontend traduit (`frontend/src/i18n/locales/{fr,en}.json → errors.<CODE>`). Ne jamais traduire le `message` brut (français, logs serveur uniquement) :

`AUTH_EMAIL_TAKEN`, `AUTH_INVALID_CREDENTIALS`, `AUTH_EMAIL_NOT_CONFIRMED`, `AUTH_ACCOUNT_SUSPENDED`, `AUTH_CONFIRM_TOKEN_INVALID`, `AUTH_RESET_TOKEN_INVALID`, `AUTH_SESSION_EXPIRED`, `AUTH_UNAUTHENTICATED`, `AUTH_TOKEN_INVALID`, `AUTH_FORBIDDEN`, `AUTH_CURRENT_PASSWORD_INCORRECT`, `AUTH_USER_NOT_FOUND`, `OAUTH_NOT_CONFIGURED`, `OAUTH_STATE_INVALID`, `OAUTH_EXCHANGE_FAILED`, `SERVICE_UNKNOWN`, `SERVICE_OAUTH_REQUIRED`, `SERVICE_CANNOT_UNSUBSCRIBE_DEFAULT`, `DASHBOARD_WIDGET_UNKNOWN`, `DASHBOARD_CONFIG_INVALID`, `DASHBOARD_INSTANCE_NOT_FOUND`, `DASHBOARD_ADAPTER_MISSING`, `DASHBOARD_FETCH_FAILED`, `ADMIN_USER_NOT_FOUND`, `ADMIN_SELF_ROLE_CHANGE_FORBIDDEN`, `ADMIN_SELF_DELETE_FORBIDDEN`, `VALIDATION_ERROR`, `RATE_LIMITED`, `INTERNAL_ERROR`.

## 8. Registre des widgets - noms exacts des paramètres (`backend/src/widgets/registry.ts`)

| Clé widget | Service | Paramètres (`nom : type`) |
| --- | --- | --- |
| `city_temperature` | weather | `city: string`, `unit: string` |
| `precipitation_forecast` | weather | `city: string`, `days: integer` (1-7) |
| `security_alerts` | github | `repository: string` (owner/repo), `severity: string` (optionnel) |
| `recent_commits` | github | `repository: string` (owner/repo), `limit: integer` (1-20) |
| `feed_summary` | rss | `links: string` (URLs séparées par virgules), `number: integer` (1-20) |
| `article_list` | rss | `link: string` (URL), `number: integer` (1-20) |
| `exchange_rate` | finance | `base: string` (ISO-3), `target: string` (ISO-3) |
| `crypto_price` | finance | `coin: string` (id CoinGecko), `currency: string` |
| `top_stories` | hackernews | `number: integer` (1-30) |
| `story_search` | hackernews | `query: string`, `number: integer` (1-30) |

## 9. Où vit le cache

- Stockage : table Postgres `widget_cache` (`backend/src/db/schema.ts:74-80`) - clé primaire `widget_instance_id` (une ligne par **instance** de widget, pas par type de widget), colonnes `payload` (JSONB) et `fetched_at`.
- Lecture/écriture : `backend/src/modules/dashboard/dashboard.repository.ts` (`getCachedPayload`, `upsertCachedPayload`).
- Vérification de fraîcheur : `dashboard.service.ts:fetchWidgetData` calcule `ageSec = (now - fetchedAt) / 1000` et sert le payload en cache si `ageSec < instance.refreshRate` ; sinon il appelle l'adaptateur du widget, stocke le résultat frais, et met à jour `widget_instances.status` (`"ok"`/`"error"`, `dashboard.repository.ts:updateRefreshStatus`).
- Refresh rate minimum : 30 secondes, imposé côté serveur (`config/constants.ts:REFRESH_RATE_MIN`), indépendamment de ce que demande le client.

## 10. Tests & CI

- Tests unitaires backend : **Vitest**, configuré dans `backend/vitest.config.ts`, lancé avec `npm run test` (`backend/package.json:9`). Couverture au moment de ce document : `lib/crypto.ts` (aller-retour encrypt/decrypt, non-déterminisme via l'IV aléatoire, détection d'altération via le tag d'authentification GCM), `lib/httpError.ts` (tous les `ERROR_CODES` présents), `lib/token.ts` (`generateToken`, `generateOtpCode`, `hashToken`), `widgets/registry.ts` (tous les widgets présents, les schémas Zod rejettent les configs invalides), `config/constants.ts` (plancher du refresh rate). Voir `tests/README_UNIT_TESTS.md` pour la justification complète par fichier.
- Aucune suite de tests end-to-end/navigateur et aucun pipeline CI (pas de `.github/workflows`) n'existent sur la branche `develop` au moment de la rédaction - **À compléter par nous** si ça change avant la soutenance.
- `tests/run_tests.sh` et `tests/README.md` croisent les exigences fonctionnelles du projet avec le code (checklist de vérification manuelle, pas une suite automatisée).

## 11. Interface & accessibilité

- Voir `docs/ACCESSIBILITY.md` pour ce qui a été implémenté.
- i18n : français/anglais, `frontend/src/i18n/locales/{fr,en}.json`, préférence de langue persistée sur le compte (`users.language`, `PATCH /api/v1/auth/language`).

## 12. Choix technologiques

Voir `docs/TECH_CHOICES.md` pour le tableau comparatif (décision / alternatives envisagées / pourquoi) par couche, plus une conclusion transverse en fin de fichier (ajoutée après la mi-défense, qui avait noté "all criteria met, but no conclusion provided").

### 12.1 Grille de réponse "Decision-making" (mi-défense : 1/4 impact, 1/3 justification, 0/3 alternative - le plus gros trou du rendu)

Le contenu existe déjà dans `TECH_CHOICES.md` et `PLAN.md` ; ce qui a manqué à l'oral, c'est de le structurer clairement en 4 temps pour CHAQUE décision questionnée. Ne pas réciter le tableau comparatif tel quel - répondre dans cet ordre, à voix haute :

1. **Décidé** : quoi, en une phrase.
2. **Vs alternatives** : au moins 2, avec un critère concret de rejet (pas juste "on connaissait déjà X").
3. **Impact** : gain ET coût réel - un exemple vécu compte plus qu'un tableau. Le meilleur exemple du projet : *Render bloque le SMTP sortant (ports 25/465/587) sur son plan gratuit → `nodemailer` restait bloqué indéfiniment (`ETIMEDOUT`, aucun timeout configuré) → remplacé par l'API HTTP de Brevo (port 443, jamais bloqué) pour l'envoi en prod, `nodemailer`/Mailpit gardé pour le dev local (`backend/src/lib/mailer.ts`, bascule sur `BREVO_API_KEY`).* C'est un impact réel, découvert en déployant, pas anticipé dans le plan initial - exactement ce que "impact assessment" évalue.
4. **Alternative proposée** : ce qu'on ferait différemment avec plus de temps/un contexte différent. Ne pas laisser cette question sans réponse (c'est ce qui a valu le 0/3) - voir la conclusion de `TECH_CHOICES.md` pour des réponses déjà rédigées (NestJS, worker BullMQ proactif).

**3-4 décisions à préparer avec ce canevas avant la soutenance finale :**

| Décision | Résumé rapide (1) | Alternative(s) + pourquoi rejetée (2) | Impact réel vécu (3) | Ce qu'on changerait (4) |
| --- | --- | --- | --- | --- |
| Timer de refresh : client + cache serveur, pas de worker | `useWidgetRefresh.ts`/`TimerRing.tsx` côté front, `dashboard.service.ts:fetchWidgetData` compare l'âge du cache côté back | BullMQ+Redis (écarté : `PLAN.md` §1, deadline 8 jours) ; polling sans cache (écarté : gaspille les quotas tiers, ex. GitHub 60 req/h) | Le serveur ne travaille que quand un widget est réellement affiché - zéro infra de queue à monitorer/expliquer | Avec 3 mois au lieu de 8 jours : worker BullMQ pour rafraîchir en fond même dashboard fermé (voir conclusion `TECH_CHOICES.md`) |
| Auth : cookies httpOnly, pas bearer/localStorage | `auth.service.ts` (JWT 15 min + refresh 30j haché/révocable) | Bearer en `localStorage`, réellement essayé en premier puis abandonné (XSS peut lire tout token en `localStorage`) | Piège réel : `SameSite=Strict` cassait le retour du callback OAuth GitHub (cookie non renvoyé) → passé à `Lax` (`PLAN.md` §10 piège 3) | Si un jour une app mobile native consomme la même API : revoir vers un schéma bearer + refresh rotation, `localStorage` n'étant pas l'unique alternative à cookie |
| Envoi mail : Brevo API HTTP en prod, SMTP en local | `mailer.ts`, bascule sur `BREVO_API_KEY` | SMTP Gmail direct (déployé d'abord, cassé par le blocage réseau Render free tier) ; Resend essayé avant Brevo, écarté : restreint l'envoi à l'adresse du compte sans domaine vérifié | Découvert en déployant, pas en dev local (Mailpit ne reproduit pas les restrictions réseau de Render) - bon exemple de décision révisée après un fait nouveau, pas anticipée dans `TECH_CHOICES.md` initial | Avec un vrai nom de domaine : vérifier un domaine chez Resend/Brevo pour un meilleur taux de délivrabilité (actuellement expéditeur Gmail partagé, plus susceptible du spam) |
| Hébergement : nginx (pas Caddy/Traefik) | `docker-compose.yml`, `nginx/nginx.conf.template` | Caddy, Traefik - POC écrits mais non exécutés (pas d'accès Docker Hub dans le sandbox de dev, voir note d'honnêteté `TECH_CHOICES.md`) | Piège réel découvert sur Render (pas en local) : `proxy_set_header Host $host` envoyait le domaine du frontend à l'API au lieu du sien → `508 Loop Detected` côté routing Render ; corrigé en `$proxy_host` | Documenter explicitement que Render route différemment du réseau Docker local serait à anticiper dès le POC proxy, pas découvert en prod |

## 13. Répartition de l'équipe

Une répartition détaillée, fichier par fichier, du travail entre vous deux existe déjà dans `tests/REPARTITION.md` (qui a écrit quel contrôleur/service/adaptateur/page). Utilisez-le comme base factuelle, mais la soutenance attend aussi un retour personnel :

- **Ce que chacun savait déjà avant de commencer, et comment ça a influencé vos choix techniques :** À compléter par nous.
- **Le bug le plus difficile que vous avez rencontré, et comment vous l'avez trouvé/corrigé :** À compléter par nous.
- **Soyez prêts à expliquer la partie de l'*autre*, pas seulement la vôtre** - le jury peut interroger n'importe lequel de vous deux sur n'importe quelle partie du projet.

---

## Annexe - auto-vérification avant d'y aller

- [ ] `docker compose build && docker compose up` depuis un clone propre, aucune étape manuelle, aucune erreur dans les logs.
- [ ] `http://localhost:8080/about.json` répond et correspond au §2 ci-dessus.
- [ ] Inscription → réception de l'OTP (vérifier Mailpit sur `:8025` ou la vraie boîte mail si SMTP Gmail configuré) → confirmation → connexion fonctionnent de bout en bout.
- [ ] La liaison OAuth GitHub fonctionne si `GITHUB_CLIENT_ID`/`SECRET` sont définis ; sinon, vérifier que l'app dégrade proprement (`OAUTH_NOT_CONFIGURED`, `SERVICE_OAUTH_REQUIRED`) au lieu de planter.
- [ ] Ajouter le même widget deux fois avec des configs différentes, vérifier qu'ils affichent des données différentes.
- [ ] Vous êtes tous les deux capables de tracer une requête de bout en bout à voix haute : appel frontend → route → contrôleur → service → repository/adaptateur → réponse - pour un widget que vous n'avez *pas* écrit.
