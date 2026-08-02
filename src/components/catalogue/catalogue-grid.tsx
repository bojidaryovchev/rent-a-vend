"use client";

import { useMemo, useState } from "react";
import { ModelCard, type CardData } from "./model-card";
import { ButtonLink } from "@/components/ui/button";
import {
  VENUE_GROUPS,
  VENUE_GROUP_LABEL,
  type VenueGroup,
} from "@/content/taxonomy";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/cn";

/**
 * Catalogue grid with venue filtering.
 *
 * The controls sit on a panel rather than loose on the page: they are equipment
 * for operating the catalogue, and giving them a housing says so.
 *
 * Six merged venue groups rather than the twelve detailed types - twelve
 * against this many models produces filter combinations that return nothing,
 * and an empty result page is bad for the visitor and bad for search. The full
 * twelve still appear on each machine page, where detail helps.
 *
 * Groups that would return nothing are disabled rather than hidden, so the
 * filter's shape stays stable as stock changes.
 */
export function CatalogueGrid({
  models,
  availableOnlyDefault = false,
}: {
  models: CardData[];
  availableOnlyDefault?: boolean;
}) {
  const [venue, setVenue] = useState<VenueGroup | null>(null);
  const [availableOnly, setAvailableOnly] = useState(availableOnlyDefault);

  const counts = useMemo(() => {
    const map = new Map<VenueGroup, number>();
    for (const group of VENUE_GROUPS) {
      map.set(group, models.filter((m) => m.venueGroups.includes(group)).length);
    }
    return map;
  }, [models]);

  const filtered = useMemo(
    () =>
      models.filter((m) => {
        if (venue && !m.venueGroups.includes(venue)) return false;
        if (availableOnly && !m.canRent) return false;
        return true;
      }),
    [models, venue, availableOnly],
  );

  const chip =
    "min-h-11 border px-3 text-[12px] transition-colors duration-200";

  return (
    <>
      <div className="bay-panel mb-8 p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="serial mr-1 text-ink-muted">обект</span>

          <button
            type="button"
            onClick={() => setVenue(null)}
            aria-pressed={venue === null}
            className={cn(
              chip,
              venue === null
                ? "border-graphite bg-graphite text-paper"
                : "border-line bg-paper-raised text-ink-muted hover-fine:border-line-strong hover-fine:text-graphite",
            )}
          >
            Всички обекти
          </button>

          {VENUE_GROUPS.map((group) => {
            const count = counts.get(group) ?? 0;
            const active = venue === group;
            return (
              <button
                key={group}
                type="button"
                disabled={count === 0}
                onClick={() => setVenue(active ? null : group)}
                aria-pressed={active}
                className={cn(
                  chip,
                  "disabled:cursor-not-allowed disabled:border-line disabled:bg-paper-sunken disabled:text-ink-subtle",
                  active
                    ? "border-graphite bg-graphite text-paper"
                    : "border-line bg-paper-raised text-ink-muted hover-fine:border-line-strong hover-fine:text-graphite",
                )}
              >
                {VENUE_GROUP_LABEL[group]}{" "}
                <span className="tabular opacity-60">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-[13px] text-graphite">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
              className="h-4 w-4 accent-status-available"
            />
            Само налични в момента
          </label>
          <span className="serial tabular text-ink-muted">
            {filtered.length} от {models.length} машини
          </span>
        </div>
      </div>

      {filtered.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((m) => (
            <ModelCard key={m.id} data={m} headingLevel={2} />
          ))}
        </div>
      ) : (
        <div className="bay-panel riveted p-10 text-center">
          <h2 className="plate text-[15px] text-graphite">
            Няма машина по тези критерии
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[14px] leading-6 text-ink-muted">
            Разкажете ни за обекта и ще предложим подходящ модел, дори да не е в
            този списък.
          </p>
          <div className="mt-6 flex justify-center">
            <ButtonLink href={routes.enquiry}>Изпрати запитване</ButtonLink>
          </div>
        </div>
      )}
    </>
  );
}
