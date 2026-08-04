import { cn } from "@/lib/cn";
import type { Category } from "@/content/taxonomy";

/**
 * Stands in until the warehouse photography happens.
 *
 * Deliberately not a stock photograph and not a manufacturer render. Necta has
 * withdrawn the product pages for almost every machine in this catalogue, and
 * what surfaces in a search belongs to competing dealers. A technical drawing
 * that admits what it is beats an image we have no right to use.
 *
 * Drawn on a measuring grid, because that is the honest register: this is a
 * dimensioned object we are describing, not a product we are photographing.
 *
 * The silhouette is DERIVED from each machine's real dimensions and tray count,
 * so a squat 701mm Snakky does not look identical to a 1180mm Crane Merchant. A
 * single glyph repeated 22 times across a catalogue page undercut the very
 * claim the page exists to make.
 *
 * Registered as the `model-photos` placeholder.
 */

const FALLBACK: Record<Category, { ratio: number; rows: number }> = {
  coffee: { ratio: 0.36, rows: 3 },
  snack: { ratio: 0.44, rows: 5 },
  /* One narrow stacked cabinet, not two side by side: a combo is 580mm across
     and roughly 1830mm tall. */
  combo: { ratio: 0.32, rows: 4 },
  cold: { ratio: 0.42, rows: 4 },
};

/** Where the snack base meets the coffee machine, as a share of the height.
 *  The base is 1080mm of a ~1830mm assembled machine. */
const COMBO_SPLIT = 1080 / 1830;

export interface MachineShape {
  widthMm: number | null;
  heightMm: number | null;
  numTrays: number | null;
  numberOfSelections: number | null;
}

function Silhouette({
  category,
  ratio,
  rows,
}: {
  category: Category;
  ratio: number;
  rows: number;
}) {
  const isCombo = category === "combo";
  const isCoffee = category === "coffee";

  // Body width follows the machine's real proportions against a 220-tall frame.
  const bodyH = 200;
  const bodyW = Math.round(bodyH * ratio * 1.55);
  const vbW = bodyW + 16;

  /* A combination machine is ONE cabinet: a coffee machine bolted onto a snack
     base. It used to draw as two panels standing side by side, which is a
     different product - and one this catalogue does not carry. */
  const splitY = 10 + Math.round(bodyH * (1 - COMBO_SPLIT));

  const panels = [0];

  return (
    <svg
      viewBox={`0 0 ${vbW} 220`}
      className="relative h-full max-h-105 w-auto"
      aria-hidden
      fill="none"
    >
      <defs>
        <linearGradient id="steelface" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-graphite-soft)" />
          <stop offset="45%" stopColor="var(--color-graphite)" />
          <stop offset="100%" stopColor="var(--color-graphite-deep)" />
        </linearGradient>
      </defs>

      {panels.map((offset) => {
        const windowH = isCoffee ? 96 : 140;
        const windowW = Math.round(bodyW * 0.58);
        const keyX = 8 + windowW + 14;
        const keyW = Math.max(16, bodyW - windowW - 22);

        /* The snack half of a combo, drawn full width: the glass runs across
           the whole base cabinet, unlike a Snakky's part-width window. */
        const baseTop = splitY + 8;
        const baseH = 10 + bodyH - 18 - baseTop;

        return (
          <g key={offset} transform={`translate(${offset + 8},0)`}>
            <rect x="0" y="10" width={bodyW} height={bodyH} fill="url(#steelface)" />
            <rect
              x="0"
              y="10"
              width={bodyW}
              height={bodyH}
              stroke="var(--color-graphite-edge)"
              strokeWidth="1.5"
            />

            {isCombo ? (
              <>
                {/* Coffee machine on top: brew window, keypad, cup station. */}
                <rect
                  x="10"
                  y="20"
                  width={windowW}
                  height={splitY - 48}
                  fill="oklch(0.98 0.003 85 / 0.1)"
                  stroke="oklch(0.98 0.003 85 / 0.28)"
                />
                <rect
                  x={keyX}
                  y="20"
                  width={keyW}
                  height={splitY - 48}
                  fill="oklch(0.98 0.003 85 / 0.1)"
                />
                <circle cx={keyX + keyW / 2} cy={splitY - 18} r="2.5" fill="var(--color-accent)" />
                <rect
                  x="14"
                  y={splitY - 26}
                  width={Math.max(30, windowW - 12)}
                  height="20"
                  fill="var(--color-graphite-deep)"
                />

                {/* The join. One line, full width - the whole difference
                    between a stack and a single tall box. */}
                <line
                  x1="0"
                  x2={bodyW}
                  y1={splitY}
                  y2={splitY}
                  stroke="var(--color-graphite-edge)"
                  strokeWidth="1.5"
                />

                {/* Snack base: glass front with one shelf per real tray. */}
                <rect
                  x="10"
                  y={baseTop}
                  width={bodyW - 20}
                  height={baseH}
                  fill="oklch(0.98 0.003 85 / 0.1)"
                  stroke="oklch(0.98 0.003 85 / 0.28)"
                />
                {Array.from({ length: Math.min(rows, 5) }, (_, r) => (
                  <line
                    key={r}
                    x1="10"
                    x2={bodyW - 10}
                    y1={baseTop + ((r + 1) * baseH) / (Math.min(rows, 5) + 1)}
                    y2={baseTop + ((r + 1) * baseH) / (Math.min(rows, 5) + 1)}
                    stroke="oklch(0.98 0.003 85 / 0.18)"
                  />
                ))}
              </>
            ) : (
              <>
                {/* Product window */}
                <rect
                  x="10"
                  y="22"
                  width={windowW}
                  height={windowH}
                  fill="oklch(0.98 0.003 85 / 0.1)"
                  stroke="oklch(0.98 0.003 85 / 0.28)"
                />

                {/* Shelves, one per real tray */}
                {!isCoffee &&
                  Array.from({ length: Math.min(rows, 6) }, (_, r) => (
                    <line
                      key={r}
                      x1="10"
                      x2={10 + windowW}
                      y1={40 + r * (windowH / Math.min(rows + 1, 7))}
                      y2={40 + r * (windowH / Math.min(rows + 1, 7))}
                      stroke="oklch(0.98 0.003 85 / 0.18)"
                    />
                  ))}

                {/* Cup station */}
                {isCoffee && (
                  <>
                    <rect
                      x={14}
                      y="132"
                      width={Math.max(30, windowW - 12)}
                      height="42"
                      fill="var(--color-graphite-deep)"
                    />
                    <rect
                      x={22}
                      y="152"
                      width={Math.max(18, windowW - 28)}
                      height="20"
                      fill="oklch(0.98 0.003 85 / 0.12)"
                    />
                  </>
                )}

                {/* Display, keypad, power light, delivery bay */}
                <rect
                  x={keyX}
                  y="26"
                  width={keyW}
                  height="34"
                  fill="oklch(0.98 0.003 85 / 0.1)"
                />
                {Array.from({ length: 4 }, (_, i) =>
                  Array.from({ length: 2 }, (_, j) => (
                    <rect
                      key={`${i}-${j}`}
                      x={keyX + 3 + j * 9}
                      y={68 + i * 9}
                      width="6"
                      height="6"
                      fill="oklch(0.98 0.003 85 / 0.22)"
                    />
                  )),
                )}
                <circle
                  cx={keyX + keyW / 2}
                  cy="118"
                  r="3"
                  fill="var(--color-accent)"
                />
                <rect
                  x={keyX}
                  y="132"
                  width={keyW}
                  height="8"
                  fill="oklch(0.98 0.003 85 / 0.16)"
                />
              </>
            )}

            <rect
              x="0"
              y={10 + bodyH - 14}
              width={bodyW}
              height="14"
              fill="var(--color-graphite-deep)"
            />
          </g>
        );
      })}
    </svg>
  );
}

