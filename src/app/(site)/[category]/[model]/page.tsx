import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { StockLabel } from "@/components/catalogue/status-badge";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { ModelGallery } from "@/components/catalogue/model-gallery";
import { SpecTable } from "@/components/catalogue/spec-table";
import { RentCalculator } from "@/components/tools/rent-calculator";
import { ModelCard } from "@/components/catalogue/model-card";
import { toCardData } from "@/lib/card-data";
import {
  COMBO_BASE_NAME,
  MODELS,
  coffeeUnitOf,
  modelBySlug,
} from "@/content/models";
import { alternativesWithOverrides } from "@/engine/alternatives";
import { loadCatalogue } from "@/server/catalogue";
import { fromMonthly, quoteAllTerms, reductionLabel, INCLUDED_IN_RENT } from "@/engine/quote";
import {
  AVAILABILITY_LABEL,
  CATEGORY_LABEL,
  CATEGORY_UNIT_LABEL,
  CONDITION_STATEMENT,
  VENUE_LABEL,
} from "@/content/taxonomy";
import { CATEGORY_SLUGS, routes, type CategoryKey } from "@/lib/routes";
import { JsonLd } from "@/components/seo/json-ld";
import {
  breadcrumbJsonLd,
  fittingTitle,
  modelJsonLd,
  pageMetadata,
} from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return MODELS.map((m) => ({
    category: CATEGORY_SLUGS[m.category as CategoryKey],
    model: m.slug,
  }));
}

export async function generateMetadata(
  props: PageProps<"/[category]/[model]">,
): Promise<Metadata> {
  const { model: slug } = await props.params;
  const model = modelBySlug(slug);
  if (!model) return {};

  const from = fromMonthly(await loadCatalogue(), model.id);

  /**
   * The category term leads, not the model name.
   *
   * All 21 catalogue model names return zero measurable Bulgarian search volume
   * (D24a), while `кафе автомат под наем` and its siblings do have demand. The
   * name stays in the title for the visitor who is looking at this exact
   * machine - it is just no longer carrying the search weight it cannot bear.
   *
   * Two variants, longest-that-fits. The full form carries the category term,
   * but names run from "Necta Astro" to "Necta Concerto Touch + Melodia", and
   * on the long ones the full form reached 75 characters - so the keyword would
   * have been truncated away on exactly the pages that needed it most.
   */
  const unit = CATEGORY_UNIT_LABEL[model.category].one;
  const title = fittingTitle([
    `${model.name} — ${unit} под наем от ${from} €/месец`,
    `${model.name} под наем — от ${from} €/месец`,
  ]);

  /**
   * A description has to be unique per page and long enough to be worth
   * showing. Neither was true: the combination machines all shared one
   * generated intro verbatim, and several model intros are a single short
   * clause - one was 20 characters.
   *
   * The combos now carry their own written intros, so there is nothing left to
   * generate for them.
   */
  const base = model.intro ?? "";

  /* Kept terse so that even a 69-character intro plus this stays inside the
     ~160 characters Google will render. */
  const description =
    [...base].length >= 70
      ? base
      : `${base} ${model.name} под наем. Доставка, монтаж и сервиз включени. От ${from} €/месец.`.trim();

  return pageMetadata({
    path: routes.model(model.category as CategoryKey, model.slug),
    title,
    description,
    /* The machine itself, which is the whole point of sharing the page. With
       no photograph yet, falling through to the generated brand card beats
       sharing a placeholder drawing of a machine. */
    image: model.photos[0]?.src,
    /* Already long; the brand suffix would only be truncated. */
    brandSuffix: false,
  });
}

