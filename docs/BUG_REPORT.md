# Rapport de tests & bugs corrigés

Campagne de tests de bout en bout sur l'API (via nginx, `http://localhost:8080`) : auth, profil, services, dashboard/widgets, admin, plus un build et un contrôle de types du front. Chaque bug a été reproduit, corrigé, puis revérifié.

## Périmètre testé

| Zone | Ce qui a été vérifié |
| --- | --- |
| Public | `/about.json`, catalogue `/widgets`, widget inconnu (404), routes protégées sans session (401) |
| Inscription / confirmation | mot de passe faible, confirmation différente, doublon, mauvais code OTP, login avant confirmation |
| Session | login, `/me`, refresh, logout, refresh après logout, suppression de compte |
| Mot de passe | changement, oubli + code OTP, code à usage unique |
| Profil | changement de nom, nom vide, langue valide / invalide |
| Services | liste, abonnement GitHub sans lien OAuth, service inconnu, désabonnement d'un service par défaut |
| Dashboard | ajout des 8 widgets sans OAuth, données + cache, reconfiguration, déplacement, suppression, isolation entre utilisateurs |
| Admin | stats, liste des utilisateurs, journal d'audit, suspension / réactivation, changement de rôle, suppression, garde-fous |
| Front | `tsc -b`, `vite build`, routes SPA servies par nginx, linter |
| Tests unitaires back | 59 → 69 tests, tous verts |

## Bugs trouvés et corrigés

### 1. Email non normalisé : doublons de comptes (auth)
- **Symptôme** : `QA@x.com` et `qa@x.com` créaient deux comptes distincts ; le login dépendait de la casse.
- **Cause** : le schéma Zod acceptait l'email tel quel.
- **Correctif** : `trim().toLowerCase()` sur tous les emails (`auth.schemas.ts`).

### 2. Compte supprimé ou suspendu gardait son accès pendant 15 min (sécurité)
- **Symptôme** : le JWT d'accès d'un utilisateur supprimé restait valide (`GET /dashboard` → 200, `POST /dashboard/widgets` → **500** sur contrainte de clé étrangère). Un utilisateur suspendu continuait d'utiliser l'API ; un changement de rôle ne prenait effet qu'au prochain token.
- **Correctif** : `requireAuth` relit l'utilisateur en base (existence, suspension, rôle courant). Compte supprimé ou suspendu → 401 immédiat ; promotion / rétrogradation effective tout de suite (`auth.middleware.ts`).

### 3. Sessions non révoquées après changement / réinitialisation du mot de passe (sécurité)
- **Symptôme** : un refresh token émis avant le changement de mot de passe restait utilisable.
- **Correctif** : `revokeAllRefreshTokens` appelé dans `changePassword` et `resetPassword`.

### 4. Erreurs 500 sur entrées invalides du dashboard
- **Symptômes** (toutes en 500 avec un message Postgres brut) : `refreshRate: "abc"`, `position: "x"`, id de route non numérique ou trop grand (`/widgets/abc/data`, `/widgets/9999999999999999999/data`), `position: "abc"` sur le déplacement.
- **Correctif** : validation explicite (id entier positif dans la plage `integer`, `position` entière ≥ 0, `refreshRate` numérique, `config` objet) → 400 `VALIDATION_ERROR`.
- Une position **négative** était acceptée (200) : désormais refusée.

### 5. Même problème côté admin
- `PATCH` / `DELETE /admin/users/abc` renvoyaient 500. Désormais 400.

### 6. Fuite de messages d'erreur internes
- **Symptôme** : les erreurs inattendues renvoyaient au client le message brut (`invalid input syntax for type integer…`, code SQL `22P02`).
- **Correctif** : le gestionnaire d'erreurs ne renvoie `message` / `code` que pour les `HttpError` ; le reste devient un `INTERNAL_ERROR` générique (détail conservé dans les logs). Un JSON malformé ou trop gros renvoie maintenant 400 au lieu de 500.

### 7. SSRF via les widgets RSS (sécurité)
- **Symptôme** : `article_list` / `feed_summary` récupéraient n'importe quelle URL côté serveur : `http://api:3000/…`, `http://127.0.0.1`, `http://169.254.169.254/…`, `file://`.
- **Correctif** : `lib/safeUrl.ts` n'autorise que `http(s)` et refuse tout hôte qui résout vers une adresse privée, loopback ou link-local. 10 tests unitaires ajoutés (`safeUrl.test.ts`).
- **Limite connue** : seule l'URL initiale est vérifiée ; une redirection vers une adresse privée n'est pas bloquée.

### 8. `feed_summary` échouait entièrement si un seul flux était en panne
- **Correctif** : `Promise.allSettled` ; le widget n'échoue que si **tous** les flux échouent. Limite de 10 flux par widget.

### 9. Appels réseau sans timeout
- **Symptôme** : une API externe qui ne répond pas bloquait la requête indéfiniment.
- **Correctif** : timeout de 10 s (`AbortSignal.timeout`) sur les adaptateurs météo, finance, Hacker News, GitHub et RSS.

### 10. Nouveaux widgets tous à la position 0
- **Symptôme** : le front n'envoie pas de `position` à l'ajout ; tous les widgets créés avaient `position = 0`, d'où un ordre ambigu.
- **Correctif** : sans position explicite, le widget est ajouté en fin de grille (`max + 1`).

### 11. Un admin pouvait suspendre son propre compte
- Se rétrograder ou se supprimer était déjà bloqué, mais pas se suspendre (risque de verrouillage). Ajout du code `ADMIN_SELF_SUSPEND_FORBIDDEN` (+ traductions FR / EN).

## Constats non corrigés

- **Brute force des codes OTP** : codes à 6 chiffres, protégés seulement par le rate-limit par IP (10 req/min). Un compteur de tentatives par compte serait préférable.
- **Inscription si l'envoi du mail échoue** : le compte est créé avant l'envoi. Si SMTP est en panne, le client reçoit une erreur mais l'email est « pris » (il faut passer par « renvoyer le code »).
- **Open-Meteo** : appels ponctuellement en échec (`fetch failed`, `EAI_AGAIN`) pendant les tests, d'origine réseau / DNS. Le widget affiche bien l'erreur et se rafraîchit au cycle suivant.
- **Linter front** : un import inutilisé (`copyFileSync`) dans `frontend/scripts/make-standalone.mjs`.

## Non testé

- **Interface dans un navigateur** : aucun test visuel ou interactif (wizard, glisser-déposer, thèmes, modales). Seuls le build, le typage et le service des routes SPA ont été vérifiés.
- **OAuth GitHub** et **widgets GitHub** : pas de `GITHUB_CLIENT_ID` / `SECRET`. Seuls les refus attendus ont été testés (pas de lien → 400).
- **Envoi réel par Gmail** : les tests ont redirigé le SMTP vers Mailpit pour ne pas envoyer de faux mails.

## Reproduire

Les scénarios sont des scripts Node (fetch + lecture des codes OTP dans l'API Mailpit). Pour éviter l'envoi de mails réels, lancer l'API avec `SMTP_HOST=mailpit SMTP_PORT=1025 SMTP_USER= SMTP_PASS= SMTP_SECURE=false`. Le rate-limit d'auth (10 req/min par IP) impose d'espacer les exécutions.
