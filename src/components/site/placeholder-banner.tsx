import {
  blockingPlaceholders,
  shouldShowPlaceholderBanner,
} from "@/lib/placeholders";

/**
 * Makes placeholder data impossible to mistake for real data.
 *
 * The rental rates are derived rather than flat, which makes them look more
 * plausible, not less - which is exactly why this has to be loud. It rides
 * along with every screenshot, preview link and client review until the real
 * figures land.
 *
 * Hazard striping because it is honest signage: it says "work in progress" in
 * a language everyone already reads. The stripe shows only at the edges; the
 * message sits on near-solid graphite so it is never read against a pattern.
 */
export function PlaceholderBanner() {
  if (!shouldShowPlaceholderBanner()) return null;

  const pending = blockingPlaceholders();

  return (
    <div className="caution-tape border-b border-graphite-edge" role="status">
      <div className="bg-graphite/95">
        <div className="mx-auto flex max-w-310 flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 md:px-6">
          <span className="stencil bg-accent px-2 py-0.75 text-[11px] leading-4 text-graphite">
            Демо версия
          </span>
          <span className="text-[12px] leading-4 text-paper">
            Цените и снимките са примерни.
          </span>
          <span className="hidden text-[12px] leading-4 text-paper/75 sm:inline">
            Липсват: {pending.map((p) => p.label.toLowerCase()).join(", ")}.
          </span>
        </div>
      </div>
    </div>
  );
}
