import type { Metadata, Viewport } from "next";
import { Commissioner, JetBrains_Mono, Oswald } from "next/font/google";
import "./globals.css";
import { Analytics } from "@/components/site/analytics";
import { SITE_URL, isIndexable } from "@/lib/seo";
import { company } from "@/lib/company";

/**
 * Root shell: document, fonts, base colours. Nothing else.
 *
 * The marketing header and footer live in the `(site)` group so the admin does
 * not inherit them: on a phone, the banner plus utility strip plus nav consumed
 * most of the screen before the first control.
 */

/**
 * Three families, each with a real cyrillic subset — non-negotiable here, since
 * a Latin face with Cyrillic bolted on draws в г д и к л п ц ш щ wrong.
 *
 * Oswald is condensed signage lettering: the voice of machine plates and
 * warehouse markings, and it holds its tightness in Cyrillic where most
 * condensed faces fall apart. Commissioner reads long-form Bulgarian without
 * fighting it. JetBrains Mono carries stock references and asset tags.
 */
const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin", "cyrillic"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const commissioner = Commissioner({
  variable: "--font-commissioner",
  subsets: ["latin", "cyrillic"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "cyrillic"],
  display: "swap",
  weight: ["400", "500"],
});

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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    /* lang="bg" is what activates Bulgarian Cyrillic letterforms via `locl`.
       Without it the browser renders Russian forms for в г д и к л п ц ш щ. */
    <html
      lang="bg"
      className={`${oswald.variable} ${commissioner.variable} ${jetbrains.variable} h-full`}
    >
      <body className="flex min-h-full flex-col bg-paper text-ink antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
