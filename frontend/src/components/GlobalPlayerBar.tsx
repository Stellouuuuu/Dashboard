import { useTranslation } from 'react-i18next';
import { useAppData } from '../context/AppDataContext';
import { IconClose } from './Icons';

/**
 * Barre de lecture Spotify persistante (bonus) — montée une seule fois dans
 * AppLayout, jamais démontée tant que la session dure. C'est le SEUL endroit où
 * l'iframe Spotify existe : un iframe qui change de parent DOM est rechargé par le
 * navigateur (perte de la lecture en cours), donc on ne le déplace jamais — les
 * tuiles de widget n'affichent qu'un aperçu statique (voir WidgetCard.tsx). Comme
 * ce composant ne démonte jamais et que l'iframe reste toujours à la même place du
 * DOM, la lecture continue en changeant de page, et ne s'arrête que si
 * l'utilisateur ferme l'onglet, rafraîchit, ou clique sur arrêter.
 */
export function GlobalPlayerBar() {
  const { t } = useTranslation();
  const { activePlayer, setActivePlayer } = useAppData();

  if (!activePlayer) return null;

  return (
    <div className="global-player open">
      <span className="global-player-title">{activePlayer.title}</span>
      <div className="global-player-slot">
        <iframe
          className="spotify-frame"
          src={activePlayer.embedUrl}
          height={80}
          title={activePlayer.title}
          loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        />
      </div>
      <button
        type="button"
        className="global-player-close"
        onClick={() => setActivePlayer(null)}
        aria-label={t('dashboard.card.stopPlayer')}
      >
        <IconClose />
      </button>
    </div>
  );
}
