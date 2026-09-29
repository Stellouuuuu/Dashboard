# POC frontend - Angular

[English](#english) · [Français](#français)

---

<a id="english"></a>

## English

Minimal standalone Angular app (`ng new --minimal --skip-tests --routing=false`), Angular 19. Same screen as the React/Vue POCs: a weather widget card (city, temperature, condition) from mocked data, 300ms simulated loading state (`ngOnInit` + `setTimeout`), new-style `@if`/`@else` control flow, no router, no NgModule, no state library.

### Run it

```bash
cd bonus/poc/frontend/angular
npm install
npm start
```

Opens on **http://localhost:4200** (`npm start` = `ng serve --port 4200`). Production build: `npm run build`.

### What was observed

- **Setup time**: ~5 min 30s total from `ng new` to a verified running dev server - clearly the slowest of the 3. Breakdown: ~4 min 30s for `ng new` (scaffold + `npm install`, Angular's dependency tree is much heavier than Vite's), then ~1 min for widget code + `ng build` (7.2s) + `ng serve` (3s compile) + curl verification.
- **Lines of code**: 92 lines total (`app.component.ts`, `main.ts`, `app.config.ts`, `index.html`, `styles.css`) - the least of the 3, because Angular's `--minimal` flag strips almost everything (no `app.component.html`/`.css` split, no app-level routing file) and the component is entirely inline (template + styles in the `@Component` decorator).
- **Ease**: once past the install, the mental model (`@Component`, `OnInit`, template control-flow blocks) is close to Vue's SFC approach. The CLI (`ng build`/`ng serve`) is fast once dependencies are installed.
- **Weaknesses**:
  - **Blocking Node version constraint**: the latest Angular CLI (22.x, installed by `npx @angular/cli@latest`) *refused to run at all* on this environment's Node 22.22.1, requiring ≥22.22.3 - not a warning, a hard exit. Had to pin `@angular/cli@19` explicitly to get a working scaffold. React/Vue (Vite) had no such constraint.
  - Heaviest install and slowest cold build/serve of the three by a wide margin.
  - `zone.js` + the Angular compiler add real conceptual and runtime overhead for what is, here, a single static-ish widget.

### Verification done

`npm run build` → `ng build` succeeded in 7.243s, bundle (`main`, `polyfills`, `styles`) written to `dist/angular`. Dev server verified separately: `npm start -- --port 4200`, compiled in 3.059s ("Application bundle generation complete"), `curl http://localhost:4200/` returned `200` and the response body contains `<app-root></app-root>`, the Angular bootstrap element.

---

<a id="français"></a>

## Français

App Angular standalone minimale (`ng new --minimal --skip-tests --routing=false`), Angular 19. Même écran que les POC React/Vue : une carte widget météo (ville, température, condition) à partir de données mockées, état de chargement simulé de 300ms (`ngOnInit` + `setTimeout`), nouvelle syntaxe de contrôle de flux `@if`/`@else`, pas de routeur, pas de NgModule, pas de state manager.

### Lancer

```bash
cd bonus/poc/frontend/angular
npm install
npm start
```

Ouvre sur **http://localhost:4200** (`npm start` = `ng serve --port 4200`). Build production : `npm run build`.

### Ce qui a été observé

- **Temps de mise en place** : ~5 min 30 au total entre `ng new` et un dev server vérifié qui tourne - clairement le plus lent des 3. Détail : ~4 min 30 pour `ng new` (scaffold + `npm install`, l'arbre de dépendances d'Angular est bien plus lourd que celui de Vite), puis ~1 min pour le code du widget + `ng build` (7.2s) + `ng serve` (3s de compilation) + vérification curl.
- **Lignes de code** : 92 lignes au total (`app.component.ts`, `main.ts`, `app.config.ts`, `index.html`, `styles.css`) - le moins des 3, parce que le flag `--minimal` d'Angular retire presque tout (pas de séparation `app.component.html`/`.css`, pas de fichier de routing applicatif) et le composant est entièrement inline (template + styles dans le décorateur `@Component`).
- **Facilité** : une fois l'install passée, le modèle mental (`@Component`, `OnInit`, blocs de contrôle de flux dans le template) est proche de l'approche SFC de Vue. Le CLI (`ng build`/`ng serve`) est rapide une fois les dépendances installées.
- **Points faibles** :
  - **Contrainte de version Node bloquante** : le CLI Angular le plus récent (22.x, installé par `npx @angular/cli@latest`) a *refusé de démarrer* sur le Node 22.22.1 de cet environnement, exigeant ≥22.22.3 - pas un simple warning, un arrêt pur et simple. Il a fallu épingler `@angular/cli@19` explicitement pour obtenir un scaffold fonctionnel. React/Vue (Vite) n'ont eu aucune contrainte de ce genre.
  - Install et premier build/serve nettement les plus lents des 3.
  - `zone.js` + le compilateur Angular ajoutent une vraie surcharge conceptuelle et runtime pour ce qui reste ici un simple widget quasi statique.

### Vérification effectuée

`npm run build` → `ng build` a réussi en 7.243s, bundle (`main`, `polyfills`, `styles`) écrit dans `dist/angular`. Dev server vérifié séparément : `npm start -- --port 4200`, compilé en 3.059s ("Application bundle generation complete"), `curl http://localhost:4200/` a renvoyé `200` et le corps de la réponse contient `<app-root></app-root>`, l'élément de bootstrap Angular.
