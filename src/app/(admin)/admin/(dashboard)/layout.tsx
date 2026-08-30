import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminConfigured, isSignedIn } from "@/server/auth";
import { signOut } from "@/server/admin-actions";
import { storageHealth } from "@/server/enquiry-store";
import { company } from "@/lib/company";

/**
 * Belt and braces, and deliberately so.
 *
 * robots.txt disallows /admin, but robots.txt is a crawl instruction, not an
 * indexing one: a URL that is linked from anywhere can still be indexed
 * without ever being fetched. `noindex` is the directive that actually keeps
 * it out, and unlike the rest of the site it does not depend on the
 * NEXT_PUBLIC_SITE_INDEXABLE gate - the admin must never be indexable, in any
 * environment, however the flag is set.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Admin shell.
 *
 * Operate mode: scanability, speed and native expectations outrank expression.
 * No hero, no marketing chrome, nothing that costs a tap.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isAdminConfigured()) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20">
        <h1 className="text-heading tracking-tight">Администрацията е изключена</h1>
        <p className="mt-4 leading-relaxed text-ink-muted">
          Не е зададена променлива <code className="font-mono">ADMIN_PASSWORD</code>.
          Панелът е недостъпен, докато не бъде конфигурирана. Това е нарочно:
          парола по подразбиране е по-лоша от липсващ панел.
        </p>
      </div>
    );
  }

  const authed = await isSignedIn();
  if (!authed) redirect("/admin/vhod");

  const storage = await storageHealth();

  return (
    <div className="min-h-full bg-paper-sunken">
      <header className="border-b border-line bg-paper-raised">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3">
          {/**
           * The mark, and the brand name beside it.
           *
           * Not decoration. rent-a-vend and buy-a-vend run the SAME admin, in
           * the same language, at the same path, off the same login habit, and
           * the operator keeps both open at once - so "Администрация" alone
           * identifies nothing, and the price he is about to edit belongs to
           * whichever tab he happened to click. The mark answers that before
           * he reads a word, which is the one thing a logo is genuinely faster
           * at than a heading.
           *
           * Linked to /admin rather than to the site: this is the panel's
           * home, and a lockup in the top-left that leaves the panel is the
           * behaviour nobody expects here. Leaving is the separate link on the
           * right, and it says so in words.
           */}
          <Link
            href="/admin"
            className="inline-flex items-center gap-2.5 select-none"
          >
            <Image
              /* Decorative: the brand name is set as text right beside it, so
                 announcing the mark would only say it twice. */
              src="/logo-icon-only.png"
              alt=""
              width={692}
              height={692}
              /* 28px at every breakpoint. Without this next/image assumes the
                 mark could be full-bleed and ships a 1920w candidate. */
              sizes="28px"
              priority
              className="h-7 w-auto"
            />
            <span className="font-bold tracking-tight">
              {company.brandName}
              <span className="font-normal text-ink-muted">
                {" "}
                · Администрация
              </span>
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-ui">
            <Link
              href="/admin/zapitvaniya"
              className="text-ink-muted hover-fine:text-ink"
            >
              Запитвания
            </Link>
            <Link
              href="/admin/poshta"
              className="text-ink-muted hover-fine:text-ink"
            >
              Поща
            </Link>
            <Link
              href="/admin/tseni"
              className="text-ink-muted hover-fine:text-ink"
            >
              Цени
            </Link>
          </nav>
          {/**
           * Out to the public site.
           *
           * Every screen in here edits something a visitor sees - a price, a
           * machine's visibility, its position in a category - and none of them
           * shows the result. Checking it should not mean typing the domain.
           *
           * Same tab, no target="_blank", for the reason the site switcher
           * gives: this is navigation between our own pages, and the back
           * button is a better answer than a window nobody asked for. The
           * session is a cookie, so coming back costs one press.
           */}
          <Link
            href="/"
            className="ml-auto text-ui text-ink-muted hover-fine:text-ink"
          >
            Към сайта
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="text-ui text-ink-muted hover-fine:text-ink"
            >
              Изход
            </button>
          </form>
        </div>
      </header>

      {!storage.ok && (
        <p
          role="status"
          className="border-b border-line bg-accent px-5 py-2 text-ui-sm text-accent-ink"
        >
          <strong className="font-bold">Внимание.</strong> {storage.message}
        </p>
      )}

      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}
