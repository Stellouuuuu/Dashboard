import { useEffect, useState } from 'react';

const DEFAULT_INTERVAL_MS = 4500;

type ImageFadeProps = {
  images: readonly string[];
  className?: string;
  /** Durée d’affichage de chaque image (ms). */
  intervalMs?: number;
  /** Priorité de chargement pour la première image. */
  fetchPriority?: 'high' | 'low' | 'auto';
};

/**
 * Diaporama en fondu croisé : les images s’enchaînent une à une.
 * Respecte `prefers-reduced-motion` (image fixe).
 */
export function ImageFade({
  images,
  className,
  intervalMs = DEFAULT_INTERVAL_MS,
  fetchPriority = 'auto',
}: ImageFadeProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduced.matches) return;

    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [images, intervalMs]);

  if (!images.length) return null;

  return (
    <div className={`img-fade${className ? ` ${className}` : ''}`} aria-hidden="true">
      {images.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          className={i === index ? 'is-active' : undefined}
          {...(i === 0
            ? { fetchPriority }
            : { loading: 'lazy' as const })}
        />
      ))}
    </div>
  );
}
