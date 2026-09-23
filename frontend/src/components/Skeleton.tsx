import type { CSSProperties } from 'react';

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
      <div className="wcard-media" style={{ pointerEvents: 'none' }}>
        <Skeleton style={{ position: 'absolute', inset: 0, borderRadius: 0, height: '100%' }} />
      </div>
      <div className="wcard-meta">
        <Skeleton style={{ width: '55%', height: 16, marginBottom: 8 }} />
        <Skeleton style={{ width: '35%', height: 12 }} />
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
  return (
    <div className="grid-widgets" aria-busy="true" aria-label="Chargement des widgets">
      {Array.from({ length: 6 }, (_, i) => (
        <WidgetSkeleton key={i} />
      ))}
    </div>
  );
}
