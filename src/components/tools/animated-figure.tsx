"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The site's one authored moment.
 *
 * A Persuade surface is granted exactly one focal sequence of 500-800ms, and
 * `--duration-focal` was reserved for it. This is where it belongs: the monthly
 * figure stepping down as the visitor lengthens the contract. That number is the
 * entire thesis of the page, and it is the only place anyone watches a price
 * move.
 *
 * Everything else on the site stays under 300ms.
 *
 * Honours `prefers-reduced-motion` by snapping to the target value: motion here
 * is emphasis, never information, so removing it costs nothing.
 */

const DURATION_MS = 640;

/** cubic-bezier(0.16, 1, 0.3, 1) — the project's single easing token. */
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function AnimatedFigure({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const [shown, setShown] = useState(value);
  const fromRef = useRef(value);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    if (from === value) return;

    // Reduced motion collapses the duration rather than branching to an
    // immediate setState: the first frame then lands on the target, so the
    // value is never written synchronously during the effect.
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : DURATION_MS;

    const start = performance.now();

    const tick = (now: number) => {
      const t = duration === 0 ? 1 : Math.min(1, (now - start) / duration);
      setShown(Math.round(from + (value - from) * easeOut(t)));
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      fromRef.current = value;
    };
  }, [value]);

  return (
    // aria-live is deliberately absent: the figure is announced by the button
    // the visitor just pressed, and narrating every intermediate frame would be
    // hostile to a screen reader.
    <span className={className} aria-label={`${value} евро`}>
      <span aria-hidden>{shown}</span>
    </span>
  );
}
