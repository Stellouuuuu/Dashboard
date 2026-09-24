import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';

export function Skeleton({
  className = '',
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return <div className={`skeleton ${className}`} style={style} aria-hidden="true" />;
}

export function WidgetSkeleton() {
  return (
    <div className="wcard skeleton-card" aria-hidden="true">
      <div className="wcard-head">
        <Skeleton style={{ width: 30, height: 30, borderRadius: 9 }} />
        <div className="wcard-titles">
          <Skeleton style={{ width: '55%', height: 12, marginBottom: 6 }} />
          <Skeleton style={{ width: '35%', height: 10 }} />
        </div>
      </div>
      <div className="wcard-body">
        <Skeleton style={{ width: '40%', height: 28, marginBottom: 10 }} />
        <Skeleton style={{ width: '75%', height: 12 }} />
      </div>
      <div className="wcard-foot">
        <Skeleton style={{ width: 80, height: 10 }} />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  const { t } = useTranslation();
  return (
    <div className="grid-widgets" aria-busy="true" aria-label={t('skeleton.loadingWidgets')}>
      {Array.from({ length: 6 }, (_, i) => (
        <WidgetSkeleton key={i} />
      ))}
    </div>
  );
}
