import { cn } from "@/lib/cn";
import { STATUS_LABEL, STATUS_TONE, type UnitStatus } from "@/content/taxonomy";

type Tone = "available" | "reserved" | "unavailable";

/**
 * Stock state, encoded by shape as well as colour.
 *
 * Available is a square, reserved is the same square rotated to a diamond,
 * unavailable is a muted square. Anyone who cannot separate the two hues still
 * reads the state, which is the whole reason not to lean on colour alone.
 */
export function StockDot({ tone }: { tone: Tone }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block h-2 w-2 shrink-0",
        tone === "available" && "bg-status-available",
        tone === "reserved" && "rotate-45 bg-status-reserved",
        tone === "unavailable" && "bg-status-unavailable",
      )}
    />
  );
}

const toneText: Record<Tone, string> = {
  available: "text-status-available",
  reserved: "text-status-reserved",
  unavailable: "text-status-unavailable",
};

/** Free-text stock line, e.g. "2 налични от общо 5". */
export function StockLabel({
  tone,
  children,
  className,
}: {
  tone: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[12px] font-medium",
        toneText[tone],
        className,
      )}
    >
      <StockDot tone={tone} />
      {children}
    </span>
  );
}

/** A single unit's status. */
export function StatusBadge({
  status,
  className,
}: {
  status: UnitStatus;
  className?: string;
}) {
  return (
    <StockLabel tone={STATUS_TONE[status]} className={className}>
      {STATUS_LABEL[status]}
    </StockLabel>
  );
}
