import type { Metadata } from "next";
import { NotFoundBody } from "@/components/site/not-found-body";

/**
 * 404 for a page that matched a route and then called `notFound()` - an
 * unpublished machine, a withdrawn guide.
 *
 * ⚠ INSIDE `(site)`, NOT AT `src/app/`, and it took two attempts to land here.
 * It was at the root, with a comment saying it lived there "so it also catches
 * URLs that match no segment at all". It did catch them, and rendered them
 * wrong: a root `not-found.tsx` renders inside a ROOT layout, and the note in
 * `(site)/layout.tsx` explains at length why this app deliberately has none.
 * With nothing to nest into, Next fell back to a bare document. Measured in a
 * browser: `lang=""`, transparent background, no header, no footer, Bulgarian
 * text in Times New Roman.
 *
 * Moving it here fixes that case and does NOT, on its own, cover the other one:
 * a URL matching no route at all skips this file entirely and gets Next's
 * built-in English "404: This page could not be found" - which is measurably
 * worse than what was there before. That case is `app/global-not-found.tsx`,
 * added in the same change for exactly this reason. Both files, or neither.
 *
 * buy-a-vend had the identical bug for the identical reason and is fixed the
 * same way, one level down at `(site)/[lang]/not-found.tsx` because its roots
 * sit under a locale segment.
 */
export const metadata: Metadata = {
  title: "Страницата не е намерена",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return <NotFoundBody />;
}
