/**
 * Every URL in one place.
 *
 * Bulgarian is the default locale and carries no path prefix, per the agreed
 * pattern (`/kafe-mashini-pod-naem/necta-concerto`). Later locales get
 * prefixes; Bulgarian stays bare.
 *
 * Slugs are Latin transliteration rather than Cyrillic: percent-encoded
 * Cyrillic URLs are unreadable the moment anyone pastes one into a message.
 */

export const CATEGORY_SLUGS = {
  coffee: "kafe-mashini-pod-naem",
  snack: "snak-mashini-pod-naem",
  combo: "kombinirani-mashini-pod-naem",
  cold: "avtomati-za-studeni-napitki",
} as const;

export type CategoryKey = keyof typeof CATEGORY_SLUGS;

export const routes = {
  home: "/",

  category: (key: CategoryKey) => `/${CATEGORY_SLUGS[key]}`,
  model: (key: CategoryKey, slug: string) => `/${CATEGORY_SLUGS[key]}/${slug}`,

  howItWorks: "/kak-raboti",
  recommender: "/koya-mashina",
  buyVsRent: "/naem-ili-pokupka",
  /**
   * Answers `вендинг машина цена` - at 260/mo and KD 4 the strongest commercial
   * term measured in this market, and the one place a visitor explicitly asks
   * for the thing no Bulgarian competitor publishes. See `docs/seo-blueprint.md`
   * §3.
   */
  pricing: "/tseni",

  /**
   * The authority layer. Permit, placement and БАБХ questions carry ~710
   * searches/month at difficulty 0 - more than twice the entire rental market
   * - and no vending company in the field answers them properly.
   */
  guides: "/rakovodstva",
  guide: (slug: string) => `/rakovodstva/${slug}`,

  caseStudies: "/kazusi",
  about: "/za-nas",
  contact: "/kontakti",
  faq: "/vaprosi",
  enquiry: "/zapitvane",

  legal: {
    terms: "/obshti-usloviya",
    privacy: "/poveritelnost",
    cookies: "/biskvitki",
    rental: "/usloviya-za-naem",
  },
} as const;

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  coffee: "Кафе машини",
  snack: "Снакс машини",
  combo: "Комбинирани",
  cold: "Студени напитки",
};

/**
 * Primary navigation, in order.
 *
 * Nav labels are shorter than the page titles. "Кафе машини" and "Снакс машини"
 * wrapped the bar onto two lines once the eighth item landed, and the word
 * "машини" carries nothing here that the surrounding context does not.
 */
export const PRIMARY_NAV = [
  { href: routes.category("coffee"), label: "Кафе" },
  { href: routes.category("snack"), label: "Снакс" },
  { href: routes.category("combo"), label: "Комбинирани" },
  { href: routes.category("cold"), label: "Студени напитки" },
  { href: routes.howItWorks, label: "Как работи" },
  { href: routes.buyVsRent, label: "Наем или покупка" },
  { href: routes.about, label: "За нас" },
  { href: routes.contact, label: "Контакти" },
] as const;
