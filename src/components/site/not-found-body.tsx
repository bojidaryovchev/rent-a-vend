import Link from "next/link";
import { CATEGORY_LABELS, PRIMARY_NAV, routes } from "@/lib/routes";

/**
 * The 404 body, shared by both 404s.
 *
 * There are two entry points and they are not interchangeable:
 *
 *   - `app/global-not-found.tsx` - no route matched at all. Renders its own
 *     document, because it bypasses layouts entirely.
 *   - `app/(site)/not-found.tsx` - a segment matched and called `notFound()` -
 *     an unpublished machine, a guide that was withdrawn - so the site layout
 *     is present and the visitor keeps the header and footer.
 *
 * The body lives here so those two cannot drift into two different 404s.
 *
 * Deliberately a set of routes rather than an apology: most 404s here will be
 * a stale link to a machine that has been sold or renamed, and the useful
 * response is the catalogue, not sympathy.
 */
export function NotFoundBody() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col justify-center px-5 py-20">
      <span className="serial text-ink-muted">404</span>
      <h1 className="mt-3 text-heading md:text-display-sm">
        Тази страница я няма
      </h1>
      <p className="mt-4 max-w-lg text-ui leading-relaxed text-ink-muted">
        Възможно е машината да е отдадена или адресът да е сгрешен. Каталогът е
        по-долу - всяка машина в него е реална и с публикувана цена.
      </p>

      <nav aria-label="Категории" className="mt-8">
        <h2 className="plate text-micro text-ink-muted">Каталог</h2>
        <ul className="mt-3 grid gap-px border border-line-strong bg-line-strong sm:grid-cols-2">
          {(
            Object.keys(CATEGORY_LABELS) as (keyof typeof CATEGORY_LABELS)[]
          ).map((key) => (
            <li key={key} className="bg-paper-raised">
              <Link
                href={routes.category(key)}
                className="block px-5 py-4 text-ui hover-fine:bg-paper-sunken"
              >
                {CATEGORY_LABELS[key]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-ui text-ink-muted">
        {PRIMARY_NAV.filter(
          (i) => !i.href.includes("-pod-naem") && !i.href.includes("studeni"),
        ).map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="underline-offset-4 hover-fine:underline"
            >
              {item.label}
            </Link>
          </li>
        ))}
        <li>
          <Link
            href={routes.home}
            className="underline-offset-4 hover-fine:underline"
          >
            Начало
          </Link>
        </li>
      </ul>
    </div>
  );
}
