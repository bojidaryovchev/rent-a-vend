import { Commissioner, JetBrains_Mono, Oswald } from "next/font/google";

/**
 * The three families, defined once and shared by both root layouts.
 *
 * Extracted when the single root layout was split in two — one for the public
 * site under `[lang]`, one for the admin — because `next/font` must be called
 * at module scope and duplicating the calls would ship two copies of every
 * subset and produce two different sets of CSS variables for the same faces.
 *
 * Each carries a real cyrillic subset, which is non-negotiable here: a Latin
 * face with Cyrillic bolted on draws в г д и к л п ц ш щ wrong, and this
 * catalogue is read in Bulgarian.
 *
 * Oswald is condensed signage lettering — the voice of machine plates and
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

/** Applied to `<html>` by whichever root layout is rendering. */
export const fontVariables = `${oswald.variable} ${commissioner.variable} ${jetbrains.variable}`;
