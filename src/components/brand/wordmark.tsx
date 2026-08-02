import Image from "next/image";
import { cn } from "@/lib/cn";
import { company } from "@/lib/company";

/**
 * The brand lockup: the mark, with the name and what we do set beside it.
 *
 * The client's logo arrives as a single raster lockup - pictogram over a
 * hairline outlined wordmark. Only the pictogram is used as an image. The
 * wordmark in the file is 810x39 of thin outline: at the ~36px this lockup
 * occupies it renders about two pixels tall and turns to mush, so the name is
 * typeset instead. That also keeps it selectable, searchable and legible at any
 * zoom, and it is the same words either way.
 *
 * Two files, because the mark is dark ink on transparent and the footer sits on
 * steel. `logo-icon-only-light.png` is the same artwork with its neutrals
 * inverted and the accent yellow left alone.
 */
export function Wordmark({
  className,
  tone = "dark",
  priority = false,
}: {
  className?: string;
  tone?: "dark" | "light";
  /** The header lockup is in the first viewport, so it should not lazy-load. */
  priority?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <Image
        src={tone === "dark" ? "/logo-icon-only.png" : "/logo-icon-only-light.png"}
        /* Decorative: the name is right there as text, so announcing the mark
           would only make a screen reader say it twice. */
        alt=""
        width={692}
        height={692}
        /* The lockup is 36px at every breakpoint. Without this, next/image
           assumes the mark could be full-bleed and offers the browser a 1920w
           candidate - 37KB of webp to fill 36 square pixels, twice per page. */
        sizes="36px"
        priority={priority}
        className="h-9 w-auto"
      />

      <span className="leading-none">
        <span
          className={cn(
            "plate block text-[15px]",
            tone === "dark" ? "text-graphite" : "text-paper",
          )}
        >
          {company.brandName}
        </span>
        <span
          className={cn(
            "serial mt-1 block",
            tone === "dark" ? "text-ink-muted" : "text-paper/75",
          )}
        >
          вендинг машини под наем
        </span>
      </span>
    </span>
  );
}
