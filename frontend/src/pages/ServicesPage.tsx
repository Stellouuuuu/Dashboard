import { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { FormField } from '../components/FormField';
import { IMG } from '../data/images';

export function ServicesPage() {
  const {
    githubConnected,
    githubUsername,
    githubError,
    githubLoading,
    openModal,
    disconnectGithub,
    rssUrl,
    rssError,
    rssLoading,
    subscribeRss,
    unsubscribeRss,
  } = useAppData();

  const [showRssInput, setShowRssInput] = useState(false);
  const [rssDraft, setRssDraft] = useState('');
  const [rssFieldError, setRssFieldError] = useState<string | undefined>();

  const onSubscribeRss = async () => {
    setRssFieldError(undefined);
    if (!rssDraft.trim()) {
      setRssFieldError('Indique une URL de flux.');
      return;
    }
    try {
      await subscribeRss(rssDraft.trim());
      setShowRssInput(false);
      setRssDraft('');
    } catch (e) {
      setRssFieldError(e instanceof Error ? e.message : 'Échec');
    }
  };

  return (
    <div className="app-pane">
      <div className="pane-head">
        <div>
          <h1>Mes services</h1>
          <div className="pane-sub">Connecte tes comptes pour débloquer leurs widgets.</div>
        </div>
      </div>
      <div className="svc-list">
        <div className="svc-row">
          <span className="dash-svc-thumb" aria-hidden="true">
            <img src={IMG.service.weather} alt="" loading="lazy" />
          </span>
          <div className="svc-row-info">
            <h3>Météo</h3>
            <p>Aucun compte requis, disponible pour tout utilisateur connecté.</p>
          </div>
          <div className="svc-row-actions">
            <span className="badge badge-on">Actif</span>
          </div>
        </div>

        <div className="svc-row">
          <span className="dash-svc-thumb" aria-hidden="true">
            <img src={IMG.service.github} alt="" loading="lazy" />
          </span>
          <div className="svc-row-info">
            <h3>GitHub</h3>
            <p>
              {githubConnected
                ? `Connecté en tant que @${githubUsername}`
                : 'Connecte ton compte pour lire tes dépôts.'}
            </p>
            {githubError && !githubConnected && (
              <p className="field-error-msg" role="alert">
                {githubError}
              </p>
            )}
          </div>
          <div className="svc-row-actions">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={githubLoading}
              onClick={() => {
                if (githubConnected) disconnectGithub();
                else openModal('oauth');
              }}
            >
              {githubLoading
                ? '…'
                : githubConnected
                  ? 'Déconnecter'
                  : 'Connecter GitHub'}
            </button>
          </div>
        </div>

        <div className="svc-row">
          <span className="dash-svc-thumb" aria-hidden="true">
            <img src={IMG.service.rss} alt="" loading="lazy" />
          </span>
          <div className="svc-row-info">
            <h3>RSS</h3>
            <p className="svc-url">
              {rssUrl
                ? `Abonné(e) — ${rssUrl}`
                : "Ajoute l'URL d'un flux pour t'y abonner."}
            </p>
            {showRssInput && !rssUrl && (
              <div className="svc-rss-form">
                <FormField
                  label="URL du flux"
                  error={rssFieldError || rssError || undefined}
                  htmlFor="rss-url"
                >
                  <input
                    id="rss-url"
                    className="feed-input"
                    value={rssDraft}
                    onChange={(e) => setRssDraft(e.target.value)}
                    placeholder="https://flux.exemple.com/rss"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void onSubscribeRss();
                    }}
                  />
                </FormField>
              </div>
            )}
          </div>
          <div className="svc-row-actions">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={rssLoading}
              onClick={() => {
                if (rssUrl) {
                  unsubscribeRss();
                  return;
                }
                if (!showRssInput) {
                  setShowRssInput(true);
                  return;
                }
                void onSubscribeRss();
              }}
            >
              {rssLoading
                ? '…'
                : rssUrl
                  ? 'Se désabonner'
                  : showRssInput
                    ? 'Valider'
                    : "S'abonner"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
