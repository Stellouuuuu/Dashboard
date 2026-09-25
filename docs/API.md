# API overview / Vue d’ensemble de l’API

← [Back to README](../README.md) · [Retour au README](../README.md)

[English](#english) · [Français](#français)

---

<a id="english"></a>

## English

Base path: `/api/v1` (via nginx). JSON bodies. Auth uses httpOnly cookies unless noted.

### Public

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/about.json` | Subject endpoint — client host, server time, services & widgets |
| `GET` | `/api/v1/widgets` | Widget catalogue from the registry |
| `GET` | `/api/v1/widgets/:name` | One widget definition |
| `POST` | `/api/v1/auth/register` | Create account (sends 6-digit code) |
| `POST` | `/api/v1/auth/confirm` | Confirm email (`{ email, code }`) |
| `POST` | `/api/v1/auth/resend-confirm` | Resend confirmation code (`{ email }`) |
| `POST` | `/api/v1/auth/forgot-password` | Send reset code (`{ email }`) |
| `POST` | `/api/v1/auth/reset-password` | Reset with code (`{ email, code, newPassword }`) |
| `POST` | `/api/v1/auth/login` | Login → sets cookies |
| `POST` | `/api/v1/auth/refresh` | Refresh access cookie |
| `POST` | `/api/v1/auth/logout` | Clear cookies |

### Authenticated (`requireAuth`)

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/v1/auth/me` | Current user |
| `PATCH` | `/api/v1/auth/profile` | Update display name |
| `POST` | `/api/v1/auth/change-password` | Change password |
| `DELETE` | `/api/v1/auth/me` | Delete account |
| `GET` | `/api/v1/auth/oauth/github` | Start GitHub OAuth (redirect) |
| `GET` | `/api/v1/auth/oauth/github/callback` | OAuth callback |
| `DELETE` | `/api/v1/auth/oauth/github` | Unlink GitHub |
| `GET` | `/api/v1/services` | List services + subscription state |
| `POST` | `/api/v1/services/:name/subscribe` | Subscribe (GitHub requires OAuth) |
| `DELETE` | `/api/v1/services/:name/subscribe` | Unsubscribe |
| `GET` | `/api/v1/dashboard` | List widget instances |
| `POST` | `/api/v1/dashboard/widgets` | Add instance |
| `PATCH` | `/api/v1/dashboard/widgets/:id` | Reconfigure |
| `PATCH` | `/api/v1/dashboard/widgets/:id/position` | Move |
| `GET` | `/api/v1/dashboard/widgets/:id/data` | Live / cached data |
| `DELETE` | `/api/v1/dashboard/widgets/:id` | Remove |

### Admin (`requireAdmin`)

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/v1/admin/stats` | Aggregated counts |
| `GET` | `/api/v1/admin/users` | List users |
| `PATCH` | `/api/v1/admin/users/:id` | Suspend / role |
| `DELETE` | `/api/v1/admin/users/:id` | Delete user |
| `GET` | `/api/v1/admin/audit-log` | Recent audit events |

### Common error codes

| Code | Meaning |
| --- | --- |
| `SERVICE_OAUTH_REQUIRED` | GitHub widget without linked account |
| `OAUTH_NOT_CONFIGURED` | GitHub OAuth env vars missing |
| `DASHBOARD_CONFIG_INVALID` | Zod schema rejected the config |
| `AUTH_UNCONFIRMED` | Email not confirmed yet |
| `AUTH_CONFIRM_TOKEN_INVALID` | Invalid or expired confirmation code |
| `AUTH_RESET_TOKEN_INVALID` | Invalid or expired reset code |
| `AUTH_UNAUTHENTICATED` | Session required |

---

<a id="français"></a>

## Français

Chemin de base : `/api/v1` (via nginx). Corps JSON. L’auth utilise des cookies httpOnly sauf indication contraire.

### Public

| Méthode | Chemin | Description |
| --- | --- | --- |
| `GET` | `/about.json` | Endpoint du sujet — hôte client, heure serveur, services & widgets |
| `GET` | `/api/v1/widgets` | Catalogue des widgets depuis le registre |
| `GET` | `/api/v1/widgets/:name` | Définition d’un widget |
| `POST` | `/api/v1/auth/register` | Créer un compte (envoie un code à 6 chiffres) |
| `POST` | `/api/v1/auth/confirm` | Confirmer l’email (`{ email, code }`) |
| `POST` | `/api/v1/auth/resend-confirm` | Renvoyer le code de confirmation (`{ email }`) |
| `POST` | `/api/v1/auth/forgot-password` | Envoyer un code de reset (`{ email }`) |
| `POST` | `/api/v1/auth/reset-password` | Reset avec code (`{ email, code, newPassword }`) |
| `POST` | `/api/v1/auth/login` | Connexion → pose les cookies |
| `POST` | `/api/v1/auth/refresh` | Rafraîchir le cookie d’accès |
| `POST` | `/api/v1/auth/logout` | Effacer les cookies |

### Authentifié (`requireAuth`)

| Méthode | Chemin | Description |
| --- | --- | --- |
| `GET` | `/api/v1/auth/me` | Utilisateur courant |
| `PATCH` | `/api/v1/auth/profile` | Mettre à jour le nom affiché |
| `POST` | `/api/v1/auth/change-password` | Changer le mot de passe |
| `DELETE` | `/api/v1/auth/me` | Supprimer le compte |
| `GET` | `/api/v1/auth/oauth/github` | Démarrer l’OAuth GitHub (redirect) |
| `GET` | `/api/v1/auth/oauth/github/callback` | Callback OAuth |
| `DELETE` | `/api/v1/auth/oauth/github` | Délier GitHub |
| `GET` | `/api/v1/services` | Liste des services + état d’abonnement |
| `POST` | `/api/v1/services/:name/subscribe` | S’abonner (GitHub exige OAuth) |
| `DELETE` | `/api/v1/services/:name/subscribe` | Se désabonner |
| `GET` | `/api/v1/dashboard` | Liste des instances de widgets |
| `POST` | `/api/v1/dashboard/widgets` | Ajouter une instance |
| `PATCH` | `/api/v1/dashboard/widgets/:id` | Reconfigurer |
| `PATCH` | `/api/v1/dashboard/widgets/:id/position` | Déplacer |
| `GET` | `/api/v1/dashboard/widgets/:id/data` | Données live / en cache |
| `DELETE` | `/api/v1/dashboard/widgets/:id` | Supprimer |

### Admin (`requireAdmin`)

| Méthode | Chemin | Description |
| --- | --- | --- |
| `GET` | `/api/v1/admin/stats` | Compteurs agrégés |
| `GET` | `/api/v1/admin/users` | Lister les utilisateurs |
| `PATCH` | `/api/v1/admin/users/:id` | Suspendre / rôle |
| `DELETE` | `/api/v1/admin/users/:id` | Supprimer un utilisateur |
| `GET` | `/api/v1/admin/audit-log` | Événements d’audit récents |

### Codes d’erreur courants

| Code | Signification |
| --- | --- |
| `SERVICE_OAUTH_REQUIRED` | Widget GitHub sans compte lié |
| `OAUTH_NOT_CONFIGURED` | Variables d’env OAuth GitHub absentes |
| `DASHBOARD_CONFIG_INVALID` | Schéma Zod a rejeté la config |
| `AUTH_UNCONFIRMED` | Email pas encore confirmé |
| `AUTH_CONFIRM_TOKEN_INVALID` | Code de confirmation invalide ou expiré |
| `AUTH_RESET_TOKEN_INVALID` | Code de reset invalide ou expiré |
| `AUTH_UNAUTHENTICATED` | Session requise |
