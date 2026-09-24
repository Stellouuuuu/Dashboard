# Credits

← [Back to README](../README.md)

## Photography

UI photographs live under `frontend/public/img/`. Sources and licenses are tracked in [`frontend/IMAGES.md`](../frontend/IMAGES.md) (Unsplash / Pexels unless noted). Replace assets by keeping the same filenames.

## Open-source libraries

Notable runtime dependencies:

| Package | Use |
| --- | --- |
| React / Vite | SPA |
| Express | API |
| Drizzle ORM + `pg` | Database |
| Zod | Validation |
| jsonwebtoken / bcrypt | Auth |
| nodemailer | Outbound mail |
| i18next | Translations |
| Helmet / express-rate-limit | Hardening |

See each package’s license in `node_modules` / npm for redistribution terms.

## External APIs

| Provider | Used by |
| --- | --- |
| Open-Meteo | Weather widgets |
| GitHub REST API | Commits & Dependabot alerts |
| Arbitrary RSS/Atom URLs | RSS widgets |
| Frankfurter / CoinGecko | Finance widgets |
| Algolia HN Search | Hacker News widgets |

## Project

Epitech **G-WEB-500** dashboard module — student work.
