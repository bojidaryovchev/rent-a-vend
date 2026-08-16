/**
 * The three sites.
 *
 * D51: three domains, one company, differing only by transaction direction.
 * Rent-a-Vend rents machines out, Buy-a-Vend sells refurbished ones, and
 * Sell-a-Vend buys used fleets in. Left unlinked they read as three unrelated
 * strangers who happen to share a phone number, which is worse than either
 * running one site or running three honest ones.
 *
 * The link is not decoration. A visitor comparing rental against ownership is
 * on the wrong site half the time by definition - that is what
 * `routes.buyVsRent` is for - and an operator who has just been paid for a
 * retiring fleet is the most plausible renter of a replacement there is.
 *
 * ⚠ MIRRORED IN ALL THREE REPOS. Only `CURRENT_SITE` and the labels differ:
 * buy-a-vend and sell-a-vend take their labels from the dictionary instead,
 * because they render in eleven and twelve languages. Everything else in this
 * file - the order, the URLs, the derived `OTHER_SITES` - is the same object.
 */

export type FamilySite = "rent" | "buy" | "sell";

/** Which of the three this repo is. */
export const CURRENT_SITE: FamilySite = "rent";

export const FAMILY_URL: Record<FamilySite, string> = {
  rent: "https://rent-a-vend.com",
  buy: "https://buy-a-vend.com",
  sell: "https://sell-a-vend.com",
};

/**
 * Fixed order, and deliberately not "current site first".
 *
 * The switcher is a position indicator as much as a set of links, and a control
 * whose items reshuffle depending on which of the three you are standing on
 * stops reading as one object seen from three places.
 */
export const FAMILY_ORDER: readonly FamilySite[] = ["rent", "buy", "sell"];

/** The other two, in the same order. What the mobile drawer and footer list. */
export const OTHER_SITES: readonly FamilySite[] = FAMILY_ORDER.filter(
  (site) => site !== CURRENT_SITE,
);

/**
 * What language a site answers in, where there is only one.
 *
 * This site is Bulgarian and nothing else - it sells to Bulgarian offices and
 * schools, and there is no `[lang]` segment in this repo at all. buy-a-vend and
 * sell-a-vend are multilingual, so no single `hreflang` is true of them and
 * they are absent here rather than guessed at.
 *
 * Nothing here reads the `rent` entry, since this site never links to itself.
 * It is kept whole for the same reason `FAMILY_LONG` is: the other two repos do
 * read it, and one description of each site is easier to keep true than three.
 */
export const FAMILY_LANG: Partial<Record<FamilySite, string>> = { rent: "bg" };

/**
 * Labels for the switcher, in the visitor's grammar rather than ours.
 *
 * "Наемам / Купувам / Продавам", not "Наем / Продажба / Изкупуване". The
 * domains are already imperatives - rent, buy, sell a vend - and first person
 * is the closest Bulgarian gets to that: the control answers "what do I want to
 * do", which is the only question a visitor who landed on the wrong one of the
 * three is asking.
 *
 * Not the brand names. All three wordmarks are the same lockup differing by one
 * verb, so "Buy-a-Vend" tells a visitor who has never heard of us strictly less
 * than "Купувам" does.
 */
export const FAMILY_LABELS = {
  heading: "Също от нас",
  rent: "Наемам",
  buy: "Купувам",
  sell: "Продавам",
} as const;

/**
 * The footer's fuller lines, which name the market as well as the direction.
 *
 * The footer has room for a sentence and the header does not, and the market is
 * the part a reader needs: "в България" is what tells a visitor that the rental
 * site is only ever going to answer in Bulgarian.
 *
 * All three are here, not just the other two. This site never prints its own
 * line - but the other two repos do, and keeping the set whole is what lets the
 * three descriptions be checked against each other in one place instead of
 * drifting apart in three footers.
 */
export const FAMILY_LONG: Record<FamilySite, string> = {
  rent: "Вендинг машини под наем в България",
  buy: "Реновирани машини за продажба в Европа",
  sell: "Изкупуваме машини втора употреба в Европа",
};
