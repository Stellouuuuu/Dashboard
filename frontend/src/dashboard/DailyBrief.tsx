import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiGetDailyBrief, ApiError } from '../api/client';

/** Résumé quotidien généré par IA (Gemini), agrégeant tous les widgets (bonus). */
export function DailyBrief() {
  const { t } = useTranslation();
  const [state, setState] = useState<'loading' | 'ready' | 'hidden' | 'empty' | 'error'>('loading');
  const [text, setText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const load = (force: boolean) => {
    setState('loading');
    apiGetDailyBrief(force)
      .then((res) => {
        setText(res.text);
        setState('ready');
      })
      .catch((e) => {
        if (e instanceof ApiError && e.code === 'AI_BRIEF_NOT_CONFIGURED') {
          setState('hidden');
        } else if (e instanceof ApiError && e.code === 'AI_BRIEF_NO_DATA') {
          setState('empty');
        } else {
          setErrorMsg(e instanceof ApiError ? t(`errors.${e.code}`, { defaultValue: t('errors.INTERNAL_ERROR') }) : t('errors.INTERNAL_ERROR'));
          setState('error');
        }
      });
  };

  useEffect(() => {
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state === 'hidden') return null;

  return (
    <div className="brief-card">
      <div className="brief-head">
        <h3>{t('dashboard.brief.title')}</h3>
        {state === 'ready' && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => load(true)}>
            {t('dashboard.brief.regenerate')}
          </button>
        )}
      </div>
      {state === 'loading' && <p className="brief-text brief-loading">{t('dashboard.brief.loading')}</p>}
      {state === 'ready' && <p className="brief-text">{text}</p>}
      {state === 'empty' && <p className="brief-text brief-dim">{t('dashboard.brief.empty')}</p>}
      {state === 'error' && (
        <p className="field-error-msg" role="alert">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
