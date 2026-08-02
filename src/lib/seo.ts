import type { Metadata } from "next";
import { MODELS } from "@/content/models";
import { FAQ } from "@/content/faq";
import { CASE_STUDIES } from "@/content/case-studies";
import { GUIDES, type Guide } from "@/content/guides";
import { company, hasUnresolvedBrand, mapPin, mapsLink } from "@/lib/company";
import { fromMonthly } from "@/engine/quote";
import { CATEGORY_SLUGS, routes, type CategoryKey } from "@/lib/routes";

/**
 * SEO helpers.
 *
 * Three decisions worth stating.
 *
 * 1. The site stays `noindex` until `NEXT_PUBLIC_SITE_INDEXABLE` is set. A
 *    placeholder-priced catalogue indexed early would teach search engines the
 *    wrong prices and be slow to correct.
 * 2. Legacy model names lead the *heading*, because the stock IS the old
 *    machines and the name has to match the plate on the door. They no longer
 *    lead the *title*: keyword research found no measurable Bulgarian search
 *    demand for any of the 21 catalogue model names, so titles lead with the
 *    category term people actually type and keep the model name for
 *    recognition. Decision D24a; evidence in `docs/seo-keyword-research.md` §2.
 * 3. Every page declares its own canonical, through `pageMetadata`. Until now
 *    only model pages did, which left eleven static pages relying on Google
 *    guessing correctly.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.invalid";

export const isIndexable = (): boolean =>
  process.env.NEXT_PUBLIC_SITE_INDEXABLE === "true";

export const absolute = (path: string): string =>
  new URL(path, SITE_URL).toString();

/* -- page metadata -------------------------------------------------------- */

/**
 * One page's metadata, with the canonical filled in from its route.
 *
 * Exists so a canonical cannot be forgotten: the path is a required argument,
 * not an optional extra. `routes` is the single source of URLs, so passing a
 * route through here means the canonical and the link that points at it are
 * always the same string.
 */
/**
 * The share card.
 *
 * Was `/logo.png`, centre-cropped by the networks from square to 1.91:1 -
 * acceptable for a mark, never a card. That was written down as owed against
 * O10, "once there is a brand to put on it". The brand arrived, so
 * `src/app/opengraph-image.tsx` now draws a real 1200x630 card from the values
 * in `company`, and this is the URL it is served at.
 *
 * WHY IT IS NAMED HERE AT ALL, since Next is supposed to apply a root
 * `opengraph-image` to every page underneath it by itself: `openGraph` is
 * shallow-merged, not deep-merged. A page that sets `openGraph` to add its own
 * `url` replaces the parent's whole object, and the inherited image goes with
 * it. Every page on this site sets `url` through `pageMetadata`, so every page
 * would have lost the card. The automatic behaviour is real - `/admin/vhod`,
 * which sets no `openGraph`, picks the card up on its own - it just does not
 * survive contact with a page that wants a canonical URL.
 *
 * The unhashed path is deliberate and stable. Next also serves the card at
 * `/opengraph-image?<hash>` for cache-busting, but that hash is not reachable
 * from here and the bare path serves the same bytes.
 *
 * The stakes: a page with no `og:image` is not neutral. Facebook and Viber
 * pick an arbitrary image off the page or render a grey box, and a Facebook
 * post currently outranks most vending companies on the head term.
 */
export const SHARE_CARD = "/opengraph-image";

/** Longest variant that still fits the ~60 characters Google will display. */
export function fittingTitle(variants: string[], limit = 60): string {
  return (
    variants.find((v) => [...v].length <= limit) ?? variants[variants.length - 1]
  );
}

export function pageMetadata({
  path,
  title,
  description,
  image = SHARE_CARD,
  index = true,
  brandSuffix = true,
}: {
  path: string;
  title: string;
  description: string;
  /**
   * Only when the page has something better than the generated card - a model
   * page with a real photograph of that machine.
   */
  image?: string;
  /**
   * `false` for pages that must exist but must not rank - the enquiry form is
   * the only one. Note this is `noindex, follow`: the page still passes link
   * equity on, which a robots.txt `Disallow` would have thrown away by
   * preventing the crawl in the first place.
   */
  index?: boolean;
  /**
   * `false` drops the root layout's " · <brand>" suffix.
   *
   * For pages whose title is computed and already long - model pages run to
   * ~51 characters before the suffix - the suffix pushes past the ~60 that
   * Google displays and is then the part that gets cut anyway. Spending
   * nineteen characters on a brand nobody recognises yet, only to have them
   * truncated, is worse than not spending them: the machine name and the price
   * are what earn the click.
   */
  brandSuffix?: boolean;
}): Metadata {
  return {
    title: brandSuffix ? title : { absolute: title },
    description,
    alternates: { canonical: absolute(path) },
    openGraph: {
      title,
      description,
      url: absolute(path),
      images: [{ url: absolute(image) }],
    },
    ...(index ? {} : { robots: { index: false, follow: true } }),
  };
}

/* -- structured data ------------------------------------------------------ */

/**
 * Breadcrumbs, from a trail of [label, path] pairs.
 *
 * The visual breadcrumb on model pages predates this; the two are built from
 * the same `routes` helpers so they cannot describe different hierarchies.
 */
export function breadcrumbJsonLd(trail: [label: string, path: string][]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map(([name, path], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: absolute(path),
    })),
  };
}

/** The catalogue listing on a category page, in its displayed order. */
export function categoryJsonLd(
  category: CategoryKey,
  models: { slug: string; name: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    url: absolute(routes.category(category)),
    numberOfItems: models.length,
    itemListElement: models.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: m.name,
      url: absolute(routes.model(category, m.slug)),
    })),
  };
}

