import type { Metadata } from "next";
import "./globals.css";
import { fontVariables } from "./fonts";
import { NotFoundBody } from "@/components/site/not-found-body";

/**
 * The 404 for URLs that match no route at all.
 *
 * WHY THIS FILE EXISTS. A `not-found.tsx` renders *inside* a root layout, and
 * this app has no root layout it can reach: the only two are
 * `(site)/layout.tsx` and `(admin)/layout.tsx`, split so `<html lang>` can
 * follow a locale when this site gains one. So Next had nothing to nest a
 * root-level 404 into and synthesised a bare document - no stylesheet, no
 * fonts, no `lang`.
 *
 * The Next docs name this case exactly: `global-not-found.js` is for when the
 * root layout is defined using top-level dynamic segments or is otherwise
 * unreachable, "which makes composing a consistent 404 page harder". It
 * bypasses layout rendering entirely, so it has to bring its own `<html>`, its
 * own styles and its own fonts - hence the imports above, which would otherwise
 * look redundant with the site layout.
 *
 * Enabled by `experimental.globalNotFound` in `next.config.ts`. Both files
 * stay: this one catches "no route matched", `(site)/not-found.tsx` catches a
 * `notFound()` from inside a segment that *did* match, where there IS a layout
 * and the chrome should be kept.
 *
 * No header or footer here on purpose. Rendering them would mean rendering the
 * site layout, which is the thing this file exists to work around; the body's
 * own list of routes is the way out instead.
 *
 * The body is shared between the two so they cannot drift into two different
 * 404s.
 */
export const metadata: Metadata = {
  title: "Страницата не е намерена",
  robots: { index: false, follow: true },
};

export default function GlobalNotFound() {
  return (
    <html lang="bg" className={`${fontVariables} h-full`}>
      <body className="flex min-h-full flex-col bg-paper text-ink antialiased">
        <main className="flex-1">
          <NotFoundBody />
        </main>
      </body>
    </html>
  );
}
