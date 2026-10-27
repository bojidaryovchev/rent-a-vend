import Link from "next/link";
import Image from "next/image";
import type { Model } from "@/content/schema";
import { leadPhoto } from "@/content/models";
import { CATEGORY_LABEL } from "@/content/taxonomy";
import type { Catalogue } from "@/engine/catalogue";
import { fromMonthly } from "@/engine/quote";
import { audienceLines, pickVenues } from "@/lib/hero-picks";
import { routes, type CategoryKey } from "@/lib/routes";
import { MachineImage } from "@/components/ui/machine-image";
import { HeroPicksControls } from "@/components/catalogue/hero-picks-controls";

/**
 * The hero's recommended machines.
 *
 * A recommendation, stated as ours. The site has no sales history, so "най-
 * избирано" would be a claim nobody can check, on a page whose whole argument
 * is that every figure on it can be. What each card says instead is who the
 * machine is for, generated from the model's own record, which lets a visitor
 * rule a machine in or out in one line - a ten-person office and a
 * three-hundred-person plant see at once which card is theirs.
 *
 * Everything is in the server HTML: every card, every price, every link. The
 * row scrolls natively with CSS scroll snap, and the only script is the pair
 * of buttons and the counter. There is no autoplay - the site has one
 * authored motion and this is not it (DESIGN.md) - so the row moves only when
 * the visitor moves it.
 *
 * Degrades in steps rather than breaking: no pick left to show is the
 * drawing the hero has always fallen back to, and a single one is a plain
 * card with no carousel chrome around it.
 */

const RAIL_ID = "hero-picks-rail";

/**
 * The rendered width of a card's photo bed, per breakpoint, so the browser
 * picks a file for the bed rather than for the screen. Derived from the
 * layout below: a 16/24px container gutter, a 1px card border each side, and
 * from `lg` the hero's 0.85fr column of a 1240px container.
 *
 *   < 768    86% of the rail             0.86 x (100vw - 32) - 2
 *   768-1023 86% of the rail             0.86 x (100vw - 48) - 2
 *   1024+    the hero's right column     0.425 x (100vw - 48 - 40) - 2
 *   1240+    that column at its maximum  488px
 */
const BED_SIZES =
  "(min-width: 1240px) 488px, (min-width: 1024px) calc(42.5vw - 39px), (min-width: 768px) calc(86vw - 43px), calc(86vw - 30px)";

function PickCard({
  model,
  catalogue,
  first,
}: {
  model: Model;
  catalogue: Catalogue;
  /** The first card's frame is the page's largest paint; the rest wait. */
  first: boolean;
}) {
  // Resolved upstream by `heroPicks`, which drops any pick without a frame.
  const photo = leadPhoto(model)!;
  const { venues, fit } = audienceLines(model, pickVenues(model.slug));

  return (
    /* The focus ring is drawn inside the edge, and a positioned photo bed
       paints over its owner's outline. So the card is its own stacking
       context (`isolate`) and the bed sits at a negative z-index inside it:
       above the card's fill, beneath its ring. */
    <Link
      href={routes.model(model.category as CategoryKey, model.slug)}
      className="focus-inset group isolate flex w-full flex-col overflow-hidden border border-line bg-paper-sunken"
    >
      {/* The renders are white-backed, so they sit on paper rather than being
          knocked out - the drop shadow under the cabinet is part of the image
          and a cut-out would take it with it. Bottom-aligned, because machines
          stand on a floor. */}
      <div className="paper-grain relative -z-10 h-70 shrink-0 sm:h-80">
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes={BED_SIZES}
          /* `priority` is deprecated in Next 16, and its preload went out
             without a fetch priority. The first frame asks for high priority
             on the tag itself; the others stay out of its way until they are
             scrolled near. */
          loading={first ? "eager" : "lazy"}
          fetchPriority={first ? "high" : "low"}
          className="object-contain object-bottom p-3"
        />
      </div>

      {photo.credit && (
        <p className="border-t border-line bg-paper-raised px-3 py-2">
          <span className="serial text-ink-subtle">{photo.credit}</span>
        </p>
      )}

      <div className="flex flex-1 flex-col border-t border-line bg-paper-raised p-4">
        <p className="serial text-ink-subtle">{CATEGORY_LABEL[model.category]}</p>
        <h3 className="plate mt-1.5 text-[14px] text-graphite">{model.name}</h3>

        {(venues || fit) && (
          <p className="mt-2 text-[13px] leading-6 text-ink-muted">
            {venues}
            {venues && fit && <br />}
            {fit}
          </p>
        )}

        {/* Pinned to the foot, so the prices line up across the row whatever
            the copy above them runs to. */}
        <div className="mt-auto pt-4">
          <div className="flex items-end justify-between gap-3 border-t border-line pt-3">
            <span className="tabular font-display text-[26px] leading-none text-graphite">
              от {fromMonthly(catalogue, model.id)}&nbsp;€
              <span className="ml-1 font-sans text-[12px] font-normal text-ink-muted">
                /месец
              </span>
            </span>
            <span className="serial text-ink-subtle transition-colors duration-200 group-hover:text-graphite">
              детайли →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/** The band's one heading, in the stamp the single card used to carry on its
 *  photograph. The text sits in a span because `h2` takes the display face
 *  from an unlayered rule in globals.css, which a utility cannot override. */
function Stamp() {
  return (
    <h2>
      <span className="serial block bg-graphite px-2 py-1 text-paper/80">
        препоръчваме
      </span>
    </h2>
  );
}

export function HeroPicks({
  picks,
  catalogue,
}: {
  /** Already resolved: published, with a frame. See `heroPicks`. */
  picks: Model[];
  catalogue: Catalogue;
}) {
  if (picks.length === 0) {
    return (
      <MachineImage
        category="combo"
        name="Вендинг машина"
        showNote
        className="animate-shutter h-105"
      />
    );
  }

  if (picks.length === 1) {
    return (
      <div className="animate-shutter flex min-w-0 flex-col gap-3">
        <Stamp />
        <PickCard model={picks[0]} catalogue={catalogue} first />
      </div>
    );
  }

  return (
    /* The shutter runs once, on the whole row, not once per card.
       `min-w-0` because this is a grid item holding a row wider than itself:
       without it the hero's column grows to the row's full length. */
    <section
      aria-roledescription="carousel"
      aria-label="Препоръчани машини"
      className="animate-shutter flex min-w-0 flex-col gap-3"
    >
      <div className="flex items-center justify-between gap-3">
        <Stamp />
        <HeroPicksControls railId={RAIL_ID} count={picks.length} />
      </div>

      {/* One card at a time. Below `lg`, where the hero is one column, a
          strip of the next card shows at the edge and says "swipe" without a
          word; beside the headline on a desktop the buttons say it instead.
          Not two to a row on a tablet: the second card's photograph then
          became the page's largest paint, and the counter stopped at "4 / 5".

          86% is the widest card whose peek never shows the next machine:
          measured against all five renders from 320 to 1023px, the nearest
          machine stays at least 10px clear of the peek. The scrollbar is
          hidden because the buttons already say this scrolls. */}
      <ul
        id={RAIL_ID}
        className="relative flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {picks.map((model, i) => (
          <li
            key={model.id}
            className="flex shrink-0 basis-[86%] snap-start lg:basis-full"
          >
            {/* The slide role sits on a wrapper, not on the `li`: a list item
                given another role stops being a list item, and a list of
                none fails the list rule. */}
            <div
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} от ${picks.length}`}
              className="flex w-full"
            >
              <PickCard model={model} catalogue={catalogue} first={i === 0} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
