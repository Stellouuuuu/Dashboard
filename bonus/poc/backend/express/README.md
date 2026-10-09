# POC - Express

[English](#english) · [Français](#français)

---

<a id="english"></a>

## English

### Run it

```bash
npm install
npm start
# GET http://localhost:4101/widgets
```

Single file (`server.js`), one dependency (`express`).

### What we observed

- **Setup time (measured, install → verified `curl` response):** ~35s, almost entirely `npm install express` (1 dependency, no transitive surprises).
- **Lines of code:** 18 (`server.js`), no config file needed beyond `package.json`.
- **Ease of use:** Zero ceremony - `app.get(path, handler)` and you're done. No decorators, no DI container, no build step (plain JS ran directly with `node`).
- **Weaknesses observed:** Nothing enforced - no built-in validation, no typed request/response by default (would need a manual TypeScript setup + `@types/express`, as the real backend does). Routing/structure discipline is entirely on the developer as the app grows.

---

<a id="français"></a>

## Français

### Lancer

```bash
npm install
npm start
# GET http://localhost:4101/widgets
```

Un seul fichier (`server.js`), une seule dépendance (`express`).

### Ce qu'on a observé

- **Temps de mise en place (mesuré, install → réponse `curl` vérifiée) :** ~35s, quasi entièrement le `npm install express` (1 dépendance, pas de surprise transitive).
- **Lignes de code :** 18 (`server.js`), aucun fichier de config au-delà de `package.json`.
- **Facilité :** Zéro cérémonie - `app.get(chemin, handler)` et c'est fini. Pas de décorateurs, pas de conteneur d'injection de dépendances, pas d'étape de build (JS brut exécuté directement avec `node`).
- **Points faibles observés :** Rien n'est imposé - pas de validation intégrée, pas de typage requête/réponse par défaut (il faudrait ajouter TypeScript + `@types/express` à la main, comme le fait le vrai backend). La discipline de structure/routing repose entièrement sur le développeur à mesure que l'app grossit.
