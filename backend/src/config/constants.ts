// Refresh rate en secondes — chaque instance de widget communique le sien au Timer
// côté client (PLAN.md §4.3) ; l'API impose un minimum pour éviter le spam d'APIs externes.
export const CONSTANTS = {
  REFRESH_RATE_DEFAULT: 60,
  REFRESH_RATE_MIN: 30,
};
