import type { Metadata, Viewport } from "next";
import "../globals.css";
import { fontVariables } from "../fonts";
import { Analytics } from "@/components/site/analytics";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { PlaceholderBanner } from "@/components/site/placeholder-banner";
import { Toaster } from "@/components/site/toaster";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL, isIndexable, organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { company } from "@/lib/company";

/**
 * Root layout for the public site, and one of two in this app - the other is
 * `(admin)/layout.tsx`.
 *
 * WHY THERE IS NO `src/app/layout.tsx`. A root layout cannot read a dynamic
 * segment below it, so a single root can only ever hard-code one `<html lang>`.
 * D2 names Romania, Greece, Serbia and North Macedonia as later markets, and
 * serving those means `lang` has to follow a locale - which puts the root under
 * `[lang]` and orphans the admin, since the admin sits outside the locale tree.
 * Next's answer is multiple root layouts in route groups.
 *
 * The split is done now, while it is a mechanical change on a site nobody is
 * translating yet, rather than later under deadline. buy-a-vend went through
 * exactly this and then moved its site under `[lang]`; when this one needs a
 * second language, that move is the only step left.
 *
 * Re-adding `src/app/layout.tsx` would nest both roots inside it and render two
 * `<html>` elements per page. This shape is deliberate.
 */

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Вендинг машини под наем в цяла България",
    /* Deliberately the category phrase and not "Rent-a-Vend", now that the
       brand has a name. Nineteen characters of a brand nobody searches for,
       in the slot Google truncates first, would cost the one term people do
       type. The brand identifies the site in `openGraph.siteName` below,
       where it is not competing with a keyword. See docs/seo-blueprint.md. */
    template: "%s · Вендинг под наем",
  },
  description:
    "Кафе, снакс, комбинирани и автомати за студени напитки под наем. Реални машини от склад, ясна месечна цена, доставка, монтаж и сервиз в цяла България.",
  // Indexing stays off until the real prices land: a catalogue cached at €100
  // placeholders would teach search engines figures that are slow to correct.
  robots: isIndexable()
    ? { index: true, follow: true }
    : { index: false, follow: false },
  openGraph: {
    type: "website",
    locale: "bg_BG",
    siteName: company.brandName,
  },
  /**
   * X reads `og:image` when there is no `twitter:image`, so the card image
   * needs no second copy - but without this it renders as a thumbnail beside
   * the text rather than the full-width image `opengraph-image.tsx` is drawn
   * for.
   */
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  /* --color-graphite-deep, matching the manifest's `theme_color`. Both are the
     colour Android paints the status bar; if one moves, move the other. */
  themeColor: "#1a1917",
};

export default function SiteRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    /* lang="bg" is what activates Bulgarian Cyrillic letterforms via `locl`.
       Without it the browser renders Russian forms for в г д и к л п ц ш щ. */
    <html lang="bg" className={`${fontVariables} h-full`}>
      <body className="flex min-h-full flex-col bg-paper text-ink antialiased">
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <PlaceholderBanner />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
