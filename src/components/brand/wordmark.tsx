import { cn } from "@/lib/cn";

/**
 * PLACEHOLDER MARK.
 *
 * The brand name is deliberately parked (see PRODUCT.md, Brand Commitments) and
 * the site is built to swap this out at the end. The structure is real - a
 * stamped plate carrying an initial, with the wordmark set beside it - so
 * replacing it is a one-file change rather than a redesign.
 *
 * The sub-label says "временно име" in the same mono register as a stock
 * reference: it is a note on the object, not a tagline.
 *
 * Registered as the `brand-name` placeholder.
 */
export function Wordmark({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <span className={cn("inline-flex items-end gap-2.5 select-none", className)}>
      <span
        aria-hidden
        className={cn(
          "relative grid h-9 w-9 place-items-center border",
          tone === "dark"
            ? "border-graphite bg-graphite text-accent"
            : "border-paper/30 bg-accent text-graphite",
        )}
      >
        <span className="plate text-[15px] leading-none">В</span>
        <span className="absolute inset-x-1 bottom-0.75 h-0.5 bg-accent/70" />
      </span>

      <span className="leading-none">
        <span
          className={cn(
            "plate block text-[15px]",
            tone === "dark" ? "text-graphite" : "text-paper",
          )}
        >
          Вендинг под наем
        </span>
        <span
          className={cn(
            "serial mt-1 block",
            tone === "dark" ? "text-ink-muted" : "text-paper/75",
          )}
        >
          временно име
        </span>
      </span>
    </span>
  );
}
