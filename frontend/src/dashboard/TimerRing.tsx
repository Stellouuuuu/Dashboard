import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface TimerRingProps {
  seconds: number;
  onCycle: () => void;
  paused?: boolean;
}

export function TimerRing({ seconds, onCycle, paused }: TimerRingProps) {
  const reduced = useReducedMotion();
  const fgRef = useRef<SVGCircleElement>(null);
  const onCycleRef = useRef(onCycle);

  useEffect(() => {
    onCycleRef.current = onCycle;
  }, [onCycle]);

  useEffect(() => {
    if (paused) return;

    if (reduced) {
      const id = window.setInterval(() => onCycleRef.current(), seconds * 1000);
      return () => window.clearInterval(id);
    }

    const el = fgRef.current;
    if (!el) return;
    const handler = () => onCycleRef.current();
    el.addEventListener('animationiteration', handler);
    return () => el.removeEventListener('animationiteration', handler);
  }, [seconds, reduced, paused]);

  return (
    <div className="timer-ring-wrap" title={`Rafraîchissement toutes les ${seconds}s`}>
      <svg className="timer-ring" viewBox="0 0 22 22" aria-hidden="true">
        <circle className="bg" cx="11" cy="11" r="9" />
        <circle
          ref={fgRef}
          className="fg"
          cx="11"
          cy="11"
          r="9"
          style={{
            animation: reduced ? 'none' : `ringFill ${seconds}s linear infinite`,
          }}
        />
      </svg>
      <span className="timer-label">{seconds}</span>
    </div>
  );
}
