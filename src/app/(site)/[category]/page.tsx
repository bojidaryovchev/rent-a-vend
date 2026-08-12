import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/bits";
import { CatalogueGrid } from "@/components/catalogue/catalogue-grid";
import { toCardData } from "@/lib/card-data";
import { CATEGORY_LABEL, type Category } from "@/content/taxonomy";
import { CATEGORY_SLUGS, routes, type CategoryKey } from "@/lib/routes";
import type { Catalogue } from "@/engine/catalogue";
import { loadCatalogue } from "@/server/catalogue";
import { fromMonthly } from "@/engine/quote";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, categoryJsonLd, pageMetadata } from "@/lib/seo";

/**
 * Category listing.
 *
 * Only the four catalogue slugs generate; anything else 404s rather than being
 * swallowed by this dynamic segment. Static routes such as /za-nas take
 * precedence over it.
 */

export const dynamicParams = false;

const SLUG_TO_CATEGORY = Object.fromEntries(
  Object.entries(CATEGORY_SLUGS).map(([key, slug]) => [slug, key as Category]),
) as Record<string, Category>;

const INTRO: Record<Category, string> = {
  coffee:
    "Машини за кафе и топли напитки под наем. Реални апарати от нашия склад, изцяло рециклирани, с месечна цена на всеки модел.",
  snack:
    "Автомати за снаксове, пакетирани стоки и храна. Изцяло рециклирани и проверени преди доставка.",
  combo:
    "Една машина в два етажа: кафе машина върху снакс шкаф. Топли напитки, снаксове, кутии и бутилки от един корпус - за обект, в който няма място за две машини.",
  cold:
    "Автомати за студени напитки в кутии и бутилки, с асансьорна доставка.",
};

export function generateStaticParams() {
  return Object.values(CATEGORY_SLUGS).map((category) => ({ category }));
}

/** Cheapest headline rent in a category, for the title's price anchor. */
function fromPrice(catalogue: Catalogue, category: Category): number {
  return Math.min(
    ...catalogue.byCategory(category).map((m) => fromMonthly(catalogue, m.id)),
  );
}

export async function generateMetadata(
  props: PageProps<"/[category]">,
): Promise<Metadata> {
  const { category: slug } = await props.params;
  const category = SLUG_TO_CATEGORY[slug];
  if (!category) return {};

  const catalogue = await loadCatalogue();
  const models = catalogue.byCategory(category);
  if (models.length === 0) return {};

  /**
   * The price belongs in the title, not just on the page.
   *
   * Not one of the six Bulgarian competitors reviewed publishes a price
   * anywhere, so a figure in the SERP is the cheapest available differentiator
   * - it does the work before the click rather than after it.
   */
  return pageMetadata({
    path: routes.category(category),
    title: `${CATEGORY_LABEL[category]} под наем — от ${fromPrice(catalogue, category)} €/месец`,
    description: `${INTRO[category]} ${models.length} модела с публикувана цена.`,
    /* "Автомати за студени напитки под наем — от 60 €/месец" is already 51
       characters. The suffix would take it to 71 and be truncated away. */
    brandSuffix: false,
  });
}

export default async function CategoryPage(props: PageProps<"/[category]">) {
  const { category: slug } = await props.params;
  const category = SLUG_TO_CATEGORY[slug];
  if (!category) notFound();

  const catalogue = await loadCatalogue();
  const models = catalogue.byCategory(category);

  /**
   * A category with nothing published in it 404s.
   *
   * The alternative is a heading, an intro and an empty grid - thin content on
   * the pages D23a names as the site's entire SEO surface. It also protects the
   * price anchor below: `Math.min` of no models is `Infinity`, and "от Infinity
   * €/месец" would be in the page title.
   */
  if (models.length === 0) notFound();

  const cards = models.map((m) => toCardData(m, catalogue));
  const fromEur = Math.min(...cards.map((c) => c.fromEur));

  return (
    <>
      <JsonLd data={categoryJsonLd(category as CategoryKey, models)} />
      <JsonLd
        data={breadcrumbJsonLd([
          ["Начало", routes.home],
          [CATEGORY_LABEL[category], routes.category(category as CategoryKey)],
        ])}
      />
      <section className="steel border-b border-graphite-edge">
        <Container className="py-12 md:py-16">
          <Eyebrow tone="light">Каталог</Eyebrow>
          <h1 className="mt-4 max-w-3xl text-[32px] leading-[1.08] text-paper md:text-[46px]">
            {CATEGORY_LABEL[category]} под наем
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-7 text-paper/70">
            {INTRO[category]}
          </p>
          {/* Stamped counts rather than sentences: these are readings, and
              reading them should feel like reading a gauge. */}
          <p className="tabular mt-6 flex flex-wrap items-center gap-3 text-[12px] text-paper/75">
            <span className="border border-paper/25 px-2 py-1">
              {models.length} модела
            </span>
            <span className="border border-paper/25 px-2 py-1">
              от {fromEur} €/месец
            </span>
          </p>
        </Container>
      </section>

      <section className="paper-grain">
        <Container className="py-10 md:py-14">
          <CatalogueGrid models={cards} />

          {/* Both sit on real commercial intent and neither is reachable from
              a grid of cards. The pricing page answers `вендинг машина цена`;
              the comparison catches the visitor still deciding whether to buy
              at all, which is where most of this market's search volume is. */}
          <p className="mt-10 border-t border-line pt-6 text-[14px] leading-7 text-ink-muted">
            Как формираме месечната цена и какво влиза в нея - вижте{" "}
            <Link href={routes.pricing} className="underline-offset-4 hover-fine:underline">
              цени
            </Link>
            . Ако още се колебаете дали да наемете или да купите,{" "}
            <Link
              href={routes.buyVsRent}
              className="underline-offset-4 hover-fine:underline"
            >
              сравнете двете
            </Link>
            .
          </p>
        </Container>
      </section>
    </>
  );
}
