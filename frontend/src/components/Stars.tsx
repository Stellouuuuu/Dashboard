import { useMemo } from 'react';

export function Stars() {
  const stars = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        left: `${(i * 37 + 13) % 100}%`,
        top: `${(i * 53 + 7) % 100}%`,
        delay: `${((i * 0.17) % 4).toFixed(2)}s`,
      })),
    [],
  );

  return (
    <div className="stars" aria-hidden="true">
      {stars.map((s) => (
        <span
          key={s.id}
          style={{ left: s.left, top: s.top, animationDelay: s.delay }}
        />
      ))}
    </div>
  );
}
