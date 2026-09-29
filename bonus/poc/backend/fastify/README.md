# POC - Fastify

[English](#english) · [Français](#français)

---

<a id="english"></a>

## English

### Run it

```bash
npm install
npm start
# GET http://localhost:4102/widgets
```

Single file (`server.js`), one dependency (`fastify`).

### What we observed

- **Setup time (measured, install → verified `curl` response):** ~55s. `npm install fastify` pulls noticeably more transitive dependencies than Express (its internal schema/serialization engine), so install alone took longer even though the code is the same size.
- **Lines of code:** 18 (`server.js`) - same line count as the Express POC, near-identical API shape (`fastify.get(path, async handler)` vs `app.get(path, handler)`).
- **Ease of use:** Just as quick to write as Express for this trivial case; the async-handler-returns-the-body style is slightly cleaner (no `res.json(...)` call needed). Built-in fast JSON serialization is a real feature, just invisible at this scale.
- **Weaknesses observed:** The main Fastify selling point (schema-based validation/serialization) needs extra setup (a `schema` option per route) to actually pay off - skipped here since it's out of scope for "just expose GET /widgets", so this POC doesn't show Fastify's real differentiator, only its baseline ergonomics.

---

<a id="français"></a>

## Français

### Lancer

```bash
npm install
npm start
# GET http://localhost:4102/widgets
```

Un seul fichier (`server.js`), une seule dépendance (`fastify`).

### Ce qu'on a observé

- **Temps de mise en place (mesuré, install → réponse `curl` vérifiée) :** ~55s. `npm install fastify` tire sensiblement plus de dépendances transitives qu'Express (son moteur interne de schéma/sérialisation), donc l'install seule a pris plus de temps même si le code fait la même taille.
- **Lignes de code :** 18 (`server.js`) - même nombre de lignes que le POC Express, forme d'API quasi identique (`fastify.get(chemin, async handler)` vs `app.get(chemin, handler)`).
- **Facilité :** Aussi rapide à écrire qu'Express pour ce cas trivial ; le style "le handler async renvoie le corps" est légèrement plus propre (pas besoin d'appeler `res.json(...)`). La sérialisation JSON rapide intégrée est un vrai atout, juste invisible à cette échelle.
- **Points faibles observés :** L'argument de vente principal de Fastify (validation/sérialisation par schéma) demande une config en plus (option `schema` par route) pour vraiment payer - sauté ici car hors périmètre pour "juste exposer GET /widgets", donc ce POC ne montre pas le vrai différenciateur de Fastify, seulement son ergonomie de base.
