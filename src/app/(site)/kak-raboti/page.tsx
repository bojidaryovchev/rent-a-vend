import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { ExcludedMark, IncludedMark } from "@/components/ui/bits";
import { ButtonLink } from "@/components/ui/button";
import { INCLUDED_IN_RENT } from "@/engine/quote";
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  path: routes.howItWorks,
  title: "Как протича наемът",
  description:
    "Четири стъпки от избора до работеща машина: избор, оферта, договор, доставка и монтаж. Какво включва наемът и какво остава ваша грижа.",
});

const STEPS: [string, string][] = [
  [
    "Избор",
    "Избирате машина от каталога или отговаряте на няколко въпроса и ние предлагаме подходяща. Виждате месечната цена веднага.",
  ],
  [
    "Оферта",
    "Изпращате запитване. Проверяваме фирмата и връщаме решение до 24 часа, с конкретна машина, срок и цена.",
  ],
  [
    "Договор",
    "Подписва се на място или дистанционно. Срокът е от 12 до 60 месеца, с възможност за изкупуване в края.",
  ],
  [
    "Доставка и монтаж",
    "Наш техник доставя, монтира, настройва и обучава екипа ви. При налична машина - 2 до 5 работни дни.",
  ],
];

/**
 * What the customer carries, stated plainly rather than buried in the contract.
 *
 * The БАБХ line is the one that matters: if they stock the machine and sell from
 * it, they become a food business, which is a real cost and a real obligation.
 * Competitors stay quiet about it; saying it before the signature is the whole
 * transparency argument in one bullet.
 */
const YOURS = [
  "продуктите - кафе, снаксове, напитки",
  "зареждането на машината",
  "повреди от неправилна употреба или външна намеса",
  "регистрацията в БАБХ, ако продавате продукти чрез машината",
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHeader
        eyebrow="Наемът"
        title="Как протича наемът"
        lead="Четири стъпки от избора до работеща машина. Без първоначална инвестиция и без изненади в средата."
      />

      <section className="paper-grain">
        <Container className="py-14 md:py-20">
          <ol className="grid gap-px border border-line-strong bg-line-strong md:grid-cols-2">
            {STEPS.map(([title, body], i) => (
              <li key={title} className="relative bg-paper-raised p-7 md:p-9">
                <span className="font-display text-[44px] leading-none text-line">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="plate mt-3 text-[14px] text-graphite">{title}</h2>
                <p className="mt-3 max-w-md text-[14px] leading-6 text-ink-muted">
                  {body}
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="bay-panel riveted p-6 pt-8">
              <h2 className="plate text-[12px] text-graphite">
                Какво влиза в наема
              </h2>
              <ul className="mt-4 space-y-2 text-[14px] leading-6 text-graphite">
                {INCLUDED_IN_RENT.map((x) => (
                  <li
                    key={x}
                    className="flex items-start gap-2.5 border-b border-line pb-2 last:border-0"
                  >
                    <IncludedMark className="mt-1.5 text-graphite" />
                    {x}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bay-panel-dark riveted p-6 pt-8">
              <h2 className="plate text-[12px] text-accent">
                Какво остава ваша грижа
              </h2>
              <ul className="mt-4 space-y-2 text-[14px] leading-6 text-paper/85">
                {YOURS.map((x) => (
                  <li
                    key={x}
                    className="flex items-start gap-2.5 border-b border-paper/12 pb-2 last:border-0"
                  >
                    <ExcludedMark className="mt-1.5 text-paper/75" />
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="mt-8 max-w-3xl border-l-2 border-accent pl-4 text-[14px] leading-7 text-graphite">
            Ако предпочитате да не се занимавате със зареждане, можем да поемем и
            него - изготвя се отделна оферта. А за БАБХ даваме информацията и
            съдействието, което ви трябва:{" "}
            <Link
              href={routes.guide("registratsiya-babh")}
              className="underline-offset-4 hover-fine:underline"
            >
              какво изисква регистрацията
            </Link>
            .
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href={routes.enquiry}>Изпрати запитване</ButtonLink>
            <ButtonLink href={routes.recommender} variant="outline">
              Коя машина ми трябва?
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}
