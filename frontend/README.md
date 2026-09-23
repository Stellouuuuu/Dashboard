# Threshold

Frontend React de la plateforme de dashboard personnalisable **Threshold**.

## Démarrage

```bash
npm install
npm run dev
```

## Comptes démo

| Email | Mot de passe | Notes |
|-------|--------------|--------|
| `stella@epitech.eu` | `password123` | Admin confirmé |
| `yao.k@mail.com` | `password123` | Non confirmé (blocage login) |

Confirmation démo : `/confirm/pending-yao-token`

## Routes

- `/` -- landing
- `/register`, `/login`, `/confirm/:token`
- `/dashboard`, `/services`, `/profile` (protégées)
- `/admin`, `/admin/users/:id` (admin)
- `*` -- 404

## Stack

React 19 · TypeScript · Vite · React Router · tokens CSS clair/sombre · données démo (API mock)
