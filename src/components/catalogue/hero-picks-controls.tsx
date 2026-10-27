"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";

/**
 * Previous, next and "2 / 5" for the hero's row of recommended machines.
 *
 * The only part of the row that runs in the browser, and deliberately small.
 * The slides are server-rendered and scroll natively - a swipe on a phone, a
 * trackpad on a laptop - so this adds buttons for a mouse and a keyboard and a
 * counter, and is handed nothing but the rail's id and how many slides it
 * holds. Machine data never crosses into the bundle.
 *
 * Which slide leads is read from one IntersectionObserver on the rail rather
 * than from scroll events: it reports only when a slide crosses half or full
 * visibility, so a swipe costs a handful of callbacks instead of one per frame.
 *
 * The server renders this at its final size with the first slide leading, so
 * hydrating it changes text and colour and never geometry. It renders it
 * hidden, too - in place, so the space is kept - and shows it once the script
 * is running. Without the script the buttons would do nothing, and a visitor
 * with none should see a row that scrolls, not two dead controls.
 */

/** False on the server and through hydration, true once mounted - without a
 *  state update inside an effect. */
const useMounted = () =>
  useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

/** A slide this visible is the one the counter names. */
const LEADING = 0.5;
/** A slide this visible counts as fully in view - the rail is at that end.
 *  Short of 1 because subpixel layout can leave a whole slide at 0.999. */
const WHOLE = 0.98;
/** Long enough to outlast a smooth glide of one or two slides, so a second
 *  press during it is counted from where the first was headed. */
const GLIDE_MS = 700;

/** Where the rail stands with each slide at its start, clamped to how far
 *  the rail can actually scroll. */
function stopsOf(rail: HTMLElement): number[] {
  const slides = Array.from(rail.children) as HTMLElement[];
  const origin = slides[0]?.offsetLeft ?? 0;
  const end = rail.scrollWidth - rail.clientWidth;
  return slides.map((slide) => Math.min(slide.offsetLeft - origin, end));
}

/** Glide unless the visitor has asked the system for less motion. The CSS
 *  rule for that cannot reach a `behavior` passed from script. */
const glide = (): ScrollBehavior =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";

