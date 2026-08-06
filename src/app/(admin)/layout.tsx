import type { Metadata, Viewport } from "next";
import "../globals.css";
import { fontVariables } from "../fonts";

/**
 * Root layout for the admin, and one of two in this app.
 *
 * The public site's root lives at `(site)/[lang]/layout.tsx` so that
 * `<html lang>` can follow the locale. A root layout cannot read a dynamic
 * segment below it, so the only way to have a per-locale `lang` attribute is to
 * put the root *under* `[lang]` — which orphans everything outside the locale
 * tree. Next's answer is multiple root layouts in route groups, and this is the
 * second one.
 *
 * Consequence worth knowing before "tidying": there is deliberately **no**
 * `src/app/layout.tsx`. Re-adding one would nest these two roots inside it and
 * produce two `<html>` elements per page.
 *
 * The admin is Bulgarian only, and permanently so. It is used by one person who
 * runs the company; translating it would be work with no reader.
 */

export const metadata: Metadata = {
  title: "Администрация",
  /* Never indexed, regardless of the site-wide indexing gate. */
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#1a1917",
};

export default function AdminRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="bg" className={`${fontVariables} h-full`}>
      <body className="flex min-h-full flex-col bg-paper text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
