import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { Modal } from '../components/Modal';
import { ACCENT, REFRESH_RATES, SERVICES } from '../data/catalog';
import { widgetName, widgetDescription, widgetParamLabel } from '../i18n/widgets';
import { ServiceIcon } from '../components/Icons';
import { useAppData, toWidgetInstance } from '../context/AppDataContext';
import {
  apiAddDashboardWidget,
  apiReconfigureDashboardWidget,
  apiSearchWeatherCities,
  apiReverseGeocodeWeatherCity,
  ApiError,
  type ApiCitySuggestion,
  type ApiWidgetDefinition,
} from '../api/client';
import { FormField } from '../components/FormField';

/**
 * Champ ville des widgets météo : autocomplétion (debounce 300ms) + bouton
 * géolocalisation, pour éviter les fautes de frappe qui résolvent silencieusement
 * vers une mauvaise ville (ex: "Abomay-Calvi" → Calvi, Bolivie).
 */
function CityField({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState<ApiCitySuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const debounceRef = useRef<number | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  // Portail vers document.body (voir Modal.tsx) : la modale a overflow:hidden et
  // le body overflow:auto, donc une liste position:absolute se faisait tronquer
  // et perdait la bataille de z-index contre les boutons "Retour"/"Continuer".
  useEffect(() => {
    if (!open || suggestions.length === 0) return;
    const update = () => {
      const r = rowRef.current?.getBoundingClientRect();
      if (r) setRect({ top: r.bottom + 4, left: r.left, width: r.width });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, suggestions.length]);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = window.setTimeout(() => {
      apiSearchWeatherCities(value)
        .then(setSuggestions)
        .catch(() => setSuggestions([]));
    }, 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [value]);

  const pick = (s: ApiCitySuggestion) => {
    onChange(s.country ? `${s.name}, ${s.country}` : s.name);
    setSuggestions([]);
    setOpen(false);
  };

  const useLocation = () => {
    setLocError(null);
    if (!navigator.geolocation) {
      setLocError(t('wizard.locationUnsupported'));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        apiReverseGeocodeWeatherCity(pos.coords.latitude, pos.coords.longitude)
          .then((res) => {
            onChange(res.city);
            setSuggestions([]);
            setOpen(false);
          })
          .catch((err) =>
            setLocError(
              err instanceof ApiError
                ? `${t('wizard.locationLookupFailed')} (${err.message})`
                : t('wizard.locationLookupFailed'),
            ),
          )
          .finally(() => setLocating(false));
      },
      (err) => {
        // Distingue le refus de permission (cas le plus courant) d'une vraie panne
        // GPS/réseau, pour pouvoir diagnostiquer au lieu d'un message générique.
        const message =
          err.code === err.PERMISSION_DENIED
            ? t('wizard.locationPermissionDenied')
            : err.code === err.TIMEOUT
              ? t('wizard.locationTimeout')
              : t('wizard.locationDenied');
        setLocError(message);
        setLocating(false);
      },
      // Desktop/Linux sans GPS passe par la géoloc réseau du navigateur, souvent
      // plus lente que 10s. maximumAge accepte une position récente déjà connue
      // au lieu d'en redemander une, pour les clics suivants.
      { timeout: 20000, maximumAge: 300000 },
    );
  };

  return (
    <div className="city-field">
      <div className="city-field-row" ref={rowRef}>
        <input
          id={id}
          type="text"
          autoComplete="off"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        />
        <button
          type="button"
          className="btn-locate"
          onClick={useLocation}
          disabled={locating}
          title={t('wizard.useMyLocation')}
          aria-label={t('wizard.useMyLocation')}
        >
          {locating ? '…' : '📍'}
        </button>
      </div>
      {open &&
        suggestions.length > 0 &&
        rect &&
        createPortal(
          <ul className="city-suggestions" style={{ top: rect.top, left: rect.left, width: rect.width }}>
            {suggestions.map((s) => (
              <li key={`${s.name}-${s.region ?? ''}-${s.country ?? ''}`}>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(s)}>
                  {[s.name, s.region, s.country].filter(Boolean).join(', ')}
                </button>
              </li>
            ))}
          </ul>,
          document.body,
        )}
      {locError && (
        <p className="field-error-msg" role="alert">
          {locError}
        </p>
      )}
    </div>
  );
}

