import {
  CURRENT_SITE,
  FAMILY_LANG,
  FAMILY_ORDER,
  OTHER_SITES,
  familyHref,
  type FamilySite,
} from "@/lib/family";
import { cn } from "@/lib/cn";

/**
 * Moving between the three sites.
 *
 * ⚠ THE SAME FILE IN ALL THREE REPOS, down to the class strings. The labels
 * arrive as a prop rather than being imported, which is the only way that can
 * be true: rent-a-vend has one language and holds them in `@/lib/family`, while
 * buy-a-vend and sell-a-vend have twelve and eleven and take them from
 * `dict.family`, because a module-level constant cannot know which is served.
 *
 * A row, not a menu - which is the opposite of what the language switcher next
 * to it does, for a reason. Twelve endonyms genuinely do not fit a utility
 * strip; three verbs do. And a menu only puts its contents in the DOM once
 * opened, which for a set of cross-domain links is the whole point thrown away:
 * these three sites vouching for each other is the link equity, and a crawler
 * cannot see a link behind a `useState`.
 *
 * The current site renders as a `<span>` with `aria-current`, not a link to
 * itself. That is what makes this a position indicator rather than an advert -
 * a visitor should be able to see at a glance that they are on one of three
 * doors into the same company, not just that two other doors exist.
 *
 * No accent colour, under the same One Action Rule the language switcher cites:
 * the page spends its one yellow control on the enquiry, and marking "where you
 * are" in yellow teaches the eye that yellow means position on a site where it
 * means act.
 *
 * Same tab, no `target="_blank"`. These are our own sites and this is
 * navigation, not a citation; opening a new window unasked is WCAG 3.2.5's
 * problem and the browser's back button is a better answer than a tab the
 * visitor did not request.
 *
 * ⚠ THE LINKS CARRY THE LOCALE. `familyHref` appends `/{locale}` when the
 * target site publishes that language, which is what stops a reader arriving on
 * the next site in the wrong one. `locale` is a prop for the same reason
 * `labels` is: this repo has no `[lang]` segment and passes its single `"bg"`,
 * the other two pass what they are serving, and the file stays identical.
 */

export type FamilyLabels = Record<FamilySite, string> & {
  /** The group's accessible name, and the footer column's heading. */
  heading: string;
};

const item = "plate flex min-h-7 items-center px-2 py-0.75 text-[11px] leading-4";

export function SiteSwitcher({
  labels,
  locale,
  className,
}: {
  labels: FamilyLabels;
  /** The language being read, carried across to the site being linked to. */
  locale: string;
  className?: string;
}) {
  return (
    <nav aria-label={labels.heading} className={className}>
      <ul className="flex items-center border border-paper/30">
        {FAMILY_ORDER.map((site, index) => (
          <li key={site} className={cn(index > 0 && "border-l border-paper/20")}>
            {site === CURRENT_SITE ? (
              <span aria-current="true" className={cn(item, "bg-paper/12 text-paper")}>
                {labels[site]}
              </span>
            ) : (
              <a
                href={familyHref(site, locale)}
                hrefLang={FAMILY_LANG[site]}
                rel="noopener"
                className={cn(
                  item,
                  "text-paper/55 transition-colors duration-200 hover-fine:bg-paper/10 hover-fine:text-paper",
                )}
              >
                {labels[site]}
              </a>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * The same three sites in the mobile drawer, where the strip control is hidden.
 *
 * Two buttons rather than a three-segment control: the drawer is a list of
 * places to go, and a third segment saying "you are here" would spend a row of
 * a phone screen restating what the wordmark above it already says. It reuses
 * the drawer's own secondary-button shape, on light ground.
 */
export function FamilyLinks({
  labels,
  locale,
  onNavigate,
}: {
  labels: FamilyLabels;
  /** As above - the language being read travels with the link. */
  locale: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="mt-5 border-t border-line pt-4">
      <p className="stencil text-[10px] text-ink-muted">{labels.heading}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {OTHER_SITES.map((site) => (
          <a
            key={site}
            href={familyHref(site, locale)}
            hrefLang={FAMILY_LANG[site]}
            rel="noopener"
            onClick={onNavigate}
            className="plate inline-flex min-h-11 items-center justify-center border border-line-strong bg-paper-raised px-3 text-[11px] text-graphite"
          >
            {labels[site]}
          </a>
        ))}
      </div>
    </div>
  );
}
