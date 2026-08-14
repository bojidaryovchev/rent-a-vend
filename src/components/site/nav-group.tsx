"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * A grouped header link with a dropdown.
 *
 * WHY THIS EXISTS. The bar carried eight top-level links beside a language
 * switcher, a phone number and an accent CTA, and `navLink` sets no
 * `whitespace-nowrap` - so instead of overflowing, the labels wrapped. Measured
 * at 1440px: three or four labels on two lines in Finnish, Portuguese and
 * Bulgarian, with only 43px of slack left in five locales. At 1024px, where the
 * bar first appears, Portuguese put "Sistemas de pagamento" on three lines.
 * German and English were clean, which is why it looked fine.
 *
 * ⚠ THE PANEL IS ALWAYS IN THE DOM, and this is the load-bearing decision
 * rather than a detail. `LanguageSwitcher` mounts its menu only when open and
 * its own comment accepts the cost - "invisible to a crawler and unusable with
 * JavaScript off" - because the `hreflang` set in `<head>` carries the language
 * relationships regardless. There is no equivalent backstop for the category
 * and price pages: they are the ranking targets. So this panel is rendered on
 * every page and hidden with CSS, which costs nothing and keeps every link in
 * the markup.
 *
 * CLICK, NOT HOVER. Hover menus cannot be opened on a touch screen without a
 * fake first tap, and they open by accident when the pointer crosses them on
 * the way to the CTA. Click also matches the switcher already in the strip, so
 * the two controls in this header behave the same way.
 */

export interface NavGroupItem {
  href: string;
  label: string;
  active?: boolean;
  /** Draws a hairline above this item - "related, but not one of the above". */
  separated?: boolean;
}

export function NavGroup({
  label,
  items,
  className,
}: {
  label: string;
  items: NavGroupItem[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const anyActive = items.some((i) => i.active);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        /* Focus goes back to the trigger, or the reader is left in the page
           with no idea where they are. */
        root.current?.querySelector("button")?.focus();
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  /** Up and down move between the links once the panel is open. */
  const onPanelKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const links = [...(root.current?.querySelectorAll("a") ?? [])];
    const at = links.indexOf(document.activeElement as HTMLAnchorElement);
    const next =
      event.key === "ArrowDown"
        ? links[(at + 1) % links.length]
        : links[(at - 1 + links.length) % links.length];
    next?.focus();
  };

  return (
    <div ref={root} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            requestAnimationFrame(() =>
              root.current?.querySelector("a")?.focus(),
            );
          }
        }}
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          "plate flex items-center gap-1.5 px-2.5 py-2 text-[11px] whitespace-nowrap",
          "transition-colors duration-200 hover-fine:text-graphite",
          anyActive ? "text-graphite" : "text-ink-muted",
        )}
      >
        {label}
        <ChevronDown
          aria-hidden
          className={cn(
            "h-3 w-3 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Rendered always, hidden with CSS. See the note above. */}
      <div
        id={panelId}
        onKeyDown={onPanelKeyDown}
        className={cn(
          "absolute left-0 z-50 mt-1 grid w-max min-w-full gap-px border border-line-strong bg-line-strong shadow-lg",
          open ? "grid" : "hidden",
        )}
      >
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            onClick={() => setOpen(false)}
            className={cn(
              "flex min-h-9 items-center bg-paper-raised px-3 py-2 text-ui whitespace-nowrap transition-colors",
              item.active
                ? "text-ink"
                : "text-ink-muted hover-fine:bg-paper-sunken hover-fine:text-ink",
              /* The hairline sits inside the cell so the 1px grid gap does not
                 double it. */
              item.separated && "border-t border-line-strong",
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
