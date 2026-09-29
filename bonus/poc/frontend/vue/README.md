# POC frontend - Vue

[English](#english) · [Français](#français)

---

<a id="english"></a>

## English

Minimal Vite + Vue 3 + TypeScript app (`<script setup>` SFC). Same screen as the React POC: a weather widget card (city, temperature, condition) from mocked data, 300ms simulated loading state, no external call, no router, no state library.

### Run it

```bash
cd bonus/poc/frontend/vue
npm install
npm run dev
```

Opens on **http://localhost:5175**. Production build: `npm run build`.

### What was observed

- **Setup time**: ~1 min 40s from `npm create vite@latest vue -- --template vue-ts` to a verified running dev server.
- **Lines of code**: 105 lines total across all source files - notably less than React's 215, mainly because the default `style.css` (landing-page boilerplate: hero animation, docs/social sections) was trimmed to 6 lines instead of kept.
- **Ease**: single-file component (`<script setup>` + `<template>` + `<style scoped>`) reads very close to plain HTML/JS, `ref()` + `onMounted()` map directly to the same widget logic as React's `useState`/`useEffect` - no real learning curve coming from React.
- **Weaknesses**: template syntax (`v-if`/`v-else`, `{{ }}`) is Vue-specific - an editor without the Vue extension/plugin loses some IntelliSense compared to plain TSX. The default template's `style.css` is much heavier (dark-mode variables, hero animation) than what a minimal widget needs, same trimming work as React.

### Verification done

`npm run build` → `vue-tsc -b && vite build` succeeded, 14 modules transformed, bundle produced. Dev server verified separately: `curl http://localhost:5175/` returned `200` and the response body contains `<div id="app">`, the Vue mount point.

---

<a id="français"></a>

## Français

App minimale Vite + Vue 3 + TypeScript (SFC `<script setup>`). Même écran que le POC React : une carte widget météo (ville, température, condition) à partir de données mockées, état de chargement simulé de 300ms, pas d'appel externe, pas de routeur, pas de state manager.

### Lancer

```bash
cd bonus/poc/frontend/vue
npm install
npm run dev
```

Ouvre sur **http://localhost:5175**. Build production : `npm run build`.

### Ce qui a été observé

- **Temps de mise en place** : ~1 min 40 entre `npm create vite@latest vue -- --template vue-ts` et un dev server vérifié qui tourne.
- **Lignes de code** : 105 lignes au total sur tous les fichiers source - nettement moins que les 215 de React, surtout parce que le `style.css` par défaut (boilerplate landing page : animation hero, sections docs/social) a été réduit à 6 lignes au lieu d'être gardé.
- **Facilité** : composant single-file (`<script setup>` + `<template>` + `<style scoped>`) se lit presque comme du HTML/JS classique, `ref()` + `onMounted()` correspondent exactement à la même logique de widget que `useState`/`useEffect` en React - pas de vraie courbe d'apprentissage en venant de React.
- **Points faibles** : la syntaxe des templates (`v-if`/`v-else`, `{{ }}`) est spécifique à Vue - un éditeur sans l'extension/plugin Vue perd de l'IntelliSense comparé à du TSX classique. Le `style.css` par défaut du template est bien plus lourd (variables dark-mode, animation hero) que ce dont un widget minimal a besoin, même travail de nettoyage que pour React.

### Vérification effectuée

`npm run build` → `vue-tsc -b && vite build` a réussi, 14 modules transformés, bundle produit. Dev server vérifié séparément : `curl http://localhost:5175/` a renvoyé `200` et le corps de la réponse contient `<div id="app">`, le point de montage Vue.