/**
 * A guide, as an Article.
 *
 * `author` and `publisher` are the organisation rather than a person: the
 * guides are drafted from named legal sources and reviewed, not bylined, and
 * inventing a personal author to satisfy an E-E-A-T checkbox would be the same
 * class of fabrication as an invented testimonial.
 */
export function articleJsonLd(guide: Guide) {
  const org = hasUnresolvedBrand() ? company.legalName : company.brandName;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    url: absolute(routes.guide(guide.slug)),
    inLanguage: "bg-BG",
    author: { "@type": "Organization", name: org },
    publisher: { "@type": "Organization", name: org },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absolute(routes.guide(guide.slug)),
    },
  };
}

/**
 * FAQ markup for a guide.
 *
 * Only ever built from questions that are genuinely on the page. bulvending
 * ships FAQPage on its homepage, which has no FAQ on it - that is the mistake
 * worth not copying, and it is a manual-action risk rather than a clever one.
 */
export function guideFaqJsonLd(guide: Guide) {
  if (!guide.faq.length) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: company.brandName,
    url: SITE_URL,
    inLanguage: "bg-BG",
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    /**
     * `LocalBusiness` rather than plain `Organization`: there is a real yard at
     * a real address with published hours, and the narrower type is what earns
     * the entity treatment. It stays a subtype of Organization, so nothing that
     * consumed the old shape breaks.
     */
    "@type": "LocalBusiness",
    /* A placeholder brand must never reach structured data. Until O10 lands,
       the legal name is the honest answer - it is a real, registered name. */
    name: hasUnresolvedBrand() ? company.legalName : company.brandName,
    legalName: company.legalName,
    url: SITE_URL,
    telephone: company.phone,
    email: company.email,
    vatID: company.vatNumber,
    taxID: company.eik,
    /* Confirmed in round 9 and fixed by D32. Publishing hours is also what
       makes the "answered within one working hour" promise checkable. */
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
        ],
        opens: "09:00",
        closes: "18:00",
      },
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      telephone: company.phone,
      email: company.email,
      areaServed: "BG",
      availableLanguage: "Bulgarian",
    },
    areaServed: { "@type": "Country", name: "България" },
    address: {
      "@type": "PostalAddress",
      addressCountry: "BG",
      streetAddress: company.streetAddress,
      addressLocality: company.addressLocality,
      addressRegion: company.addressRegion,
    },
    /**
     * Coordinates only once they are real. Google reconciles `geo` against the
     * postal address and a guessed pin in the wrong village is a worse signal
     * than no pin: it is the address that gets corrected, not the coordinates.
     */
    ...(mapPin.lat !== null && mapPin.lng !== null
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: mapPin.lat,
            longitude: mapPin.lng,
          },
          hasMap: mapsLink() ?? undefined,
        }
      : {}),
  };
}

export function modelJsonLd(modelId: string) {
  const model = MODELS.find((m) => m.id === modelId);
  if (!model) return null;

  const spec = model.spec;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: model.name,
    description: model.intro ?? undefined,
    category: model.category,
    brand: { "@type": "Brand", name: model.manufacturer },
    url: absolute(routes.model(model.category as CategoryKey, model.slug)),
    ...(spec.weightKg
      ? { weight: { "@type": "QuantitativeValue", value: spec.weightKg, unitCode: "KGM" } }
      : {}),
    ...(spec.heightMm
      ? { height: { "@type": "QuantitativeValue", value: spec.heightMm, unitCode: "MMT" } }
      : {}),
    ...(spec.widthMm
      ? { width: { "@type": "QuantitativeValue", value: spec.widthMm, unitCode: "MMT" } }
      : {}),
    /**
     * Priced as a rental, and deliberately as an *estimate*: these are
     * indicative monthly figures excluding VAT, not a binding offer.
     */
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: fromMonthly(model.id),
      priceValidUntil: undefined,
      availability: "https://schema.org/InStock",
      businessFunction: "https://purl.org/goodrelations/v1#LeaseOut",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        priceCurrency: "EUR",
        price: fromMonthly(model.id),
        valueAddedTaxIncluded: false,
        unitCode: "MON",
      },
    },
  };
}

export function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

/* -- sitemap entries ------------------------------------------------------ */

export function sitemapEntries(): { url: string; priority: number }[] {
  /**
   * The enquiry form is deliberately absent: it is `noindex, follow`, and
   * listing a page you are asking not to index is a contradictory signal.
   */
  const staticPages: [string, number][] = [
    [routes.home, 1],
    [routes.buyVsRent, 0.9],
    [routes.pricing, 0.9],
    [routes.recommender, 0.8],
    [routes.guides, 0.7],
    ...GUIDES.map((g) => [routes.guide(g.slug), 0.7] as [string, number]),
    [routes.howItWorks, 0.7],
    [routes.contact, 0.7],
    [routes.about, 0.6],
    [routes.faq, 0.6],
    /* Case studies enter the sitemap only once a real project is published: an
     * empty page in the sitemap is an invitation to index thin content. */
    ...(CASE_STUDIES.length > 0
      ? ([[routes.caseStudies, 0.6]] as [string, number][])
      : []),
    [routes.legal.rental, 0.4],
    [routes.legal.terms, 0.2],
    [routes.legal.privacy, 0.2],
    [routes.legal.cookies, 0.2],
  ];

  const categories = Object.values(CATEGORY_SLUGS).map(
    (slug) => [`/${slug}`, 0.9] as [string, number],
  );

  const models = MODELS.map(
    (m) =>
      [routes.model(m.category as CategoryKey, m.slug), 0.8] as [string, number],
  );

  return [...staticPages, ...categories, ...models].map(([path, priority]) => ({
    url: absolute(path),
    priority,
  }));
}
