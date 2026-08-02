import Link from "next/link";
import Image from "next/image";
import { StockLabel } from "@/components/catalogue/status-badge";
import type { MachineShape } from "@/components/ui/machine-image";
import { routes, type CategoryKey } from "@/lib/routes";
import type { Category, VenueGroup } from "@/content/taxonomy";

/**
 * A catalogue card.
 *
 * Carries the two things no Bulgarian competitor publishes: a price and live
 * availability. Everything else is secondary.
 *
 * Built as a panel: a lit top edge, a seated shadow, corner rivets on the body,
 * and the manufacturer stamped on the image like an asset tag. The price is set
 * in the display face at 30px, because it is the reason the card exists.
 *
 * Presentational and serialisable, so the grid can filter on the client without
 * dragging the catalogue modules into the browser bundle.
 */

export interface CardData {
  id: string;
  slug: string;
  category: Category;
  name: string;
  manufacturer: string;
  currentName: string | null;
  capacity: number | null;
  fromEur: number;
  availabilityLabel: string;
  canRent: boolean;
  venueGroups: VenueGroup[];
  shape: MachineShape;
  /**
   * The frames the card shows. Empty until the model is photographed, and the
   * card draws the silhouette instead.
   *
   * A combination machine carries two - one per constituent - because a pair
   * card showing a single cabinet reads as the wrong product.
   */
  photos: { src: string; alt: string }[];
}

/** Compact machine silhouette, sized to the card's image band. */
function MiniMachine({
  category,
  shape,
}: {
  category: Category;
  shape: MachineShape;
}) {
  const wide = category === "combo";
  const isCoffee = category === "coffee";

  // Real proportions, so a squat Snakky does not draw like a coffee tower.
  // A combo's width is the SUM of its two cabinets, so each panel gets half of
  // it - otherwise both draw at full combo width and overrun the band.
  const cabinetWidthMm =
    shape.widthMm !== null && wide ? shape.widthMm / 2 : shape.widthMm;
  const ratio =
    cabinetWidthMm && shape.heightMm
      ? Math.min(0.95, Math.max(0.22, cabinetWidthMm / shape.heightMm))
      : 0.34;
  const w = Math.round(158 * ratio);

  return (
    <svg
      viewBox="0 0 200 176"
      className="absolute inset-0 h-full w-full"
      aria-hidden
      preserveAspectRatio="xMidYMax meet"
    >
      <g transform={`translate(${wide ? 100 - w - 3 : 100 - w / 2},18)`}>
        {(wide ? [0, w + 6] : [0]).map((x) => (
          <g key={x} transform={`translate(${x},0)`}>
            {/* Drawn rather than filled. A solid dark block sitting in a grid of
                real photographs reads as a failed image; an outline reads as
                what it is - a machine we have not shot yet. */}
            <rect
              x="0.5"
              y="0.5"
              width={w - 1}
              height="157"
              fill="var(--color-paper-raised)"
              stroke="var(--color-line-strong)"
              strokeWidth="1"
            />
            <rect
              x="5"
              y="8"
              width={Math.max(10, w * 0.55)}
              height={isCoffee ? 62 : 104}
              fill="none"
              stroke="var(--color-line-strong)"
              strokeWidth="0.75"
            />
            {/* Shelves, so a snack cabinet does not draw like a coffee tower. */}
            {!isCoffee &&
              Array.from({ length: 4 }, (_, i) => (
                <line
                  key={i}
                  x1="5"
                  x2={5 + Math.max(10, w * 0.55)}
                  y1={8 + ((i + 1) * 104) / 5}
                  y2={8 + ((i + 1) * 104) / 5}
                  stroke="var(--color-line)"
                  strokeWidth="0.75"
                />
              ))}
            {isCoffee && (
              <rect
                x={5}
                y={78}
                width={Math.max(10, w * 0.55)}
                height="22"
                fill="none"
                stroke="var(--color-line)"
                strokeWidth="0.75"
              />
            )}
            <rect
              x={w - 11}
              y="8"
              width="7"
              height="18"
              fill="none"
              stroke="var(--color-line-strong)"
              strokeWidth="0.75"
            />
            <circle cx={w - 7.5} cy="40" r="1.75" fill="var(--color-accent)" />
            <line
              x1="0"
              x2={w}
              y1="148"
              y2="148"
              stroke="var(--color-line-strong)"
              strokeWidth="1"
            />
          </g>
        ))}
      </g>
    </svg>
  );
}

export function ModelCard({
  data,
  headingLevel = 3,
}: {
  data: CardData;
  /** Cards sit directly under the page h1 on listings, and under an h2 on
   *  model pages. Passing the level avoids a skipped heading either way. */
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <Link
      href={routes.model(data.category as CategoryKey, data.slug)}
      className="bay-panel hover-lift group flex flex-col"
    >
      <div className="relative h-44 overflow-hidden border-b border-line bg-paper-sunken">
        <div className="paper-grain absolute inset-0" />
        {data.photos.length > 0 ? (
          /* Bottom-aligned and equal-height: a pair is installed side by side
             with its tops in line, the shorter cabinet on a stand. */
          <div className="absolute inset-0 flex items-end justify-center gap-1 p-3">
            {data.photos.map((photo) => (
              <div key={photo.src} className="relative h-full min-w-0 flex-1">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(min-width: 1280px) 13vw, (min-width: 1024px) 17vw, (min-width: 640px) 25vw, 50vw"
                  className="object-contain object-bottom"
                />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Measuring rule across the bed: with no photograph the register is
                a drawing, and the rule says so. */}
            <div
              aria-hidden
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, var(--color-line) 0 1px, transparent 1px 26px)",
              }}
            />
            <MiniMachine category={data.category} shape={data.shape} />
          </>
        )}
        <span className="serial absolute top-0 left-0 bg-graphite px-2 py-1 text-paper/80">
          {data.manufacturer}
        </span>
      </div>

      <div className="riveted flex flex-1 flex-col p-4">
        <Heading className="plate text-[13px] leading-5 text-graphite">
          {data.name}
        </Heading>

        {data.currentName && (
          <p className="mt-1 text-[12px] text-ink-muted">
            днес се предлага като {data.currentName}
          </p>
        )}

        <dl className="mt-3 flex items-end justify-between gap-3">
          <div>
            <dt className="serial text-ink-muted">от</dt>
            <dd className="tabular font-display text-[30px] leading-none text-graphite">
              {data.fromEur}&nbsp;€
              <span className="ml-1 font-sans text-[12px] font-normal text-ink-muted">
                /месец
              </span>
            </dd>
          </div>
          {data.capacity !== null && (
            <div className="text-right">
              <dt className="serial text-ink-muted">капацитет</dt>
              <dd className="tabular text-[13px] text-graphite">
                {data.capacity} продукта
              </dd>
            </div>
          )}
        </dl>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3">
          <StockLabel tone={data.canRent ? "available" : "unavailable"}>
            {data.availabilityLabel}
          </StockLabel>
          <span className="serial text-line-strong transition-colors duration-200 group-hover:text-graphite">
            детайли →
          </span>
        </div>
      </div>
    </Link>
  );
}