export function HeroPicksControls({
  railId,
  count,
}: {
  railId: string;
  count: number;
}) {
  const [lead, setLead] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const aim = useRef<{ left: number; at: number } | null>(null);
  const mounted = useMounted();

  useEffect(() => {
    const rail = document.getElementById(railId);
    if (!rail) return;

    const slides = Array.from(rail.children);
    const visible = slides.map(() => 0);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visible[slides.indexOf(entry.target)] = entry.intersectionRatio;
        }
        const leading = visible.findIndex((ratio) => ratio >= LEADING);
        if (leading !== -1) setLead(leading);
        setAtStart(visible[0] >= WHOLE);
        setAtEnd(visible[visible.length - 1] >= WHOLE);
      },
      { root: rail, threshold: [0, LEADING, WHOLE] },
    );

    for (const slide of slides) observer.observe(slide);

    /* Tabbing onto a card brings that card to the front. The browser scrolls
       a focused element into view only when it is out of view, and a card in
       the peek counts as in view - so focus landed on a card the visitor could
       see a sliver of, with the counter still naming the one before it. This
       moves the rail, not the page, and the counter with it. */
    const onFocus = (event: FocusEvent) => {
      const index = slides.findIndex((slide) =>
        slide.contains(event.target as Node),
      );
      if (index === -1) return;
      const stop = stopsOf(rail)[index];
      setLead(index);
      if (Math.abs(rail.scrollLeft - stop) < 2) return;
      aim.current = { left: stop, at: performance.now() };
      rail.scrollTo({ left: stop, behavior: glide() });
    };
    rail.addEventListener("focusin", onFocus);

    return () => {
      observer.disconnect();
      rail.removeEventListener("focusin", onFocus);
    };
  }, [railId]);

  /* Scrolls the rail, never the page: `scrollIntoView` would also pull the
     window to the hero, which is a jump nobody asked for when the button is
     already on screen.

     The step is counted from where the rail is, not from `lead`, so a swipe
     between two presses is respected. The exception is a press during a
     glide: mid-glide the rail has not reached the last stop yet, and counting
     from it would aim at that same stop again, so a quick double press would
     move one slide. For a moment after each press the count runs from where
     that press was headed instead. */
  function step(direction: 1 | -1) {
    if (direction === 1 ? atEnd : atStart) return;

    const rail = document.getElementById(railId);
    if (!rail) return;

    const stops = stopsOf(rail);
    const pending =
      aim.current && performance.now() - aim.current.at < GLIDE_MS
        ? aim.current.left
        : null;
    const here = pending ?? rail.scrollLeft;

    const target =
      direction === 1
        ? stops.find((stop) => stop > here + 1)
        : [...stops].reverse().find((stop) => stop < here - 1);
    if (target === undefined) return;

    aim.current = { left: target, at: performance.now() };
    rail.scrollTo({ left: target, behavior: glide() });
  }

  return (
    <div className={cn("flex items-center gap-1", !mounted && "invisible")}>
      <StepButton
        label="Предишна машина"
        disabled={atStart}
        railId={railId}
        onClick={() => step(-1)}
      >
        <path d="M9.5 3 L4.5 8 L9.5 13" />
      </StepButton>

      {/* Nothing here moves when "1 / 5" becomes "2 / 5", or when the mono
          face lands after first paint and the glyphs change width: the box is
          fixed in pixels rather than `ch`, which follows the font, and the
          text is one node anchored at its left edge, padded to sit centred in
          the face itself. The slash is for the eye; a screen reader hears
          "2 от 5". */}
      <p
        aria-live="polite"
        aria-atomic="true"
        className="serial tabular w-12 pl-1.5 text-paper/80"
      >
        <span aria-hidden>{`${lead + 1} / ${count}`}</span>
        {/* Not upper case like the digits beside it: "ОТ" in capitals is
            read out letter by letter. */}
        <span className="sr-only normal-case">{`${lead + 1} от ${count}`}</span>
      </p>

      <StepButton
        label="Следваща машина"
        disabled={atEnd}
        railId={railId}
        onClick={() => step(1)}
      >
        <path d="M6.5 3 L11.5 8 L6.5 13" />
      </StepButton>
    </div>
  );
}

/**
 * A square control on steel, in the hero's outline register rather than its
 * accent: the hero already carries the one yellow action (DESIGN.md, The One
 * Action Rule), and a pair of yellow arrows beside it would be a second and a
 * third.
 *
 * At an end the button stays in place and in the tab order, marked
 * `aria-disabled` rather than `disabled` so a keyboard user's focus is not
 * dropped from under them. That state swaps tokens rather than fading - a
 * sunken fill and the hairline tone for the arrow, 4.8:1 on that fill - because
 * opacity is how this system once produced 1.3:1 (DESIGN.md).
 *
 * The focus ring is paper and drawn inside the edge (`focus-light`,
 * `focus-inset` in globals.css): ink is invisible on steel, and the shutter
 * reveal on the row clips anything drawn outside its box.
 */
function StepButton({
  label,
  disabled,
  railId,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  railId: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-controls={railId}
      aria-disabled={disabled}
      className={cn(
        "focus-light focus-inset inline-flex min-h-11 min-w-11 items-center justify-center border transition-colors duration-200",
        disabled
          ? "cursor-not-allowed border-graphite-edge bg-graphite-deep text-line-strong"
          : "border-paper/35 text-paper hover-fine:border-paper",
      )}
    >
      {/* Drawn rather than taken from Lucide, for the reason given in
          ui/bits.tsx: square ends, never round ones. */}
      <svg
        viewBox="0 0 16 16"
        aria-hidden
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="square"
        strokeLinejoin="miter"
      >
        {children}
      </svg>
      <span className="sr-only">{label}</span>
    </button>
  );
}
