import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useAppData } from '../context/AppDataContext';
import { IconClose } from './Icons';

/**
 * Barre de lecture Spotify persistante (bonus) — montée une seule fois dans
 * AppLayout, jamais démontée tant que la session dure. L'iframe réelle vit ici ;
 * WidgetCard ne fait que proposer un point d'ancrage (`playerDockEl`) vers lequel
 * on la déplace par portail quand la tuile du lecteur actif est affichée. Comme le
 * composant propriétaire de l'iframe ne démonte jamais, React déplace le vrai nœud
 * DOM au lieu de le recréer : la lecture continue en changeant de page, et ne
 * s'arrête que si l'utilisateur quitte vraiment l'app (ferme l'onglet, demande
 * explicite du cahier des charges de cette fonctionnalité).
 */
export function GlobalPlayerBar() {
  const { t } = useTranslation();
  const { activePlayer, setActivePlayer, playerDockEl } = useAppData();
  const [fallbackEl, setFallbackEl] = useState<HTMLDivElement | null>(null);

  // Portail vers la tuile si elle est affichée (Dashboard), sinon vers la barre elle-même.
  const target = playerDockEl ?? fallbackEl;
  const dockedInTile = playerDockEl !== null;

  return (
    <div className={`global-player${activePlayer ? ' open' : ''}`}>
      {activePlayer && (
        <>
          <span className="global-player-title">{activePlayer.title}</span>
          <div className={`global-player-slot${dockedInTile ? ' collapsed' : ''}`} ref={setFallbackEl} />
          <button
            type="button"
            className="global-player-close"
            onClick={() => setActivePlayer(null)}
            aria-label={t('dashboard.card.stopPlayer')}
          >
            <IconClose />
          </button>
        </>
      )}
      {activePlayer &&
        target &&
        createPortal(
          <iframe
            className="spotify-frame"
            src={activePlayer.embedUrl}
            height={dockedInTile ? 152 : 80}
            title={activePlayer.title}
            loading="lazy"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          />,
          target,
        )}
    </div>
  );
}
