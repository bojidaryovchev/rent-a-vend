import { cn } from "@/lib/cn";
import { Container } from "@/components/ui/container";

/**
 * The shared vocabulary every page is built from.
 *
 * Keeping these in one file is what makes the system hold: a section head, an
 * eyebrow and a field look the same on eleven routes because there is only one
 * of each.
 */

/**
 * Polarity marks.
 *
 * Where a list or a table has two opposite sides - covered by the rent, carried
 * by you - the mark carries the polarity so the reader does not have to hold
 * the heading in mind while scrolling. A plain bullet cannot do that, and the
 * two "what's included / what's yours" panels stack on mobile, where the pairing
 * is exactly what gets lost.
 *
 * Drawn rather than imported. Lucide defaults to `strokeLinecap: round` and
 * `strokeLinejoin: round`, and rounded is the one thing the shape system
 * forbids; overriding it at every call site is discipline that erodes. Both
 * marks share a 10x10 box so they align identically wherever they alternate.
 *
 * They take `currentColor`, and the caller sets the tone: accent on graphite,
 * where safety yellow is legible and sanctioned, and graphite on paper, where
 * a yellow stroke would be both illegible and against the rule that the accent
 * is never used for text on paper. A solid 6px yellow square survives that
 * ground; a 2px yellow stroke does not.
 */
export function IncludedMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 10 10"
      aria-hidden
      className={cn("h-2.5 w-2.5 shrink-0", className)}
    >
      <path
        d="M1.2 5 L3.9 7.7 L8.8 2"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

export function ExcludedMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 10 10"
      aria-hidden
      className={cn("h-2.5 w-2.5 shrink-0", className)}
    >
      <path
        d="M1 5 L9 5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="butt"
      />
    </svg>
  );
}

/** A tracked stencil label with a leading rule. Opens a section or a panel. */
export function Eyebrow({
  children,
  tone = "dark",
}: {
  children: React.ReactNode;
  tone?: "dark" | "light";
}) {
  return (
    <span
      className={cn(
        "stencil inline-flex items-center gap-2 text-[11px]",
        tone === "dark" ? "text-ink-muted" : "text-accent",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "h-px w-6",
          tone === "dark" ? "bg-line-strong" : "bg-accent/60",
        )}
      />
      {children}
    </span>
  );
}

/**
 * Section head with an optional serial index.
 *
 * The index is set in mono and reads as an asset tag rather than a decorative
 * number - the same register as the stock references on the machines.
 */
export function SectionHead({
  index,
  title,
  lead,
  tone = "dark",
}: {
  index?: string;
  title: string;
  lead?: string;
  tone?: "dark" | "light";
}) {
  return (
    <div className="max-w-2xl">
      <div className="flex items-baseline gap-3">
        {index && (
          <span
            aria-hidden
            className={cn(
              "serial",
              tone === "dark" ? "text-line-strong" : "text-paper/70",
            )}
          >
            {index}
          </span>
        )}
        <h2
          className={cn(
            "text-[26px] leading-tight md:text-[34px]",
            tone === "dark" ? "engraved" : "text-paper",
          )}
        >
          {title}
        </h2>
      </div>
      {lead && (
        <p
          className={cn(
            "mt-3 text-[15px] leading-7",
            tone === "dark" ? "text-ink-muted" : "text-paper/70",
          )}
        >
          {lead}
        </p>
      )}
    </div>
  );
}

/** Every page opens on the same steel band. */
export function PageHead({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="steel border-b border-graphite-edge">
      <Container className="py-12 md:py-16">
        <Eyebrow tone="light">{eyebrow}</Eyebrow>
        <h1 className="mt-4 max-w-3xl text-[32px] leading-[1.08] text-paper md:text-[48px]">
          {title}
        </h1>
        {lead && (
          <p className="mt-5 max-w-2xl text-[15px] leading-7 text-paper/70">
            {lead}
          </p>
        )}
        {children}
      </Container>
    </section>
  );
}

/** Label above, bordered well below, optional unit suffix inside the well. */
export function Field({
  label,
  hint,
  suffix,
  error,
  children,
}: {
  label: string;
  hint?: string;
  suffix?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="plate block text-[11px] text-ink-muted">{label}</span>
      <span
        className={cn(
          "mt-1.5 flex items-center border bg-paper-raised",
          error ? "border-danger" : "border-line-strong focus-within:border-graphite",
        )}
      >
        {children}
        {suffix && <span className="serial pr-3 text-ink-muted">{suffix}</span>}
      </span>
      {hint && (
        <span className="mt-1.5 block text-[12px] leading-5 text-ink-muted">
          {hint}
        </span>
      )}
      {error && (
        <span className="mt-1.5 block text-[12px] leading-5 font-medium text-danger">
          {error}
        </span>
      )}
    </label>
  );
}

export const inputCls =
  "tabular min-h-11 w-full bg-transparent px-3 text-[15px] text-ink outline-none placeholder:text-line-strong";
