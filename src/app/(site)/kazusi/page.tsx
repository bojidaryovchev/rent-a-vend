import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { Eyebrow } from "@/components/ui/bits";
import { ButtonLink } from "@/components/ui/button";
import { CASE_STUDIES, type CaseStudy } from "@/content/case-studies";
import { modelBySlug } from "@/content/models";
import { routes, type CategoryKey } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  path: routes.caseStudies,
  title: "Реализирани проекти",
  description:
    "Реални обекти, реални машини, реални резултати. Публикуваме само проекти, за които имаме съгласие от клиента.",
});

/**
 * Grows one real project at a time.
 *
 * An invented case study is misleading advertising, and PRODUCT.md prohibits it
 * outright - so this page shipped empty and said why. It now carries the
 * projects that exist and nothing else, in the same three columns the empty
 * state sketched: the problem, the machine, what changed.
 *
 * The page enters the sitemap only while `CASE_STUDIES` is non-empty; see
 * `sitemapEntries`.
 */

const COLUMNS: [string, (c: CaseStudy) => string][] = [
  ["Проблемът", (c) => c.problem],
  ["Решението", (c) => c.solution],
  ["Резултатът", (c) => c.result],
];

function CaseStudyPanel({ study, index }: { study: CaseStudy; index: number }) {
  const model = study.modelSlug ? modelBySlug(study.modelSlug) : undefined;

  return (
    <article id={study.slug} className="bay-panel riveted p-8 pt-10 md:p-12">
      <div className="flex items-baseline gap-3">
        <span aria-hidden className="serial text-line-strong">
          {String(index).padStart(2, "0")}
        </span>
        <h2 className="engraved text-[22px] leading-tight md:text-[26px]">
          {study.title}
        </h2>
      </div>

      {study.venue && (
        <p className="mt-2 text-[13px] leading-6 text-ink-muted">
          {study.venue}
        </p>
      )}

      {/* The three columns the empty state promised. They stack on mobile, so
          each one carries its own label rather than relying on a table head. */}
      <div className="mt-7 grid gap-px border border-line-strong bg-line-strong sm:grid-cols-3">
        {COLUMNS.map(([label, field]) => (
          <div key={label} className="bg-paper-sunken p-5">
            <h3 className="plate text-[11px] text-graphite">{label}</h3>
            <p className="mt-3 text-[14px] leading-6 text-graphite">
              {field(study)}
            </p>
          </div>
        ))}
      </div>

      {/* Not every project is about a machine: the ten-machine site was about
          who operates them, and the line simply does not render there. */}
      {study.machine && (
        <p className="mt-6 text-[13px] leading-6 text-ink-muted">
          <span className="plate text-[11px] text-graphite">Машината</span>{" "}
          {model ? (
            <Link
              href={routes.model(model.category as CategoryKey, model.slug)}
              className="text-graphite underline-offset-4 hover-fine:underline"
            >
              {study.machine}
            </Link>
          ) : (
            <span className="text-graphite">{study.machine}</span>
          )}
          {study.machineNote && <> - {study.machineNote}</>}
        </p>
      )}
    </article>
  );
}

export default function CaseStudiesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Казуси"
        title="Реализирани проекти"
        lead="Реални обекти с реални машини. Публикуваме проект само със съгласието на клиента, дори когато не споменаваме името му."
      />

      <section className="paper-grain">
        <Container className="py-14 md:py-20">
          <div className="mx-auto flex max-w-3xl flex-col gap-8">
            {CASE_STUDIES.map((study, i) => (
              <CaseStudyPanel key={study.slug} study={study} index={i + 1} />
            ))}

            {/* Closing panel. It used to be the empty state and argued at
                length why the page carried nothing; the projects landed, and an
                argument for an absence that is no longer there reads as a page
                apologising for itself. What survives is the part a reader can
                act on: a first-hand opinion is available for the asking. */}
            <div className="bay-panel riveted p-8 pt-10 md:p-12">
              <Eyebrow>Референции</Eyebrow>

              <p className="mt-5 text-[14px] leading-7 text-graphite">
                Ако искате мнение от първо лице, ще ви свържем с клиент, който е
                приел да говори за опита си. Списъкът тук расте с всеки проект,
                за който получим съгласие да бъде описан.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <ButtonLink href={routes.enquiry}>
                  Поискай мнение от клиент
                </ButtonLink>
                <ButtonLink href={routes.category("coffee")} variant="outline">
                  Виж машините
                </ButtonLink>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
