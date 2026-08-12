import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { EnquiryForm, type CarriedContext } from "@/components/forms/enquiry-form";
import { modelBySlug } from "@/content/models";
import { loadCatalogue } from "@/server/catalogue";
import { fromMonthly } from "@/engine/quote";
import { company } from "@/lib/company";
import { pageMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";

/**
 * `noindex, follow`, not a robots.txt block.
 *
 * The form takes prefilled machine and term parameters, so its URLs vary and
 * none of them should rank - but it is linked from every model page, and a
 * `Disallow` would stop the crawl before those links were ever read, stranding
 * their equity. Meta noindex keeps the page out of the index while letting the
 * crawl flow on through it.
 */
export const metadata: Metadata = pageMetadata({
  path: routes.enquiry,
  title: "Запитване за наем",
  description:
    "Оставете контакт и ще изготвим оферта за вендинг машина под наем. Отговаряме до един работен час.",
  index: false,
});

export default async function EnquiryPage(props: PageProps<"/zapitvane">) {
  const params = await props.searchParams;
  const catalogue = await loadCatalogue();

  const first = (v: string | string[] | undefined): string | undefined =>
    Array.isArray(v) ? v[0] : v;

  const termRaw = first(params.term);
  const term = termRaw ? Number(termRaw) : undefined;

  // The model is the whole carried context now. A `?unit=` parameter used to
  // name one physical machine by its warehouse code; with the stock list gone
  // (D50) there is nothing to resolve it against, and an unrecognised code
  // would silently drop the visitor's context rather than carry it.
  const modelSlug = first(params.model);
  const model = modelSlug ? modelBySlug(modelSlug) : undefined;

  // The recommender proposes a plan of several machines. Only one of them can
  // be the carried model, so the plan itself rides along as a summary rather
  // than being silently reduced to its first line.
  const summary = first(params.summary)?.slice(0, 1000);

  const context: CarriedContext = {
    modelSlug: model?.slug,
    modelName: model?.name,
    monthlyEur: model ? fromMonthly(catalogue, model.id) : undefined,
    term: Number.isFinite(term) ? term : undefined,
    recommenderSummary: summary,
    source: summary
      ? "recommender"
      : model
        ? "model"
        : term
          ? "calculator"
          : "direct",
  };

  return (
    <>
      <PageHeader
        eyebrow="Запитване"
        title="Запитване за наем"
        lead="Четири полета. Всичко останало, което сте избрали, идва с вас автоматично."
      >
        <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-paper/70">
          <span className="serial border border-accent/50 px-2 py-1 text-accent">
            {company.responsePromise}
          </span>
          <span>{company.workingHours}</span>
        </p>
      </PageHeader>

      <section className="paper-grain">
        <Container className="max-w-3xl py-12 md:py-16">
          <div className="bay-panel riveted p-6 pt-8 md:p-10 md:pt-11">
            <EnquiryForm context={context} />
          </div>
        </Container>
      </section>
    </>
  );
}