export default async function ModelPage(props: PageProps<"/[category]/[model]">) {
  const { category: categorySlug, model: slug } = await props.params;
  const model = modelBySlug(slug);

  if (!model || CATEGORY_SLUGS[model.category as CategoryKey] !== categorySlug) {
    notFound();
  }

  const catalogue = await loadCatalogue();

  /**
   * An unpublished machine 404s rather than disappearing quietly.
   *
   * `generateStaticParams` still emits every model, and deliberately so: with
   * `dynamicParams = false`, a param dropped here could never come back when the
   * client republishes the machine - the route would simply not exist. So the
   * page is always built and refuses to render instead, which is a state
   * `revalidatePath` can undo.
   */
  if (!catalogue.isPublished(model.id)) notFound();

  const from = fromMonthly(catalogue, model.id);
  const coffeeUnit = coffeeUnitOf(model);
  /* Asked for six and cut to three AFTER dropping the unpublished ones. Filtering
     a list of three would leave one alternative on a page that has room for
     three, which reads as a thin catalogue rather than as a hidden machine. */
  const alternatives = alternativesWithOverrides(model, { limit: 6 })
    .filter((alt) => catalogue.isPublished(alt.id))
    .slice(0, 3);

  return (
    <>
      <JsonLd data={modelJsonLd(model.id, catalogue)} />
      {/* Mirrors the visible trail below, built from the same `routes` helpers
          so the two can never describe different hierarchies. */}
      <JsonLd
        data={breadcrumbJsonLd([
          ["Начало", routes.home],
          [
            CATEGORY_LABEL[model.category],
            routes.category(model.category as CategoryKey),
          ],
          [model.name, routes.model(model.category as CategoryKey, model.slug)],
        ])}
      />
      <Container className="py-4">
        <nav
          aria-label="Пътека"
          className="serial flex flex-wrap items-center gap-1.5 text-ink-muted"
        >
          <Link href={routes.home} className="hover-fine:text-graphite">
            Начало
          </Link>
          <ChevronRight className="h-3 w-3" aria-hidden />
          <Link
            href={routes.category(model.category as CategoryKey)}
            className="hover-fine:text-graphite"
          >
            {CATEGORY_LABEL[model.category]}
          </Link>
          <ChevronRight className="h-3 w-3" aria-hidden />
          <span className="text-graphite">{model.name}</span>
        </nav>
      </Container>

      <Container className="grid gap-8 pb-14 lg:grid-cols-[1fr_1fr] lg:items-start">
        <ModelGallery
          photos={model.photos}
          category={model.category}
          name={model.name}
          shape={model.spec}
          className="h-[440px]"
        />

        <div>
          <span className="serial text-ink-muted">{model.manufacturer}</span>
          <h1 className="mt-2 text-[32px] leading-[1.08] md:text-[42px]">
            {model.name}
          </h1>

          {model.currentName && (
            <p className="mt-3 max-w-[58ch] text-[13px] leading-6 text-ink-muted">
              Производителят преименува гамата - днес този модел се предлага като{" "}
              {model.currentName}. Машините в склада са с оригиналното име.
            </p>
          )}

          {model.intro && (
            <p className="mt-4 max-w-[58ch] text-[15px] leading-7 text-ink-muted">
              {model.intro}
            </p>
          )}

          <div className="mt-5 flex items-end gap-3 border-y border-line py-4">
            <span className="serial pb-1.5 text-ink-muted">от</span>
            <span className="tabular font-display text-[44px] leading-none">
              {from} €
            </span>
            <span className="pb-1.5 text-[13px] text-ink-muted">/месец</span>
            <span className="ml-auto pb-1.5">
              <StockLabel tone="available" className="text-[13px]">
                {AVAILABILITY_LABEL}
              </StockLabel>
            </span>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href={routes.enquiry}>Изпрати запитване</ButtonLink>
            <ButtonLink href={routes.recommender} variant="outline">
              Подходяща ли е за мен?
            </ButtonLink>
          </div>

          {model.recommendation.venueTypes.length > 0 && (
            <div className="mt-8">
              <h2 className="plate text-[11px] text-ink-muted">Подходяща за</h2>
              <ul className="mt-2.5 flex flex-wrap gap-2">
                {model.recommendation.venueTypes.map((venue) => (
                  <li
                    key={venue}
                    className="border border-line bg-paper-raised px-2.5 py-1.5 text-[12px] text-graphite"
                  >
                    {VENUE_LABEL[venue]}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Container>

      <RentCalculator
        quotes={quoteAllTerms(catalogue, model.id).map((q) => ({
          term: q.term,
          monthlyEur: q.monthlyEur,
          dailyEur: q.dailyEur,
          totalEur: q.totalEur,
          reductionLabel: reductionLabel(q),
        }))}
        included={INCLUDED_IN_RENT}
      />

      {/* Where the per-unit stock list used to be (D50). One statement about
          how the machine arrives, and the enquiry that confirms it - rather
          than a grid of warehouse codes nobody was going to keep current. */}
      <section className="paper-grain border-y border-line">
        <Container className="py-14">
          <h2 className="text-[26px] md:text-[32px]">Наличност</h2>
          <div className="mt-6 max-w-xl">
            <StockLabel tone="available" className="text-[14px]">
              {AVAILABILITY_LABEL}
            </StockLabel>
            <p className="mt-3 text-[15px] leading-7 text-ink-muted">
              {CONDITION_STATEMENT[model.condition]}
            </p>
            <div className="mt-6">
              <ButtonLink href={`${routes.enquiry}?model=${model.slug}`}>
                Запитване за тази машина
              </ButtonLink>
            </div>
            <p className="mt-4 text-[13px] leading-6 text-ink-subtle">
              Запитването не е автоматична резервация. Потвърждаваме до един
              работен час. Годината на производство и историята на конкретния
              апарат се предоставят при запитване.
            </p>
          </div>
        </Container>
      </section>

      <section className="bg-paper">
        <Container className="py-14">
          <h2 className="text-[26px] md:text-[32px]">
            Технически характеристики
          </h2>

          {coffeeUnit && (
            <p className="mt-4 max-w-2xl border-l-2 border-line-strong pl-3 text-[13px] leading-6 text-ink-muted">
              Една машина в два етажа:{" "}
              <Link
                href={routes.model(
                  coffeeUnit.category as CategoryKey,
                  coffeeUnit.slug,
                )}
                className="underline underline-offset-2 hover-fine:text-graphite"
              >
                {coffeeUnit.name}
              </Link>{" "}
              върху снакс корпус {COMBO_BASE_NAME}. Височината и теглото по-долу
              са сборът на двете, а ширината и дълбочината са на по-големия
              корпус. Капацитетът се отнася за снакс частта.
            </p>
          )}

          <div className="mt-6">
            <SpecTable spec={model.spec} />
          </div>

          <p className="mt-4 max-w-3xl text-[12px] leading-5 text-ink-muted">
            Тази машина е спряна от производство и производителят е свалил
            страницата ѝ. Данните идват от архивни сервизни ръководства
            {model.specSource ? ` (${model.specSource})` : ""}. Липсващото можем
            да измерим по конкретния апарат преди доставка.
          </p>
        </Container>
      </section>

      {alternatives.length > 0 && (
        <section className="border-t border-line bg-paper-sunken">
          <Container className="py-14">
            <h2 className="text-[24px] md:text-[30px]">Подходяща алтернатива</h2>
            <p className="mt-2 text-[14px] text-ink-muted">
              Машини с близък капацитет и размери.
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {alternatives.map((alt) => (
                <ModelCard key={alt.id} data={toCardData(alt, catalogue)} />
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
