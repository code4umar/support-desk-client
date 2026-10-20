'use client';
import { useEffect, useRef, useState } from 'react';

// Counts up from the previous value to the new one (skipped for people who prefer reduced motion).
export default function AnimatedNumber({ value, duration = 700 }: { value: number; duration?: number }) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    const start = from.current;
    const end = value;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;

    if (reduce || start === end) {
      from.current = end;
      raf = requestAnimationFrame(() => setShown(end));
      return () => cancelAnimationFrame(raf);
    }

    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(start + (end - start) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = end;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{shown}</>;
}
