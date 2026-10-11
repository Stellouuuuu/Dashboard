import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/Modal';
import { Sparkline } from '../components/Sparkline';
import { formatNumber } from '../i18n/format';
import {
  apiClearWidgetAlert,
  apiGetWidgetAlert,
  apiGetWidgetHistory,
  apiSetWidgetAlert,
  ApiError,
} from '../api/client';
import type {
  CityTemperature,
  CommitSummary,
  CryptoPrice,
  ExchangeRate,
  FeedItem,
  HnStory,
  PrecipitationDay,
  SecurityAlertSummary,
} from './summary';

interface WidgetDetailModalProps {
  open: boolean;
  onClose: () => void;
  uid: number;
  widgetId: string;
  title: string;
  data: unknown;
}

// Mêmes widgets que ALERTABLE_WIDGETS côté backend (dashboard.service.ts) — ont une
// valeur numérique suivie dans le temps (bonus : sparkline + alerte de seuil).
const TRACKABLE_WIDGETS = new Set(['city_temperature', 'crypto_price', 'exchange_rate', 'precipitation_forecast']);

/** Historique (sparkline) + alerte de seuil d'une instance de widget (bonus). */
function TrackingSection({ uid }: { uid: number }) {
  const { t } = useTranslation();
  const [history, setHistory] = useState<number[] | null>(null);
  const [alert, setAlertState] = useState<{ operator: 'above' | 'below'; threshold: number } | null | undefined>(
    undefined,
  );
  const [operator, setOperator] = useState<'above' | 'below'>('above');
  const [threshold, setThreshold] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGetWidgetHistory(uid)
      .then((points) => setHistory(points.map((p) => p.value)))
      .catch(() => setHistory([]));
    apiGetWidgetAlert(uid)
      .then((a) => {
        setAlertState(a);
        if (a) {
          setOperator(a.operator);
          setThreshold(String(a.threshold));
        }
      })
      .catch(() => setAlertState(null));
  }, [uid]);

  const saveAlert = async () => {
    const value = Number(threshold);
    if (!Number.isFinite(value)) return;
    setSaving(true);
    setError(null);
    try {
      await apiSetWidgetAlert(uid, operator, value);
      setAlertState({ operator, threshold: value });
    } catch (e) {
      setError(e instanceof ApiError ? t(`errors.${e.code}`, { defaultValue: t('errors.INTERNAL_ERROR') }) : t('errors.INTERNAL_ERROR'));
    } finally {
      setSaving(false);
    }
  };

  const removeAlert = async () => {
    setSaving(true);
    setError(null);
    try {
      await apiClearWidgetAlert(uid);
      setAlertState(null);
      setThreshold('');
    } catch (e) {
      setError(e instanceof ApiError ? t(`errors.${e.code}`, { defaultValue: t('errors.INTERNAL_ERROR') }) : t('errors.INTERNAL_ERROR'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="tracking-section">
      {history && history.length >= 2 && (
        <div className="tracking-sparkline">
          <Sparkline values={history} />
        </div>
      )}
      <div className="tracking-alert">
        <span className="tracking-alert-label">{t('dashboard.alert.label')}</span>
        <div className="tracking-alert-row">
          <select value={operator} onChange={(e) => setOperator(e.target.value as 'above' | 'below')}>
            <option value="above">{t('dashboard.alert.above')}</option>
            <option value="below">{t('dashboard.alert.below')}</option>
          </select>
          <input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            placeholder={t('dashboard.alert.thresholdPlaceholder')}
          />
          <button type="button" className="btn btn-primary btn-sm" disabled={saving || !threshold} onClick={() => void saveAlert()}>
            {t('dashboard.alert.save')}
          </button>
          {alert && (
            <button type="button" className="btn btn-ghost btn-sm" disabled={saving} onClick={() => void removeAlert()}>
              {t('dashboard.alert.remove')}
            </button>
          )}
        </div>
        {alert && <p className="field-hint">{t('dashboard.alert.active', { operator: t(`dashboard.alert.${alert.operator}`), threshold: alert.threshold })}</p>}
        {error && (
          <p className="field-error-msg" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

function Row({ title, meta, href }: { title: string; meta?: string; href?: string | null }) {
  const { t } = useTranslation();
  return (
    <div className="detail-row">
      <div className="detail-row-text">
        <b>{title}</b>
        {meta && <span>{meta}</span>}
      </div>
      {href && (
        <a href={href} target="_blank" rel="noopener noreferrer" className="link-btn">
          {t('dashboard.card.openLink')}
        </a>
      )}
    </div>
  );
}

/** Contenu complet (non tronqué) d'un widget — ouvert depuis le bouton « Voir plus » de la tuile. */
export function WidgetDetailModal({ open, onClose, uid, widgetId, title, data }: WidgetDetailModalProps) {
  const { t, i18n } = useTranslation();
  const lng = i18n.resolvedLanguage ?? i18n.language ?? 'fr';

  function renderBody() {
    if (data == null) return <p className="detail-empty">{t('dashboard.card.detailEmpty')}</p>;

    switch (widgetId) {
      case 'city_temperature': {
        const d = data as CityTemperature;
        return <Row title={`${d.temperature}°${d.unit}`} meta={d.description} />;
      }
      case 'precipitation_forecast': {
        const days = data as PrecipitationDay[];
        if (!days.length) return <p className="detail-empty">{t('dashboard.card.detailEmpty')}</p>;
        return days.map((d) => <Row key={d.day} title={d.day} meta={`${d.precipitation_mm} mm`} />);
      }
      case 'recent_commits': {
        const commits = data as CommitSummary[];
        if (!commits.length) return <p className="detail-empty">{t('dashboard.summary.noCommit')}</p>;
        return commits.map((c) => (
          <Row key={c.sha} title={c.message} meta={`${c.sha} — ${c.author}`} href={c.url} />
        ));
      }
      case 'security_alerts': {
        const alerts = data as SecurityAlertSummary[];
        if (!alerts.length) return <p className="detail-empty">{t('dashboard.summary.noAlert')}</p>;
        return alerts.map((a) => (
          <Row key={a.number} title={a.summary} meta={`${a.package} · ${a.severity}`} href={a.url} />
        ));
      }
      case 'article_list':
      case 'feed_summary': {
        const items = data as FeedItem[];
        if (!items.length) return <p className="detail-empty">{t('dashboard.summary.noArticle')}</p>;
        return items.map((a) => <Row key={a.link} title={a.title} meta={a.source} href={a.link} />);
      }
      case 'exchange_rate': {
        const d = data as ExchangeRate;
        return <Row title={`${d.base} → ${d.target}`} meta={d.date} />;
      }
      case 'crypto_price': {
        const d = data as CryptoPrice;
        const meta =
          d.change24h == null
            ? undefined
            : `${d.change24h >= 0 ? '+' : ''}${formatNumber(d.change24h, lng, { maximumFractionDigits: 2 })}% (24h)`;
        return (
          <Row title={`${formatNumber(d.price, lng, { maximumFractionDigits: 2 })} ${d.currency.toUpperCase()}`} meta={meta} />
        );
      }
      case 'top_stories':
      case 'story_search': {
        const stories = data as HnStory[];
        if (!stories.length) return <p className="detail-empty">{t('dashboard.summary.noStory')}</p>;
        return stories.map((s) => (
          <Row key={s.objectID} title={s.title} meta={`${s.points} pts — ${s.author}`} href={s.url} />
        ));
      }
      default:
        return <p className="detail-empty">{t('dashboard.card.detailEmpty')}</p>;
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      {open && TRACKABLE_WIDGETS.has(widgetId) && <TrackingSection uid={uid} />}
      <div className="detail-list">{renderBody()}</div>
    </Modal>
  );
}
