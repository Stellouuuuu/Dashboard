import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { Modal } from '../components/Modal';
import { ACCENT, REFRESH_RATES, SERVICES } from '../data/catalog';
import { widgetName, widgetDescription, widgetParamLabel } from '../i18n/widgets';
import { ServiceIcon } from '../components/Icons';
import { useAppData, toWidgetInstance } from '../context/AppDataContext';
import { apiAddDashboardWidget, apiReconfigureDashboardWidget, ApiError, type ApiWidgetDefinition } from '../api/client';
import { FormField } from '../components/FormField';

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
