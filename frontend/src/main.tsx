import '@fontsource-variable/inter';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './styles/glass.css';
import './i18n';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// PWA installable (bonus, voir docs/TECH_CHOICES.md) : enregistré après le chargement
// pour ne jamais retarder le premier rendu. Pas de vite-plugin-pwa — un seul fichier
// fait maison suffit pour ce périmètre (voir public/sw.js).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Best-effort : l'app reste pleinement fonctionnelle sans service worker.
    });
  });
}
