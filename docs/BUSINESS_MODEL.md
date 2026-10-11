# Business model / Modèle économique

← [Back to README](../README.md) · [Retour au README](../README.md)

[English](#english) · [Français](#français)

---

<a id="english"></a>

## English

Not a subject requirement — written for the defense, to show the team can reason about the project as a product, not just as a grading exercise. Numbers are grounded in real October 2026 pricing of comparable products and Render's own pricing, with sources at the bottom; treat them as a defensible estimate, not an audited forecast.

### 1. Where Threshold sits against comparable products

| Product | What it actually is | Entry paid price (Oct 2026) |
| --- | --- | --- |
| [DAKboard](https://dakboard.com/pricing) | Passive screen dashboard (calendar, photos, weather) — closest shape to Threshold, but display-only, no third-party account linking | $6/mo (Essential) |
| [IFTTT](https://ifttt.com) | Automations between services (triggers → actions) — same breadth of third-party connections, no visual dashboard | $2.99/mo (Pro, annual) |
| [Zapier](https://zapier.com/pricing) | Workflow automation for businesses, task-based pricing | ~$20–30/mo (Professional) |

Threshold sits between DAKboard and IFTTT in scope: it has DAKboard's "personal screen you glance at" use case, but with IFTTT's breadth of linked third-party accounts (12 services, OAuth to GitHub/Spotify/LinkedIn/Google/Microsoft) — and adds interactive management (add/reconfigure/move/delete, not just passive display) plus bonus features neither competitor has baked in (AI daily brief, threshold alerts, offline PWA).

### 2. What it actually costs to run

| Item | Monthly cost | Source |
| --- | --- | --- |
| Render web service (Starter, always-on) | ~$7 | Render's own cost article |
| Render Postgres (Basic 256MB) | ~$6 | Render pricing |
| **Fixed baseline total** | **~$13/mo** | — |
| Scaling up (Standard web service) | $25/mo | Render pricing |
| Scaling up (Postgres Basic 1GB) | $19/mo | Render pricing |

Third-party APIs are **free at our current scale** (Open-Meteo, GitHub, RSS, Frankfurter, CoinGecko, Algolia HN, Gemini free tier, Spotify/LinkedIn/Google/Microsoft OAuth all cost nothing to call) — but two have real ceilings that turn into real cost once there are enough *paying* users hammering them:

- **YouTube Data API**: 10,000 free units/day shared across every user's widgets. A single `channel_latest_videos` fetch costs ~3 units — at a 60s refresh rate, one widget alone can burn the entire daily quota. A paid quota increase (Google review, not instant) becomes necessary well before 1,000 paying users.
- **OpenRouteService**: 2,000 free requests/day on the free tier; paid tiers start once that's exceeded.

So the honest cost model is: **~$13–25/mo fixed infra**, plus **a variable API cost that only appears once there's real paid usage** — the good kind of problem to have.

### 3. Pricing recommendation

A two-tier freemium, consistent with every comparable above:

| Tier | Price | What's gated |
| --- | --- | --- |
| **Free** | $0 | All 12 services, up to 6 widgets, refresh ≥ 5 min, no AI daily brief |
| **Pro** | **$4.99/mo** (or **$39/yr**, ~35% off — same discount shape as DAKboard/IFTTT annual) | Unlimited widgets, refresh down to the 30s floor, AI daily brief, threshold alerts, persistent player, offline PWA |

**Why $4.99, not $2.99 (IFTTT) or $6 (DAKboard Essential):** Threshold combines both products' value (IFTTT's integration breadth + DAKboard's dashboard UX) plus bonus features neither has, which justifies pricing above IFTTT's floor — but it's a side project without DAKboard's dedicated-hardware ecosystem (physical screens, mounts) that lets DAKboard charge more, so pricing below DAKboard's Essential tier keeps it a clear impulse-buy rather than a considered purchase.

**Break-even:** at $4.99/mo, **3 paying users already cover the $13/mo fixed baseline**. At a typical freemium conversion rate of 2–5%, that means roughly **60–150 signed-up free users** to break even on infra — a realistic bar for a single launch post (Product Hunt, Hacker News "Show HN", r/selfhosted).

A third **Team** tier is a plausible later step once a B2B angle exists (see §4): **$15/seat/mo, 3-seat minimum** — priced like Zapier's Team tier, for shared dashboards + SSO.

### 4. What would add the most value

Roughly ordered by effort-to-value ratio.

**Quick wins (low effort, real value):**
- A **generic webhook/JSON widget** (point at any URL, map a field via JSONPath) — turns the product from "12 fixed integrations" into "connect literally anything", the single highest-leverage feature on this list
- A **public read-only share link** per dashboard — the organic growth lever every comparable above relies on (DAKboard screens get seen by visitors; IFTTT applets get shared)
- **Slack/Discord webhook** for threshold alerts, instead of in-app only
- **Multiple dashboards/tabs** (e.g. "Work" vs "Personal") — the #1 missing feature compared to DAKboard, which supports multiple screens

**Bigger bets (justify the Team tier):**
- **White-label embeddable dashboard** — a small business's internal "ops status page" built from the same widget engine, the actual product-market-fit test for a paid Team tier
- **Shared/team dashboards + SSO (SAML)** — the feature IFTTT and Zapier both gate behind their highest tiers
- **Native mobile app** with real push notifications (today's PWA can't push on iOS) for threshold alerts
- A small **widget marketplace** — community-submitted adapters, the same lever that made Zapier's app directory (7,000+ integrations) its moat

---

<a id="français"></a>

## Français

Pas une exigence du sujet — écrit pour la soutenance, pour montrer que l'équipe sait raisonner sur le projet comme un produit, pas juste comme un exercice noté. Les chiffres s'appuient sur les tarifs réels d'octobre 2026 de produits comparables et sur la tarification Render elle-même, sources en bas de page ; à traiter comme une estimation défendable, pas un prévisionnel audité.

### 1. Où se situe Threshold face à des produits comparables

| Produit | Ce que c'est vraiment | Prix d'entrée payant (oct. 2026) |
| --- | --- | --- |
| [DAKboard](https://dakboard.com/pricing) | Dashboard d'écran passif (calendrier, photos, météo) — forme la plus proche de Threshold, mais affichage seul, pas de liaison de compte tiers | 6$/mois (Essential) |
| [IFTTT](https://ifttt.com) | Automatisations entre services (déclencheur → action) — même largeur de connexions tierces, pas de dashboard visuel | 2,99$/mois (Pro, annuel) |
| [Zapier](https://zapier.com/pricing) | Automatisation de workflows pour entreprises, tarification à la tâche | ~20–30$/mois (Professional) |

Threshold se situe entre DAKboard et IFTTT en périmètre : l'usage "écran personnel qu'on consulte" de DAKboard, mais avec la largeur de comptes tiers liés d'IFTTT (12 services, OAuth vers GitHub/Spotify/LinkedIn/Google/Microsoft) — plus une gestion interactive (ajouter/reconfigurer/déplacer/supprimer, pas juste de l'affichage passif) et des fonctionnalités bonus qu'aucun des deux concurrents n'a nativement (brief IA quotidien, alertes de seuil, PWA hors-ligne).

### 2. Ce que ça coûte réellement à faire tourner

| Poste | Coût mensuel | Source |
| --- | --- | --- |
| Service web Render (Starter, toujours actif) | ~7$ | Article coûts de Render |
| Postgres Render (Basic 256 Mo) | ~6$ | Tarifs Render |
| **Total socle fixe** | **~13$/mois** | — |
| Montée en charge (service web Standard) | 25$/mois | Tarifs Render |
| Montée en charge (Postgres Basic 1 Go) | 19$/mois | Tarifs Render |

Les API tierces sont **gratuites à notre échelle actuelle** (Open-Meteo, GitHub, RSS, Frankfurter, CoinGecko, Algolia HN, tier gratuit Gemini, OAuth Spotify/LinkedIn/Google/Microsoft ne coûtent rien à appeler) — mais deux ont de vrais plafonds qui deviennent un vrai coût une fois assez d'utilisateurs **payants** qui les sollicitent :

- **YouTube Data API** : 10 000 unités gratuites/jour partagées entre tous les widgets de tous les utilisateurs. Un seul appel `channel_latest_videos` coûte ~3 unités — à un rafraîchissement de 60 s, un seul widget peut épuiser tout le quota quotidien. Une augmentation de quota payante (validation Google, pas instantanée) devient nécessaire bien avant 1 000 utilisateurs payants.
- **OpenRouteService** : 2 000 requêtes gratuites/jour sur le tier gratuit ; les tiers payants démarrent au-delà.

Le modèle de coût honnête est donc : **~13–25$/mois d'infra fixe**, plus **un coût d'API variable qui n'apparaît qu'une fois un vrai usage payant** — le bon type de problème à avoir.

### 3. Recommandation de prix

Un freemium à deux paliers, cohérent avec chaque comparable ci-dessus :

| Palier | Prix | Ce qui est verrouillé |
| --- | --- | --- |
| **Gratuit** | 0$ | Les 12 services, jusqu'à 6 widgets, rafraîchissement ≥ 5 min, pas de brief IA quotidien |
| **Pro** | **4,99$/mois** (ou **39$/an**, ~35% de réduction — même logique de remise annuelle que DAKboard/IFTTT) | Widgets illimités, rafraîchissement jusqu'au plancher de 30 s, brief IA quotidien, alertes de seuil, lecteur persistant, PWA hors-ligne |

**Pourquoi 4,99$, ni 2,99$ (IFTTT) ni 6$ (DAKboard Essential) :** Threshold combine la valeur des deux produits (largeur d'intégration d'IFTTT + UX dashboard de DAKboard) plus des fonctionnalités bonus qu'aucun des deux n'a, ce qui justifie un prix au-dessus du plancher d'IFTTT — mais c'est un side project sans l'écosystème de matériel dédié de DAKboard (écrans physiques, supports) qui lui permet de facturer plus cher, donc rester sous le palier Essential de DAKboard garde l'achat impulsif plutôt que réfléchi.

**Seuil de rentabilité :** à 4,99$/mois, **3 utilisateurs payants couvrent déjà le socle fixe de 13$/mois**. Avec un taux de conversion freemium typique de 2 à 5 %, ça représente environ **60 à 150 utilisateurs gratuits inscrits** pour atteindre l'équilibre sur l'infra — une barre réaliste pour un seul post de lancement (Product Hunt, "Show HN", r/selfhosted).

Un troisième palier **Équipe** est une étape plausible une fois qu'un angle B2B existe (voir §4) : **15$/siège/mois, minimum 3 sièges** — tarifé comme le palier Team de Zapier, pour des dashboards partagés + SSO.

### 4. Ce qui apporterait le plus de valeur

Classé approximativement par ratio effort/valeur.

**Gains rapides (effort faible, vraie valeur) :**
- Un **widget webhook/JSON générique** (pointer vers n'importe quelle URL, mapper un champ via JSONPath) — transforme le produit de "12 intégrations fixes" à "connecte littéralement n'importe quoi", la fonctionnalité à plus fort effet de levier de cette liste
- Un **lien de partage public en lecture seule** par dashboard — le levier de croissance organique sur lequel repose chaque comparable ci-dessus (les écrans DAKboard sont vus par les visiteurs ; les applets IFTTT se partagent)
- **Webhook Slack/Discord** pour les alertes de seuil, au lieu d'uniquement in-app
- **Plusieurs dashboards/onglets** (ex. "Travail" vs "Personnel") — la fonctionnalité n°1 manquante par rapport à DAKboard, qui gère plusieurs écrans

**Paris plus ambitieux (justifient le palier Équipe) :**
- **Dashboard embarquable en marque blanche** — une "page de statut" interne d'une petite entreprise construite sur le même moteur de widgets, le vrai test de product-market-fit pour un palier Équipe payant
- **Dashboards d'équipe partagés + SSO (SAML)** — la fonctionnalité qu'IFTTT et Zapier verrouillent tous les deux derrière leur palier le plus haut
- **App mobile native** avec de vraies notifications push (la PWA actuelle ne peut pas pousser sur iOS) pour les alertes de seuil
- Une petite **marketplace de widgets** — adaptateurs soumis par la communauté, le même levier qui a fait du répertoire d'apps de Zapier (7 000+ intégrations) sa douve concurrentielle

---

**Sources** : [Render pricing article](https://render.com/articles/how-much-does-cloud-application-hosting-cost-for-small-businesses) · [DAKboard pricing](https://dakboard.com/pricing) · [IFTTT plans](https://ifttt.com) · [Zapier pricing](https://zapier.com/pricing)
