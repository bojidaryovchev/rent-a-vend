import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminConfigured, isSignedIn } from "@/server/auth";
import { signOut } from "@/server/admin-actions";
import { storageHealth } from "@/server/enquiry-store";

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
          <span className="font-bold tracking-tight">Администрация</span>
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
          <form action={signOut} className="ml-auto">
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
