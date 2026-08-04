import Link from "next/link";
import Image from "next/image";
import type { MachineShape } from "@/components/ui/machine-image";
import { routes, type CategoryKey } from "@/lib/routes";
import type { Category, VenueGroup } from "@/content/taxonomy";

/**
 * A catalogue card.
 *
 * Carries the thing no Bulgarian competitor publishes: a price. The card used
 * to carry a live stock line beside it; since D50 there is one availability
 * state for the whole catalogue, and repeating it on 62 identical cards would
 * be noise rather than information. It is stated once, on the model page.
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
  venueGroups: VenueGroup[];
  shape: MachineShape;
  /**
   * The frame the card shows. Empty until the model is photographed, and the
   * card draws the silhouette instead. A list rather than a single value
   * because the gallery and the card read from the same photo set.
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
  const isCombo = category === "combo";
  const isCoffee = category === "coffee";

  // Real proportions, so a squat Snakky does not draw like a coffee tower. A
  // combo's width is the assembled cabinet's own, not a sum: it is one machine.
  const ratio =
    shape.widthMm && shape.heightMm
      ? Math.min(0.95, Math.max(0.22, shape.widthMm / shape.heightMm))
      : 0.34;
  const w = Math.round(158 * ratio);

  /* A combo is a coffee machine standing on a snack cabinet, so it draws as
     one outline split in two: the brew head and cup station up top, shelves
     below. The split sits at the real join - the base is 1080mm of a ~1830mm
     machine - rather than at the middle. */
  const splitY = isCombo ? 8 + Math.round(140 * (1 - 1080 / 1830)) : 0;
  const windowW = Math.max(10, w * 0.55);

  return (
    <svg
      viewBox="0 0 200 176"
      className="absolute inset-0 h-full w-full"
      aria-hidden
      preserveAspectRatio="xMidYMax meet"
    >
      <g transform={`translate(${100 - w / 2},18)`}>
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

        {isCombo ? (
          <>
            {/* Coffee half: brew window and cup station. */}
            <rect
              x="5"
              y="8"
              width={windowW}
              height={splitY - 16}
              fill="none"
              stroke="var(--color-line-strong)"
              strokeWidth="0.75"
            />
            {/* The join between the two cabinets, full width - the one line
                that says this is a stack and not a single tall box. */}
            <line
              x1="0"
              x2={w}
              y1={splitY}
              y2={splitY}
              stroke="var(--color-line-strong)"
              strokeWidth="1"
            />
            {/* Snack half: glass front with shelves. */}
            <rect
              x="5"
              y={splitY + 6}
              width={w - 10}
              height={140 - splitY}
              fill="none"
              stroke="var(--color-line-strong)"
              strokeWidth="0.75"
            />
            {Array.from({ length: 3 }, (_, i) => (
              <line
                key={i}
                x1="5"
                x2={w - 5}
                y1={splitY + 6 + ((i + 1) * (140 - splitY)) / 4}
                y2={splitY + 6 + ((i + 1) * (140 - splitY)) / 4}
                stroke="var(--color-line)"
                strokeWidth="0.75"
              />
            ))}
          </>
        ) : (
          <>
            <rect
              x="5"
              y="8"
              width={windowW}
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
                  x2={5 + windowW}
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
                width={windowW}
                height="22"
                fill="none"
                stroke="var(--color-line)"
                strokeWidth="0.75"
              />
            )}
          </>
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
          /* Bottom-aligned: machines stand on a floor, and a frame floating in
             the middle of the band reads as a cut-out rather than a machine. */
          <div className="absolute inset-0 flex items-end justify-center p-3">
            <div className="relative h-full w-full">
              <Image
                src={data.photos[0].src}
                alt={data.photos[0].alt}
                fill
                sizes="(min-width: 1280px) 13vw, (min-width: 1024px) 17vw, (min-width: 640px) 25vw, 50vw"
                className="object-contain object-bottom"
              />
            </div>
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

        <div className="mt-4 flex items-center justify-end border-t border-line pt-3">
          <span className="serial text-line-strong transition-colors duration-200 group-hover:text-graphite">
            детайли →
          </span>
        </div>
      </div>
    </Link>
  );
}
