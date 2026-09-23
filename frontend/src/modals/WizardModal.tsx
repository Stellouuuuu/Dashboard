import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../components/Modal';
import {
  CATALOG,
  REFRESH_RATES,
  SERVICE_LABEL,
  catalogOf,
  type CatalogWidget,
} from '../data/catalog';
import { useAppData } from '../context/AppDataContext';
import { FormField } from '../components/FormField';

export function WizardModal() {
  const {
    modal,
    closeModal,
    openModal,
    instances,
    setInstances,
    wizardEditUid,
    nextUid,
    toast,
    setFlashUid,
    setAddedUid,
    isSubscribed,
  } = useAppData();
  const navigate = useNavigate();

  const open = modal === 'wizard';
  const isEditing = wizardEditUid != null;

  const [step, setStep] = useState(1);
  const [widget, setWidget] = useState<CatalogWidget | null>(null);
  const [config, setConfig] = useState<Record<string, string | number>>({});
  const [configErrors, setConfigErrors] = useState<Record<string, string>>({});
  const [rate, setRate] = useState(30);
  const [needsSubscribe, setNeedsSubscribe] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNeedsSubscribe(false);
    setConfigErrors({});
    if (wizardEditUid != null) {
      const editInst = instances.find((i) => i.uid === wizardEditUid);
      if (editInst) {
        setWidget(catalogOf(editInst.widgetId) ?? null);
        setConfig({ ...editInst.config });
        setRate(editInst.refresh);
        setStep(2);
        return;
      }
    }
    setWidget(null);
    setConfig({});
    setRate(30);
    setStep(1);
  }, [open, wizardEditUid]);

  const title = isEditing
    ? 'Reconfigurer le widget'
    : needsSubscribe
      ? 'Abonnement requis'
      : 'Ajouter un widget';

  const selectWidget = (w: CatalogWidget) => {
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
        toast('Choisis un widget pour continuer');
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
        if (v === undefined || v === '') errs[p.name] = `${p.label} est requis.`;
      });
      setConfigErrors(errs);
      if (Object.keys(errs).length) return;
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else {
      if (!widget) return;
      closeModal();
      if (isEditing && wizardEditUid != null) {
        setInstances((list) =>
          list.map((i) =>
            i.uid === wizardEditUid
              ? { ...i, config: { ...config }, refresh: rate, status: 'ok' }
              : i,
          ),
        );
        setFlashUid(wizardEditUid);
        toast('Widget reconfiguré');
      } else {
        const uid = nextUid();
        setInstances((list) => [
          ...list,
          {
            uid,
            widgetId: widget.id,
            config: { ...config },
            refresh: rate,
            status: 'ok',
            frameKey:
              widget.id === 'city_temperature'
                ? String(config.city).toLowerCase() === 'paris'
                  ? 'temp_paris'
                  : 'temp_cotonou'
                : undefined,
          },
        ]);
        setAddedUid(uid);
        toast('Widget ajouté au dashboard');
      }
    }
  };

  const serviceLabel = widget ? SERVICE_LABEL[widget.service] : '';

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
            Le widget <b>{widget.name}</b> appartient au service{' '}
            <b>{serviceLabel}</b>, auquel tu n&apos;es pas encore abonné(e).
          </p>
          <p className="auth-sub">
            Abonne-toi d&apos;abord, puis reviens terminer l&apos;ajout du widget.
          </p>
          <div className="wiz-actions" style={{ marginTop: 20 }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setNeedsSubscribe(false);
                setWidget(null);
              }}
            >
              Choisir un autre widget
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
              S&apos;abonner à {serviceLabel}
            </button>
          </div>
        </div>
      ) : (
        <>
          {step === 1 && (
            <div>
              <p className="wiz-hint">Choisis un widget dans le catalogue.</p>
              <div className="wiz-cat-grid">
                {CATALOG.map((w) => {
                  const soon = Boolean(w.comingSoon);
                  const locked = soon || !isSubscribed(w.service);
                  return (
                    <button
                      key={w.id}
                      type="button"
                      className={`wiz-cat accent-${w.service}${widget?.id === w.id ? ' selected' : ''}${locked ? ' locked' : ''}`}
                      disabled={soon}
                      onClick={() => {
                        if (soon) return;
                        selectWidget(w);
                      }}
                    >
                      <b>
                        {w.name}
                        {soon ? ' · bientôt' : locked ? ' · abonnement requis' : ''}
                      </b>
                      <span>{w.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && widget && (
            <div>
              <p className="wiz-hint">Configure ses paramètres.</p>
              {widget.params.map((p) => (
                <FormField
                  key={p.name}
                  label={`${p.label} (${p.type})`}
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
                À quelle fréquence doit-il se rafraîchir ?
              </p>
              <div className="rate-chips">
                {REFRESH_RATES.map((sec) => {
                  const label = sec < 60 ? `${sec} s` : `${sec / 60} min`;
                  return (
                    <button
                      key={sec}
                      type="button"
                      className={`rate-chip${rate === sec ? ' selected' : ''}`}
                      onClick={() => setRate(sec)}
                    >
                      Toutes les {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && widget && (
            <div>
              <p className="wiz-hint">Vérifie avant de confirmer.</p>
              <div className="review-box">
                <div>
                  <span>Widget</span>
                  <b>{widget.name}</b>
                </div>
                {Object.entries(config).map(([k, v]) => (
                  <div key={k}>
                    <span>{k}</span>
                    <b>{String(v)}</b>
                  </div>
                ))}
                <div>
                  <span>Rafraîchissement</span>
                  <b>{rate} s</b>
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
              Retour
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={goNext}>
              {step === 4
                ? isEditing
                  ? 'Enregistrer'
                  : 'Ajouter au dashboard'
                : 'Continuer'}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
