import { useEffect, useState } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { IconGithub, IconRss, IconSun } from '../components/Icons';

export function PortalStage() {
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(reduced);

  useEffect(() => {
    if (reduced) {
      setReady(true);
      return;
    }
    // trigger orchestrated entrance on mount
    const t = window.setTimeout(() => setReady(true), 20);
    return () => window.clearTimeout(t);
  }, [reduced]);

  const ringClass = (n: 1 | 2 | 3) =>
    `portal-ring pr-${n}${ready ? (reduced ? ' ready' : ` anim-${n}`) : ''}`;

  return (
    <div className="portal-stage" aria-hidden="true">
      <div className={`portal-core${ready ? (reduced ? ' ready' : ' anim') : ''}`} />
      <div className={ringClass(1)} />
      <div className={ringClass(2)} />
      <div className={ringClass(3)} />
      <div className="orbit orbit-1">
        <i>
          <IconSun />
        </i>
      </div>
      <div className="orbit orbit-2">
        <i>
          <IconGithub />
        </i>
      </div>
      <div className="orbit orbit-3">
        <i>
          <IconRss />
        </i>
      </div>
    </div>
  );
}
