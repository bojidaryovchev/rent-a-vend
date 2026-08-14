import { cn } from "@/lib/cn";

/**
 * The four marks of the rental process: choice, quote, contract, installation.
 *
 * Drawn here rather than shipped as files in `public/`, for the same reason the
 * polarity marks in `bits` are - the shape system is the point. Square caps,
 * miter joins, no curve anywhere, and one safety-yellow signal per mark. An
 * linked asset would freeze the palette; inline, the linework rides `currentColor`
 * and the same four marks work on graphite and on paper.
 *
 * Three tones, and only three:
 *   linework   `currentColor`        the caller sets it - `text-paper` on steel
 *   secondary  the same at 45%       detail that must not compete with the label
 *   signal     `accent`              the one thing the mark is about
 *
 * Decorative: every call site sets the step name in text beside them, so they
 * are hidden rather than labelled. A screen reader that announced "Избор" twice
 * would be reading the decoration.
 */

function Mark({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={cn("h-11 w-11 shrink-0", className)}
    >
      {children}
    </svg>
  );
}

/** Three machines, the middle one held in a hard-cornered selection frame. */
export function ChoiceMark({ className }: { className?: string }) {
  return (
    <Mark className={className}>
      <path d="M6 22H19V50H6V22Z" />
      <path d="M8.5 26H16.5" strokeOpacity={0.45} />
      <path d="M8.5 42H16.5V46H8.5V42Z" strokeOpacity={0.45} />

      <path d="M24 16H40V52H24V16Z" />
      <path d="M27 20H37" strokeOpacity={0.45} />
      <path d="M27 25H37" strokeOpacity={0.45} />
      <path d="M27 43H37V48H27V43Z" strokeOpacity={0.45} />

      <path d="M45 22H58V50H45V22Z" />
      <path d="M47.5 26H55.5" strokeOpacity={0.45} />
      <path d="M47.5 42H55.5V46H47.5V42Z" strokeOpacity={0.45} />

      <path
        d="M20 20V12H28 M36 12H44V20 M44 48V56H36 M28 56H20V48"
        className="stroke-accent"
        strokeWidth={2.75}
      />
    </Mark>
  );
}

/** A quotation sheet, with the bolt carrying the 24-hour answer. */
export function QuoteMark({ className }: { className?: string }) {
  return (
    <Mark className={className}>
      <path d="M13 10H43L51 18V54H13V10Z" />
      <path d="M43 10V18H51" strokeOpacity={0.45} />
      <path d="M19 23H35" />
      <path d="M19 29H43" strokeOpacity={0.45} />
      <path d="M19 35H38" strokeOpacity={0.45} />
      <path d="M19 45H33" strokeOpacity={0.45} />

      <path
        d="M42 30H54L48.5 38H55L43 51L46.5 41H39.5L42 30Z"
        className="fill-accent"
        stroke="none"
      />
    </Mark>
  );
}

/** A signed contract, stamped with a square seal - a seal, not a badge. */
export function ContractMark({ className }: { className?: string }) {
  return (
    <Mark className={className}>
      <path d="M14 9H49V55H14V9Z" />
      <path d="M20 17H42" />
      <path d="M20 23H42" strokeOpacity={0.45} />
      <path d="M20 29H37" strokeOpacity={0.45} />
      <path d="M20 45H40" strokeOpacity={0.45} />
      <path d="M21 42L25 36L28 43L33 38L37 42" />

      <path d="M39 37H54V52H39V37Z" className="fill-accent" stroke="none" />
      <path
        d="M42.5 44.5L45.5 47.5L51 41.5"
        className="stroke-accent-ink"
        strokeWidth={2.4}
      />
    </Mark>
  );
}

/** The machine standing on the floor, cabled to a plug. */
export function InstallMark({ className }: { className?: string }) {
  return (
    <Mark className={className}>
      <path d="M9 11H35V52H9V11Z" />
      <path d="M13 16H31" strokeOpacity={0.45} />
      <path d="M13 21H31" strokeOpacity={0.45} />
      <path d="M13 39H31V46H13V39Z" strokeOpacity={0.45} />
      <path d="M13 52V56 M31 52V56" />
      <path d="M5 56H39" strokeOpacity={0.45} />
      <path d="M35 30H42V39H48" />

      <path d="M47 34H57V44H47V34Z" className="fill-accent" stroke="none" />
      <path d="M50 30V34 M54 30V34" className="stroke-accent" />
      <path d="M50 39H54" className="stroke-accent-ink" />
    </Mark>
  );
}
