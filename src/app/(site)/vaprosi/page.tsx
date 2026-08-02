import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button";
import { FAQ, FAQ_GROUPS, type FaqItem } from "@/content/faq";
import { routes } from "@/lib/routes";
import { JsonLd } from "@/components/seo/json-ld";
import { faqJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  path: routes.faq,
  title: "Често задавани въпроси",
  description:
    "Какво включва наемът, кой плаща ремонта, кой застрахова машината, кой отговаря за регистрацията в БАБХ и за колко време реагираме при повреда.",
});

const GROUP_ORDER: FaqItem["group"][] = [
  "rent",
  "service",
  "contract",
  "practical",
];

export default function FaqPage() {
  return (
    <>
      <JsonLd data={faqJsonLd()} />
      <PageHeader
        eyebrow="Въпроси"
        title="Често задавани въпроси"
        lead="Отговорите тук са същите, които ще получите и по телефона. Ако нещо липсва, обадете се."
      />

      <section className="paper-grain">
        <Container className="py-14 md:py-20">
          {/* Section label rides in a left rail on wide screens and stacks above
              its answers on narrow ones. A sticky sidebar beside a long list
              pushed the fold deep and left the first viewport mostly empty. */}
          <div className="space-y-10">
            {GROUP_ORDER.map((group, si) => {
              const items = FAQ.filter((f) => f.group === group);
              if (!items.length) return null;

              return (
                <div
                  key={group}
                  id={group}
                  className="grid gap-6 lg:grid-cols-[220px_1fr] lg:items-start"
                >
                  <h2 className="plate flex items-baseline gap-3 text-[12px] text-graphite">
                    <span aria-hidden className="serial text-line-strong">
                      {String(si + 1).padStart(2, "0")}
                    </span>
                    {FAQ_GROUPS[group]}
                  </h2>

                  <div className="bay-panel divide-y divide-line">
                    {items.map((item) => (
                      <details key={item.question} className="group px-5 py-4">
                        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium text-graphite">
                          {item.question}
                          <span aria-hidden className="serial text-line-strong group-open:hidden">
                            +
                          </span>
                          <span aria-hidden className="serial hidden text-line-strong group-open:inline">
                            −
                          </span>
                        </summary>
                        <p className="mt-3 max-w-2xl text-[14px] leading-7 text-ink-muted">
                          {item.answer}
                        </p>
                      </details>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bay-panel-dark riveted mt-14 flex flex-wrap items-center justify-between gap-6 p-7 pt-9">
            <div>
              <h2 className="text-[24px] text-paper">Не намерихте отговор?</h2>
              <p className="mt-2 text-[14px] text-paper/70">
                Попитайте директно. Отговаряме до един работен час.
              </p>
            </div>
            <ButtonLink href={routes.enquiry}>Изпрати въпрос</ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}
