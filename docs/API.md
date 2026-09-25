# API overview

← [Back to README](../README.md)

Base path: `/api/v1` (via nginx). JSON bodies. Auth uses httpOnly cookies unless noted.

## Public

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/about.json` | Subject endpoint — client host, server time, services & widgets |
| `GET` | `/api/v1/widgets` | Widget catalogue from the registry |
| `GET` | `/api/v1/widgets/:name` | One widget definition |
| `POST` | `/api/v1/auth/register` | Create account |
| `POST` | `/api/v1/auth/confirm` | Confirm email (`{ token }`) |
| `POST` | `/api/v1/auth/login` | Login → sets cookies |
| `POST` | `/api/v1/auth/refresh` | Refresh access cookie |
| `POST` | `/api/v1/auth/logout` | Clear cookies |

## Authenticated (`requireAuth`)

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

## Admin (`requireAdmin`)

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/v1/admin/stats` | Aggregated counts |
| `GET` | `/api/v1/admin/users` | List users |
| `PATCH` | `/api/v1/admin/users/:id` | Suspend / role |
| `DELETE` | `/api/v1/admin/users/:id` | Delete user |
| `GET` | `/api/v1/admin/audit-log` | Recent audit events |

## Common error codes

| Code | Meaning |
| --- | --- |
| `SERVICE_OAUTH_REQUIRED` | GitHub widget without linked account |
| `OAUTH_NOT_CONFIGURED` | GitHub OAuth env vars missing |
| `DASHBOARD_CONFIG_INVALID` | Zod schema rejected the config |
| `AUTH_UNCONFIRMED` | Email not confirmed yet |
