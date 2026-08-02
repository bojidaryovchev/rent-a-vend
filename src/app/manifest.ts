import type { MetadataRoute } from "next";
import { company } from "@/lib/company";
import { routes } from "@/lib/routes";

/**
 * The web app manifest.
 *
 * Not an attempt to turn a rental catalogue into an app. It earns its place
 * for three smaller reasons: Android reads `theme_color` and the maskable icon
 * from here and nowhere else, an installed shortcut is a plausible thing for
 * the owner to want on his own phone, and Lighthouse marks the site down
 * without one.
 *
 * Built from `company` rather than repeated string literals, so the day the
 * trading name changes it changes here too.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    /* Pins the app identity to the origin root. Without it the identity is
       derived from `start_url`, and changing that later would register as a
       different app on a phone that already had it installed. */
    id: "/",

    name: `${company.brandName} - вендинг машини под наем`,
    /* Twelve characters or so before Android truncates it under the icon. */
    short_name: company.brandName,
    description:
      "Кафе, снакс, комбинирани и автомати за студени напитки под наем. Реални машини от склад, ясна месечна цена, доставка, монтаж и сервиз в цяла България.",

    lang: "bg",
    dir: "ltr",
    start_url: routes.home,
    scope: "/",
    display: "standalone",

    /* The splash screen is the page background, not the header: an installed
       site that flashes dark and then turns paper reads as a fault. */
    background_color: "#faf9f7",
    /* Matches the `themeColor` in the root layout's viewport export. Both are
       --color-graphite-deep. If one moves, move the other. */
    theme_color: "#1a1917",

    categories: ["business", "shopping"],

    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      /**
       * Separate file, not `purpose: "any maskable"` on the one above. A
       * launcher told an icon is both will crop the padded one when it shows
       * it unmasked, and the mark ends up swimming in white space.
       */
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],

    /* The two things someone who installed this would open it for. */
    shortcuts: [
      {
        name: "Коя машина ми трябва",
        short_name: "Препоръка",
        url: routes.recommender,
      },
      {
        name: "Контакти",
        short_name: "Контакти",
        url: routes.contact,
      },
    ],
  };
}
