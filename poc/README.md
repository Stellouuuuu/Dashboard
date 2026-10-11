# Proof of concept

[English](#english) · [Français](#français)

---

<a id="english"></a>

## English

This is the subject's mandatory **proof of concept**: a minimal, standalone app on
the **actual chosen stack** (React + TypeScript on the frontend, Express + TypeScript
on the backend), with **one configurable widget** that fetches **real data from a
real external API** (Open-Meteo — no key required) and displays it.

It was built first, before full development, to validate that this stack works end
to end. It does not depend on `frontend/` or `backend/`, and will keep running even
if those change later. It intentionally has no auth, no database, no Timer, no
OAuth — none of that belongs in a proof of concept; it only proves the fetch →
display path works on the chosen frameworks.

This is a different deliverable from [`bonus/poc/`](../bonus/poc/README.md), which
compares *alternative* technologies (React vs Vue vs Angular, Express vs Fastify vs
NestJS, etc.) to justify [`docs/TECH_CHOICES.md`](../docs/TECH_CHOICES.md). This
`poc/` folder demonstrates the stack that was actually **picked**.

### The widget

`city_temperature` — same shape as the real `city_temperature` widget in the
dashboard (`backend/src/adapters/weather.adapter.ts`), with its two configurable
parameters: `city` (string) and `unit` (string, `C` or `F`).

### Run it

Two terminals, no Docker, no `.env` needed:

```bash
# Terminal 1 — backend (http://localhost:4500)
cd poc/backend
npm install
npm run dev

# Terminal 2 — frontend (http://localhost:5180)
cd poc/frontend
npm install
npm run dev
```

Open `http://localhost:5180`, type a city, pick a unit, submit — the temperature
displayed is live data fetched from Open-Meteo at that moment (not mocked).

You can also hit the backend directly:

```bash
curl "http://localhost:4500/api/widgets/city-temperature?city=Tokyo&unit=C"
```

### What this proves

- The backend framework (Express + TypeScript, ESM) can define a configurable
  endpoint, validate its parameters (Zod), call a real external HTTP API, and
  return normalized JSON — the same shape the real widget registry uses.
- The frontend framework (React + TypeScript, Vite) can render a configuration
  form, call the backend, and display the real data returned — the same pattern
  used for every widget tile in the real dashboard.
- Both pieces talk to each other over a simple HTTP + JSON contract, with no
  framework-specific glue beyond `fetch`.

---

<a id="français"></a>

## Français

Ceci est le livrable obligatoire du sujet : une **preuve de concept**, une appli
minimale et autonome sur la **stack réellement choisie** (React + TypeScript côté
frontend, Express + TypeScript côté backend), avec **un seul widget configurable**
qui va chercher de **vraies données d'une vraie API externe** (Open-Meteo — sans
clé) et les affiche.

Elle a été construite en premier, avant le développement complet, pour valider que
cette stack fonctionne de bout en bout. Elle ne dépend ni de `frontend/` ni de
`backend/`, et continuera de tourner même si ceux-ci évoluent. Elle n'a volontai-
rement ni auth, ni base de données, ni Timer, ni OAuth — rien de tout ça n'a sa
place dans une preuve de concept ; elle prouve seulement que le chemin
fetch → affichage fonctionne sur la stack choisie.

C'est un livrable différent de [`bonus/poc/`](../bonus/poc/README.md), qui compare
des technologies *alternatives* (React vs Vue vs Angular, Express vs Fastify vs
NestJS, etc.) pour justifier [`docs/TECH_CHOICES.md`](../docs/TECH_CHOICES.md). Ce
dossier `poc/` démontre la stack qui a réellement été **retenue**.

### Le widget

`city_temperature` — même forme que le vrai widget `city_temperature` du dashboard
(`backend/src/adapters/weather.adapter.ts`), avec ses deux paramètres configurables :
`city` (string) et `unit` (string, `C` ou `F`).

### Lancer

Deux terminaux, pas de Docker, pas de `.env` nécessaire :

```bash
# Terminal 1 — backend (http://localhost:4500)
cd poc/backend
npm install
npm run dev

# Terminal 2 — frontend (http://localhost:5180)
cd poc/frontend
npm install
npm run dev
```

Ouvre `http://localhost:5180`, tape une ville, choisis une unité, valide — la
température affichée est une vraie donnée récupérée d'Open-Meteo à cet instant
(pas simulée).

Tu peux aussi appeler le backend directement :

```bash
curl "http://localhost:4500/api/widgets/city-temperature?city=Tokyo&unit=C"
```

### Ce que ça prouve

- Le framework backend (Express + TypeScript, ESM) peut définir un endpoint
  configurable, valider ses paramètres (Zod), appeler une vraie API externe, et
  renvoyer du JSON normalisé — la même forme que le registre de widgets réel.
- Le framework frontend (React + TypeScript, Vite) peut afficher un formulaire de
  configuration, appeler le backend, et afficher les vraies données reçues — le
  même schéma que chaque tuile de widget du vrai dashboard.
- Les deux communiquent via un contrat HTTP + JSON simple, sans glue spécifique
  au-delà de `fetch`.
