import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../auth/AuthContext';
import { ApiAuthError } from '../api/auth';
import { IMG } from '../data/images';
import { IconGoogle } from '../components/Icons';
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
  const { user, connectGoogle, disconnectGoogle, refreshUser } = useAuth();

  const [searchParams, setSearchParams] = useSearchParams();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  // Retour de redirection OAuth GitHub (PLAN.md §6.1) : /services?github=linked|error.
  // Et Google (liaison depuis Services, pas la connexion initiale) : ?google=linked|error.
  useEffect(() => {
    const github = searchParams.get('github');
    const google = searchParams.get('google');
    const returned = EXTRA_PROVIDERS.find((p) => searchParams.get(p));
    if (github === 'linked') {
      void completeGithubLink();
    } else if (returned && searchParams.get(returned) === 'linked') {
      void completeProviderLink(returned);
    } else {
      void loadServices();
      if (returned) setProviderError(returned, searchParams.get('reason') ?? 'OAUTH_EXCHANGE_FAILED');
    }
    if (google === 'linked') {
      void refreshUser();
    } else if (google === 'error') {
      setGoogleError(t('services.google.linkFailed'));
    }
    if (github || google || returned) {
      searchParams.delete('github');
      searchParams.delete('google');
      EXTRA_PROVIDERS.forEach((p) => searchParams.delete(p));
      searchParams.delete('reason');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleToggle = async () => {
    if (user?.googleLinked) {
      setGoogleLoading(true);
      setGoogleError(null);
      try {
        await disconnectGoogle();
      } catch (e) {
        setGoogleError(
          e instanceof ApiAuthError ? t(`errors.${e.code}`, { defaultValue: t('errors.INTERNAL_ERROR') }) : t('errors.INTERNAL_ERROR'),
        );
      } finally {
        setGoogleLoading(false);
      }
    } else {
      connectGoogle();
    }
  };

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
          <span className="dash-svc-thumb svc-thumb-icon" aria-hidden="true">
            <IconGoogle />
          </span>
          <div className="svc-row-info">
            <h3>{t('services.google.title')}</h3>
            <p>{user?.googleLinked ? t('services.google.connected', { email: user.email }) : t('services.google.notConnected')}</p>
            {googleError && !user?.googleLinked && (
              <p className="field-error-msg" role="alert">
                {googleError}
              </p>
            )}
          </div>
          <div className="svc-row-actions">
            <button type="button" className="btn btn-ghost btn-sm" disabled={googleLoading} onClick={() => void handleGoogleToggle()}>
              {googleLoading
                ? '…'
                : user?.googleLinked
                  ? t('services.google.disconnect')
                  : t('services.google.connect')}
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
        <div className="svc-row">
          <span className="dash-svc-thumb" aria-hidden="true">
            <img src={IMG.service.youtube} alt="" loading="lazy" />
          </span>
          <div className="svc-row-info">
            <h3>{t('services.youtube.title')}</h3>
            <p>{t('services.youtube.desc')}</p>
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