export function MachineImage({
  category,
  name,
  shape,
  className,
  showNote = false,
  caption,
}: {
  category: Category;
  name: string;
  /** Real dimensions where known, so no two machines draw alike. */
  shape?: MachineShape;
  className?: string;
  showNote?: boolean;
  /** Sits under the drawing, explaining what will replace it. */
  caption?: string;
}) {
  const fallback = FALLBACK[category];

  const ratio =
    shape?.widthMm && shape?.heightMm
      ? Math.min(0.95, Math.max(0.22, shape.widthMm / shape.heightMm))
      : fallback.ratio;

  const rows =
    shape?.numTrays ??
    (shape?.numberOfSelections
      ? Math.min(7, Math.max(2, Math.round(shape.numberOfSelections / 9)))
      : fallback.rows);

  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden border border-line bg-paper-sunken",
        className,
      )}
      role="img"
      aria-label={`${name} - заместващо изображение`}
    >
      <div className="paper-grain relative flex flex-1 items-end justify-center px-6 pt-8">
        {/* Measuring grid, faded at the edges so it reads as drawing paper
            rather than as a table. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-line) 1px, transparent 1px), linear-gradient(90deg, var(--color-line) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            maskImage:
              "radial-gradient(120% 80% at 50% 60%, black 30%, transparent 100%)",
          }}
        />
        <Silhouette category={category} ratio={ratio} rows={rows} />
      </div>

      {showNote && (
        <div className="relative flex items-center justify-between gap-3 border-t border-line bg-paper-raised px-3 py-2">
          <span className="serial text-ink-muted">Заместващо изображение</span>
          <span className="serial text-ink-subtle">не е снимка</span>
        </div>
      )}

      {caption && (
        <p className="relative border-t border-line bg-paper-raised px-3 pt-2 pb-3 text-[12px] leading-5 text-ink-muted">
          {caption}
        </p>
      )}
    </div>
  );
}
