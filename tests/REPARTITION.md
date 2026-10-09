# 📂 Répartition des fichiers par membre

> Basé sur le plan technique HTML — Section 3 (Équipe & Répartition des Tâches)

---

## 🅰️ Membre A — Authentification + widgets `city_temperature`, `recent_commits`, `article_list`

### Backend

- `backend/src/modules/auth/auth.controller.ts` — Register, login, confirm, forgot/reset, profile
- `backend/src/modules/auth/auth.service.ts` — Logique métier auth
- `backend/src/modules/auth/auth.repository.ts` — Requêtes BD (users, tokens, refresh_tokens)
- `backend/src/modules/auth/auth.routes.ts` — Routes Express auth
- `backend/src/modules/auth/auth.schemas.ts` — Schémas Zod auth
- `backend/src/modules/auth/github-oauth.service.ts` — Flux OAuth GitHub complet (back)
- `backend/src/modules/services/services.controller.ts` — Endpoints subscribe/unsubscribe
- `backend/src/modules/services/services.service.ts` — Logique métier abonnements
- `backend/src/modules/services/services.repository.ts` — Requêtes BD user_services
- `backend/src/modules/services/services.routes.ts` — Routes Express services
- `backend/src/lib/token.ts` — JWT access + refresh tokens
- `backend/src/lib/crypto.ts` — Chiffrement AES-256-GCM des tokens OAuth
- `backend/src/lib/mailer.ts` — Envoi d'emails (confirmation, reset)
- `backend/src/lib/emailTemplates.ts` — Templates HTML des emails OTP
- `backend/src/middleware/auth.middleware.ts` — Middleware JWT (requireAuth, requireAdmin)
- `backend/src/middleware/rateLimit.middleware.ts` — Rate limiting (sécurité)
- `backend/src/db/seed-admin.ts` — Seed admin (user management)
- `backend/drizzle/0003_otp_purpose.sql` — Migration : ajout du champ purpose sur email_tokens

### Backend — Adaptateurs (fonctions de Membre A)

- `backend/src/adapters/weather.adapter.ts` → fonction `fetchCityTemperature`
- `backend/src/adapters/github.adapter.ts` → fonction `fetchRecentCommits`
- `backend/src/adapters/rss.adapter.ts` → fonction `fetchArticleList`

### Backend — Registre (entrées de Membre A)

- `backend/src/widgets/registry.ts` → entrées `city_temperature`, `recent_commits`, `article_list`

### Frontend

- `frontend/src/pages/LoginPage.tsx` — Page de connexion
- `frontend/src/pages/RegisterPage.tsx` — Page d'inscription
- `frontend/src/pages/ConfirmPage.tsx` — Page de confirmation email
- `frontend/src/pages/ForgotPasswordPage.tsx` — Page mot de passe oublié
- `frontend/src/pages/ServicesPage.tsx` — Page "Mes services"
- `frontend/src/auth/AuthContext.tsx` — Provider auth (JWT, user, refresh)
- `frontend/src/auth/ProtectedRoute.tsx` — Route protégée (redirect si non connecté)
- `frontend/src/auth/types.ts` — Types User, AuthState
- `frontend/src/api/auth.ts` — Appels API auth (register, login, confirm, etc.)
- `frontend/src/api/services.ts` — Appels API services (subscribe, OAuth)
- `frontend/src/components/AuthLayout.tsx` — Layout pages auth
- `frontend/src/components/FormField.tsx` — Composant formulaire (design system)

### Frontend — Images de Membre A

- `frontend/public/img/widget-city_temperature.jpg`
- `frontend/public/img/widget-recent_commits.jpg`
- `frontend/public/img/widget-article_list.jpg`
- `frontend/public/img/auth.jpg`

### Infrastructure

- `frontend/Dockerfile` — Build nginx + SPA
- `nginx/nginx.conf` — Configuration nginx (SPA + proxy /api + /about.json)

---

## 🅱️ Membre B — Dashboard & Timer + widgets `precipitation_forecast`, `security_alerts`, `feed_summary`

### Backend

- `backend/src/modules/dashboard/dashboard.controller.ts` — CRUD widget instances + refresh
- `backend/src/modules/dashboard/dashboard.service.ts` — Logique métier dashboard + cache
- `backend/src/modules/dashboard/dashboard.repository.ts` — Requêtes BD widget_instances + widget_cache
- `backend/src/modules/dashboard/dashboard.routes.ts` — Routes Express dashboard
- `backend/src/modules/widgets/widgets.controller.ts` — GET /api/v1/widgets (catalogue)
- `backend/src/modules/widgets/widgets.service.ts` — Logique catalogue
- `backend/src/modules/widgets/widgets.routes.ts` — Routes Express widgets
- `backend/src/lib/audit.ts` — Journal d'audit

### Backend — Adaptateurs (fonctions de Membre B)

- `backend/src/adapters/weather.adapter.ts` → fonction `fetchPrecipitationForecast`
- `backend/src/adapters/github.adapter.ts` → fonction `fetchSecurityAlerts`
- `backend/src/adapters/rss.adapter.ts` → fonction `fetchFeedSummary`

### Backend — Registre (entrées de Membre B)

- `backend/src/widgets/registry.ts` → entrées `precipitation_forecast`, `security_alerts`, `feed_summary`

### Frontend

- `frontend/src/pages/DashboardPage.tsx` — Page dashboard principale
- `frontend/src/dashboard/WidgetGrid.tsx` — Grille drag & drop (dnd-kit)
- `frontend/src/dashboard/WidgetCard.tsx` — Carte individuelle d'un widget
- `frontend/src/dashboard/DashHero.tsx` — En-tête du dashboard
- `frontend/src/dashboard/DashLeft.tsx` — Panneau latéral dashboard
- `frontend/src/dashboard/DashPlanning.tsx` — Vue planning
- `frontend/src/dashboard/TimerRing.tsx` — Anneau visuel du timer de refresh
- `frontend/src/dashboard/useWidgetRefresh.ts` — Hook Timer (rafraîchissement auto)
- `frontend/src/dashboard/summary.ts` — Résumé des données widgets
- `frontend/src/modals/WizardModal.tsx` — Wizard d'ajout/configuration de widget
- `frontend/src/modals/OAuthModal.tsx` — Modal OAuth GitHub (bouton front + états)
- `frontend/src/components/Modal.tsx` — Composant modale générique
- `frontend/src/components/EmptyState.tsx` — État vide (dashboard sans widgets)

### Frontend — Images de Membre B

- `frontend/public/img/widget-precipitation_forecast.jpg`
- `frontend/public/img/widget-security_alerts.jpg`
- `frontend/public/img/widget-feed_summary.jpg`
- `frontend/public/img/dashboard-preview.jpg`

---

## Résumé

| Membre | Fichiers | Domaines principaux |
|--------|----------|---------------------|
| 🅰️ **Membre A** | ~35 fichiers | Auth (register/login/confirm/reset), OAuth GitHub (flux back), Services (subscribe), JWT, Crypto, Mailer, Rate limiting, Pages auth, nginx |
| 🅱️ **Membre B** | ~28 fichiers | Dashboard (CRUD + grille + drag & drop), Timer (hook + ring), Catalogue widgets, WizardModal, OAuthModal (front), Audit logs, Cache |
