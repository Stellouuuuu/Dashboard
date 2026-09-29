# Tests Unitaires Backend (Vitest)

Ce dossier contient l'explication des tests unitaires mis en place sur le backend du Dashboard EPITECH.
Ils ont été créés pour vérifier les composants métier critiques de manière isolée, sans dépendance à une base de données ou à un réseau.

## Outils Utilisés
* **[Vitest](https://vitest.dev/)** : Le framework de test (compatible nativement avec ESM et TypeScript, ce qui évite de gros problèmes de configuration par rapport à Jest).
* Les tests sont configurés via le fichier `backend/vitest.config.ts`.

## Comment Lancer les Tests

Dans le dossier `backend` :
- `npm run test` : Lance tous les tests une fois.
- `npm run test:watch` : Lance les tests en mode veille (ils se relancent à chaque modification de fichier).

## Ce qui est testé

### 1. Cryptographie (`backend/src/lib/crypto.ts`)
* **Chiffrement / Déchiffrement AES-256-GCM** : Vérifie que `encrypt` chiffre bien les données et que `decrypt` les récupère.
* **Non-déterminisme** : S'assure que deux chiffrements du même texte produisent un résultat différent (grâce au vecteur d'initialisation aléatoire).
* **Robustesse** : S'assure que si les données chiffrées sont altérées, `decrypt` refuse de les lire et lève une exception (grâce au tag d'authentification).
* **Bugs corrigés couverts** : Traite correctement les chaînes vides, ce qui produisait un crash auparavant.

### 2. Gestion des erreurs HTTP (`backend/src/lib/httpError.ts`)
* Vérifie la classe `HttpError`.
* S'assure que les `ERROR_CODES` essentiels sont bien tous là et invariants pour le front-end (ex: `AUTH_EMAIL_TAKEN`).

### 3. Gestion des Tokens et OTP (`backend/src/lib/token.ts`)
* **`generateToken`** : Vérifie la taille et l'aléatoire d'un jeton (utilisé pour les Refresh Tokens).
* **`generateOtpCode`** : Vérifie qu'il génère bien un code à 6 chiffres stricts.
* **`hashToken`** : Vérifie la nature déterministe du hashage (SHA-256) pour le stockage sécurisé.

### 4. Registre des Widgets (`backend/src/widgets/registry.ts`)
* Vérifie la présence des ~10 widgets.
* Teste la validité de la configuration Zod (ex: limite de jours pour la météo, validation du format d'un repo GitHub, URLs correctes pour le RSS).
* Vérifie la concordance entre les identifiants déclarés.

### 5. Constantes de config (`backend/src/config/constants.ts`)
* S'assure que la limitation de rafraîchissement d'un widget (minimum 30 secondes) ne bouge pas.

## Fonctionnement du Setup
Il n'est pas possible de lancer les tests de cryptographie si `CRYPTO_KEY` n'est pas définie dans l'environnement. Plutôt que de forcer la création d'un fichier `.env` pour les tests, j'ai créé un fichier **`backend/src/__tests__/setup.ts`** qui injecte de fausses variables d'environnement (`CRYPTO_KEY` avec 64 'a', etc.) juste avant l'exécution.
