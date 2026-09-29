# POC frontend - React

[English](#english) · [Français](#français)

---

<a id="english"></a>

## English

Minimal Vite + React + TypeScript app. One screen: a weather widget card (city, temperature, condition) built from mocked data, with a 300ms simulated loading state before it renders - no external network call, no router, no state library.

### Run it

```bash
cd bonus/poc/frontend/react
npm install
npm run dev
```

Opens on **http://localhost:5174**. Production build: `npm run build` (outputs to `dist/`).

### What was observed

- **Setup time**: ~2 min from `npm create vite@latest react -- --template react-ts` to a verified running dev server (`npm install` alone took ~1 min).
- **Lines of code**: 215 lines total across all source files (`App.tsx`, `App.css`, `main.tsx`, `index.css`, `vite.config.ts`, `index.html`), most of it Vite/TS boilerplate - the widget itself is ~35 lines.
- **Ease**: scaffold is instant, `useState`/`useEffect` are enough for this widget, no extra concept needed. TypeScript + JSX errors surface immediately in the dev server output.
- **Weaknesses**: JSX mixes markup and logic in one file, which is fine here but scales less cleanly than SFCs (Vue) for larger components without splitting files. The default template still ships a few files (`vite-env.d.ts`, asset folder) that had to be trimmed manually.

### Verification done

`npm run build` → `tsc -b && vite build` succeeded, 17 modules transformed, `dist/index.html` + JS/CSS bundle produced. Dev server verified separately: `curl http://localhost:5174/` returned `200` with the `<div id="root">` mount point and Vite's HMR client script.

---

<a id="français"></a>

## Français

App minimale Vite + React + TypeScript. Un seul écran : une carte widget météo (ville, température, condition) à partir de données mockées, avec un état de chargement simulé de 300ms avant l'affichage - pas d'appel réseau externe, pas de routeur, pas de state manager.

### Lancer

```bash
cd bonus/poc/frontend/react
npm install
npm run dev
```

Ouvre sur **http://localhost:5174**. Build production : `npm run build` (sortie dans `dist/`).

### Ce qui a été observé

- **Temps de mise en place** : ~2 min entre `npm create vite@latest react -- --template react-ts` et un dev server vérifié qui tourne (le seul `npm install` a pris ~1 min).
- **Lignes de code** : 215 lignes au total sur tous les fichiers source (`App.tsx`, `App.css`, `main.tsx`, `index.css`, `vite.config.ts`, `index.html`), la majorité étant du boilerplate Vite/TS - le widget lui-même fait ~35 lignes.
- **Facilité** : scaffold instantané, `useState`/`useEffect` suffisent pour ce widget, aucun concept supplémentaire requis. Les erreurs TypeScript/JSX remontent immédiatement dans la sortie du dev server.
- **Points faibles** : JSX mélange markup et logique dans un seul fichier, ce qui va très bien ici mais passe moins bien à l'échelle que les SFC (Vue) pour de plus gros composants sans découpage. Le template par défaut embarque encore quelques fichiers (`vite-env.d.ts`, dossier d'assets) qu'il a fallu nettoyer à la main.

### Vérification effectuée

`npm run build` → `tsc -b && vite build` a réussi, 17 modules transformés, `dist/index.html` + bundle JS/CSS produits. Dev server vérifié séparément : `curl http://localhost:5174/` a renvoyé `200` avec le point de montage `<div id="root">` et le script client HMR de Vite.
