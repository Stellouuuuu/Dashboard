/** Mini-courbe SVG inline — historique d'un widget à valeur numérique (bonus). */
export function Sparkline({ values, width = 260, height = 56 }: { values: number[]; width?: number; height?: number }) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = 4;
  const step = (width - pad * 2) / (values.length - 1);

  const points = values.map((v, i) => {
    const x = pad + i * step;
    const y = pad + (1 - (v - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });

  const path = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const [lastX, lastY] = points[points.length - 1];
  const up = values[values.length - 1] >= values[0];

  return (
    <svg
      className="sparkline"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label={`${min}–${max}`}
    >
      <path d={path} fill="none" stroke={up ? 'var(--green)' : 'var(--red)'} strokeWidth={2} />
      <circle cx={lastX} cy={lastY} r={2.5} fill={up ? 'var(--green)' : 'var(--red)'} />
    </svg>
  );
}