export function WizardModal() {
  const { t } = useTranslation();
  const {
    modal,
    closeModal,
    openModal,
    instances,
    setInstances,
    catalog,
    wizardEditUid,
    wizardPresetId,
    toast,
    setFlashUid,
    setAddedUid,
    isSubscribed,
  } = useAppData();
  const navigate = useNavigate();

  const open = modal === 'wizard';
  const isEditing = wizardEditUid != null;

  const [step, setStep] = useState(1);
  const [widget, setWidget] = useState<ApiWidgetDefinition | null>(null);
  const [config, setConfig] = useState<Record<string, string | number>>({});
  const [configErrors, setConfigErrors] = useState<Record<string, string>>({});
  const [rate, setRate] = useState<number>(REFRESH_RATES[0]);
  const [needsSubscribe, setNeedsSubscribe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setNeedsSubscribe(false);
    setConfigErrors({});
    setSubmitError(null);
    if (wizardEditUid != null) {
      const editInst = instances.find((i) => i.uid === wizardEditUid);
      if (editInst) {
        setWidget(catalog.find((w) => w.name === editInst.widgetId) ?? null);
        setConfig({ ...editInst.config });
        setRate(editInst.refresh);
        setStep(2);
        return;
      }
    }
    const preset = wizardPresetId ? (catalog.find((w) => w.name === wizardPresetId) ?? null) : null;
    setWidget(preset);
    setConfig({});
    setRate(REFRESH_RATES[0]);
    setStep(1);
    if (preset && !isSubscribed(preset.service)) setNeedsSubscribe(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, wizardEditUid, wizardPresetId, catalog]);

  const title = isEditing
    ? t('wizard.title.reconfigure')
    : needsSubscribe
      ? t('wizard.title.subscribeRequired')
      : t('wizard.title.add');

  const selectWidget = (w: ApiWidgetDefinition) => {
    setWidget(w);
    setConfig({});
    setConfigErrors({});
    if (!isEditing && !isSubscribed(w.service)) {
      setNeedsSubscribe(true);
    } else {
      setNeedsSubscribe(false);
    }
  };

  const goNext = () => {
    if (needsSubscribe) return;
    if (step === 1) {
      if (!widget) {
        toast(t('wizard.chooseWidget'));
        return;
      }
      if (!isSubscribed(widget.service)) {
        setNeedsSubscribe(true);
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!widget) return;
      const errs: Record<string, string> = {};
      widget.params.forEach((p) => {
        const v = config[p.name];
        if (v === undefined || v === '')
          errs[p.name] = t('wizard.paramRequired', { label: widgetParamLabel(t, widget.name, p.name, p.label) });
      });
      setConfigErrors(errs);
      if (Object.keys(errs).length) return;
      setStep(3);
    } else if (step === 3) {
      if (rate < 30) setRate(30);
      setStep(4);
    } else {
      if (!widget || submitting) return;
      setSubmitting(true);
      setSubmitError(null);
      const action =
        isEditing && wizardEditUid != null
          ? apiReconfigureDashboardWidget(wizardEditUid, { config, refreshRate: rate })
          : apiAddDashboardWidget({ widgetName: widget.name, config, refreshRate: rate });

      action
        .then((row) => {
          const inst = toWidgetInstance(row);
          if (isEditing && wizardEditUid != null) {
            setInstances((list) => list.map((i) => (i.uid === wizardEditUid ? inst : i)));
            setFlashUid(wizardEditUid);
            toast(t('wizard.reconfigured'));
          } else {
            setInstances((list) => [...list, inst]);
            setAddedUid(inst.uid);
            toast(t('wizard.added'));
          }
          closeModal();
        })
        .catch((e) => {
          setSubmitError(e instanceof ApiError ? t(`errors.${e.code}`, { defaultValue: t('wizard.saveFailed') }) : t('wizard.saveFailed'));
        })
        .finally(() => setSubmitting(false));
    }
  };

  const serviceLabel = widget ? t(`common.services.${widget.service}`) : '';

  return (
    <Modal open={open} onClose={closeModal} title={title} wide>
      {!needsSubscribe && (
        <div className="wiz-steps">
          {[1, 2, 3, 4].map((s) => (
            <span
              key={s}
              className={s < step ? 'done' : s === step ? 'active' : undefined}
            />
          ))}
        </div>
      )}

      {needsSubscribe && widget ? (
        <div className="subscribe-gate">
          <p>
            <Trans
              i18nKey="wizard.subscribeIntro"
              values={{ widget: widgetName(t, widget.name), service: serviceLabel }}
              components={{ b: <b /> }}
            />
          </p>
          <p className="auth-sub">{t('wizard.subscribeHint')}</p>
          <div className="wiz-actions" style={{ marginTop: 20 }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setNeedsSubscribe(false);
                setWidget(null);
              }}
            >
              {t('wizard.chooseAnother')}
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                closeModal();
                if (widget.service === 'github') {
                  openModal('oauth');
                } else {
                  navigate('/services');
                }
              }}
            >
              {t('wizard.subscribeTo', { service: serviceLabel })}
            </button>
          </div>
        </div>
      ) : (
        <>
          {step === 1 && (
            <div className="wiz-catalog">
              {SERVICES.map((svc) => {
                const subscribed = isSubscribed(svc);
                const widgets = catalog.filter((w) => w.service === svc);
                const svcLabel = t(`common.services.${svc}`);
                return (
                  <div key={svc} className="wiz-group" role="group" aria-label={svcLabel}>
                    <div className="wiz-group-head">
                      <span className={`wcard-svc svc-${ACCENT[svc]}`} aria-hidden="true">
                        <ServiceIcon service={svc} />
                      </span>
                      <b>{svcLabel}</b>
                      <span className={`wiz-group-status${subscribed ? ' on' : ''}`}>
                        {subscribed ? t('wizard.available') : t('wizard.connectionRequired')}
                      </span>
                    </div>
                    <div className="wiz-cat-grid">
                      {widgets.map((w) => (
                        <button
                          key={w.name}
                          type="button"
                          className={`wiz-cat${widget?.name === w.name ? ' selected' : ''}${subscribed ? '' : ' locked'}`}
                          aria-pressed={widget?.name === w.name}
                          onClick={() => selectWidget(w)}
                        >
                          <b>{widgetName(t, w.name)}</b>
                          <span>{widgetDescription(t, w.name, w.description)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {step === 2 && widget && (
            <div>
              <p className="wiz-hint">{t('wizard.configureHint')}</p>
              {widget.params.map((p) => (
                <FormField
                  key={p.name}
                  label={widgetParamLabel(t, widget.name, p.name, p.label)}
                  error={configErrors[p.name]}
                  htmlFor={`wiz-${p.name}`}
                >
                  {p.name === 'city' ? (
                    <CityField
                      id={`wiz-${p.name}`}
                      value={String(config[p.name] ?? '')}
                      onChange={(v) => setConfig((c) => ({ ...c, [p.name]: v }))}
                    />
                  ) : (
                    <input
                      id={`wiz-${p.name}`}
                      type={p.type === 'integer' ? 'number' : 'text'}
                      value={config[p.name] ?? ''}
                      onChange={(e) =>
                        setConfig((c) => ({
                          ...c,
                          [p.name]:
                            p.type === 'integer'
                              ? Number(e.target.value)
                              : e.target.value,
                        }))
                      }
                    />
                  )}
                </FormField>
              ))}
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="wiz-hint" style={{ marginBottom: 6 }}>
                {t('wizard.frequencyHint')}
              </p>
              <div className="rate-chips">
                {REFRESH_RATES.map((sec) => {
                  const label = sec < 60 ? `${sec} ${t('wizard.secondsUnit')}` : `${sec / 60} ${t('wizard.minutesUnit')}`;
                  return (
                    <button
                      key={sec}
                      type="button"
                      className={`rate-chip${rate === sec ? ' selected' : ''}`}
                      onClick={() => setRate(sec)}
                    >
                      {t('wizard.every', { value: label })}
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: 16 }}>
                <FormField label={t('wizard.customRate', { defaultValue: 'Ou saisissez une valeur personnalisée (secondes, min 30)' })} htmlFor="wiz-custom-rate">
                  <input
                    id="wiz-custom-rate"
                    type="number"
                    min="30"
                    value={rate || ''}
                    onChange={(e) => setRate(parseInt(e.target.value) || 0)}
                    onBlur={() => setRate(Math.max(30, rate))}
                  />
                </FormField>
              </div>
            </div>
          )}

          {step === 4 && widget && (
            <div>
              <p className="wiz-hint">{t('wizard.reviewHint')}</p>
              {submitError && (
                <div className="form-banner error" role="alert" style={{ marginBottom: 12 }}>
                  {submitError}
                </div>
              )}
              <div className="review-box">
                <div>
                  <span>{t('wizard.reviewWidget')}</span>
                  <b>{widgetName(t, widget.name)}</b>
                </div>
                {Object.entries(config).map(([k, v]) => (
                  <div key={k}>
                    <span>
                      {widgetParamLabel(t, widget.name, k, widget.params.find((p) => p.name === k)?.label ?? k)}
                    </span>
                    <b>{String(v)}</b>
                  </div>
                ))}
                <div>
                  <span>{t('wizard.reviewRefresh')}</span>
                  <b>{rate < 60 ? `${rate} ${t('wizard.secondsUnit')}` : `${rate / 60} ${t('wizard.minutesUnit')}`}</b>
                </div>
              </div>
            </div>
          )}

          <div className="wiz-actions">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ visibility: step === 1 ? 'hidden' : 'visible' }}
              onClick={() => setStep((s) => Math.max(1, s - 1))}
            >
              {t('wizard.back')}
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={goNext} disabled={submitting}>
              {step === 4
                ? submitting
                  ? t('wizard.saving')
                  : isEditing
                    ? t('wizard.saveEdit')
                    : t('wizard.addToDashboard')
                : t('wizard.continue')}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
