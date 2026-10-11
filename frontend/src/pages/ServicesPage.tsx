import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppData } from '../context/AppDataContext';
import { IMG } from '../data/images';
import type { ExtraProvider } from '../context/AppDataContext';

const EXTRA_PROVIDERS: ExtraProvider[] = ['spotify', 'linkedin'];

export function ServicesPage() {
  const { t } = useTranslation();
  const {
    githubConnected,
    githubError,
    githubLoading,
    connectGithub,
    disconnectGithub,
    loadServices,
    completeGithubLink,
    providerConnected,
    providerError,
    providerLoading,
    connectProvider,
    disconnectProvider,
    completeProviderLink,
    setProviderError,
  } = useAppData();

  const [searchParams, setSearchParams] = useSearchParams();

  // Retour de redirection OAuth GitHub (PLAN.md §6.1) : /services?github=linked|error.
  useEffect(() => {
    const github = searchParams.get('github');
    const returned = EXTRA_PROVIDERS.find((p) => searchParams.get(p));
    if (github === 'linked') {
      void completeGithubLink();
    } else if (returned && searchParams.get(returned) === 'linked') {
      void completeProviderLink(returned);
    } else {
      void loadServices();
      if (returned) setProviderError(returned, searchParams.get('reason') ?? 'OAUTH_EXCHANGE_FAILED');
    }
    if (github || returned) {
      searchParams.delete('github');
      EXTRA_PROVIDERS.forEach((p) => searchParams.delete(p));
      searchParams.delete('reason');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="app-pane">
      <div className="pane-head">
        <div>
          <h1>{t('services.title')}</h1>
          <div className="pane-sub">{t('services.lead')}</div>
        </div>
      </div>
      <div className="svc-list">
        <div className="svc-row">
          <span className="dash-svc-thumb" aria-hidden="true">
            <img src={IMG.service.weather} alt="" loading="lazy" />
          </span>
          <div className="svc-row-info">
            <h3>{t('services.weather.title')}</h3>
            <p>{t('services.weather.desc')}</p>
          </div>
          <div className="svc-row-actions">
            <span className="badge badge-on">{t('services.active')}</span>
          </div>
        </div>

        <div className="svc-row">
          <span className="dash-svc-thumb" aria-hidden="true">
            <img src={IMG.service.github} alt="" loading="lazy" />
          </span>
          <div className="svc-row-info">
            <h3>{t('services.github.title')}</h3>
            <p>{githubConnected ? t('services.github.connected') : t('services.github.notConnected')}</p>
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
                if (githubConnected) void disconnectGithub();
                else void connectGithub();
              }}
            >
              {githubLoading
                ? '…'
                : githubConnected
                  ? t('services.github.disconnect')
                  : t('services.github.connect')}
            </button>
          </div>
        </div>

        <div className="svc-row">
          <span className="dash-svc-thumb" aria-hidden="true">
            <img src={IMG.service.rss} alt="" loading="lazy" />
          </span>
          <div className="svc-row-info">
            <h3>{t('services.rss.title')}</h3>
            <p>{t('services.rss.desc')}</p>
          </div>
          <div className="svc-row-actions">
            <span className="badge badge-on">{t('services.active')}</span>
          </div>
        </div>

        <div className="svc-row">
          <span className="dash-svc-thumb" aria-hidden="true">
            <img src={IMG.service.finance} alt="" loading="lazy" />
          </span>
          <div className="svc-row-info">
            <h3>{t('services.finance.title')}</h3>
            <p>{t('services.finance.desc')}</p>
          </div>
          <div className="svc-row-actions">
            <span className="badge badge-on">{t('services.active')}</span>
          </div>
        </div>

        <div className="svc-row">
          <span className="dash-svc-thumb" aria-hidden="true">
            <img src={IMG.service.hackernews} alt="" loading="lazy" />
          </span>
          <div className="svc-row-info">
            <h3>{t('services.hackernews.title')}</h3>
            <p>{t('services.hackernews.desc')}</p>
          </div>
          <div className="svc-row-actions">
            <span className="badge badge-on">{t('services.active')}</span>
          </div>
        </div>
        {EXTRA_PROVIDERS.map((p) => (
          <div className="svc-row" key={p}>
            <span className="dash-svc-thumb" aria-hidden="true">
              <img src={IMG.service[p]} alt="" loading="lazy" />
            </span>
            <div className="svc-row-info">
              <h3>{t(`services.${p}.title`)}</h3>
              <p>{providerConnected[p] ? t(`services.${p}.connected`) : t(`services.${p}.notConnected`)}</p>
              {providerError[p] && !providerConnected[p] && (
                <p className="field-error-msg" role="alert">
                  {providerError[p]}
                </p>
              )}
            </div>
            <div className="svc-row-actions">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={providerLoading[p]}
                onClick={() => {
                  if (providerConnected[p]) void disconnectProvider(p);
                  else connectProvider(p);
                }}
              >
                {providerLoading[p]
                  ? '…'
                  : providerConnected[p]
                    ? t(`services.${p}.disconnect`)
                    : t(`services.${p}.connect`)}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
