import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  path: routes.caseStudies,
  title: "Реализирани проекти",
  description:
    "Реални обекти, реални машини, реални резултати. Публикуваме само проекти, за които имаме съгласие от клиента.",
});

/**
 * Deliberately empty, and it says why.
 *
 * An invented case study is misleading advertising, and PRODUCT.md prohibits it
 * outright. A page that explains its own emptiness is more persuasive than five
 * fabricated projects, because it demonstrates the standard the rest of the site
 * claims to hold itself to.
 *
 * Excluded from the sitemap while it has no content.
 */
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
          <div className="bay-panel riveted mx-auto max-w-3xl p-8 pt-10 md:p-12">
            <span className="stencil text-[10px] text-status-reserved">
              Тази секция още се подготвя
            </span>

            <p className="mt-5 text-[15px] leading-8 text-graphite">
              Тук ще опишем конкретни обекти: какъв е бил проблемът, коя машина е
              избрана, защо точно тя и какъв е резултатът.
            </p>

            <p className="mt-4 text-[14px] leading-7 text-ink-muted">
              Оставяме страницата празна, вместо да я запълним с примери.
              Измислен казус се усеща, а описание на несъществуващ клиент е
              подвеждаща реклама. По-добре два истински проекта, отколкото пет
              съчинени.
            </p>

            {/* The shape the real thing will take, shown empty. */}
            <div className="mt-8 grid gap-px border border-line-strong bg-line-strong sm:grid-cols-3">
              {["Проблемът", "Решението", "Резултатът"].map((t) => (
                <div key={t} className="bg-paper-sunken p-5">
                  <span className="plate text-[11px] text-line-strong">{t}</span>
                </div>
              ))}
            </div>

            <p className="mt-8 text-[14px] leading-7 text-graphite">
              Междувременно можем да ви свържем с клиент, който е съгласен да
              говори за опита си. Попитайте.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href={routes.enquiry}>Поискай препоръка</ButtonLink>
              <ButtonLink href={routes.category("coffee")} variant="outline">
                Виж машините
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
