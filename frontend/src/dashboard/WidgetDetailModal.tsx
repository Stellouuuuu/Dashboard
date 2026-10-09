import { useTranslation } from 'react-i18next';
import { Modal } from '../components/Modal';
import { formatNumber } from '../i18n/format';
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
  widgetId: string;
  title: string;
  data: unknown;
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
export function WidgetDetailModal({ open, onClose, widgetId, title, data }: WidgetDetailModalProps) {
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
      <div className="detail-list">{renderBody()}</div>
    </Modal>
  );
}
