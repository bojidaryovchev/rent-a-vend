import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { ExcludedMark, IncludedMark } from "@/components/ui/bits";
import { ButtonLink } from "@/components/ui/button";
import { modelsByCategory } from "@/content/models";
import { CATEGORIES, CATEGORY_LABEL, type Category } from "@/content/taxonomy";
import { fromMonthly, INCLUDED_IN_RENT } from "@/engine/quote";
import { routes, type CategoryKey } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";

/**
 * The pricing page.
 *
 * Answers `вендинг машина цена` - 260/mo at KD 4, the strongest commercial term
 * measured in this market. It exists because the one thing every Bulgarian
 * competitor refuses to do is publish a number: six sites reviewed, zero
 * prices, phone-first for all of them. A page that answers the question
 * directly is the cheapest differentiator available.
 *
 * It also carries the answer to the free-machine offer (open item O14), which
 * is the largest commercial threat found and appears nowhere else on the site.
 */
export const metadata: Metadata = pageMetadata({
  path: routes.pricing,
  title: "Вендинг машина под наем — цена на месец",
  description:
    "Колко струва вендинг машина под наем: месечна цена по категории, какво влиза в нея, какво остава ваша грижа и защо „безплатна машина“ обикновено излиза по-скъпо.",
});

/** Cheapest headline rent in a category, computed rather than written down. */
function fromPrice(category: Category): number {
  return Math.min(...modelsByCategory(category).map((m) => fromMonthly(m.id)));
}

/**
 * What deliberately is not on this page, and why.
 *
 * D10 keeps deposits and volume discounts out of the published figures because
 * both depend on an assessment of the specific customer. Saying so is better
 * than leaving a visitor to discover it in the offer.
 */
const AFTER_ASSESSMENT = [
  "депозит - определя се след проверка на фирмата, а за утвърдени клиенти може да отпадне",
  "отстъпка при повече машини - зависи от броя и срока",
  "доставка до по-отдалечен обект - влиза в офертата, не в месечната цена",
  "зареждане с продукти, ако решите да го поемем ние",
];

export default function PricingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Цени"
        title="Колко струва вендинг машина под наем"
        lead="Месечна цена за всяка машина, публикувана предварително. Цените са в евро, без ДДС, и са ориентировъчни до изготвяне на оферта."
      />

      <section className="paper-grain">
        <Container className="py-14 md:py-20">
          <h2 className="text-[26px] md:text-[32px]">Цена по категории</h2>
          <p className="mt-2 max-w-2xl text-[14px] leading-6 text-ink-muted">
            Всяка машина в каталога носи собствена месечна цена. По-долу е
            най-ниската в съответната категория.
          </p>

          <ul className="mt-8 grid gap-px border border-line-strong bg-line-strong sm:grid-cols-2">
            {CATEGORIES.map((category) => (
              <li key={category} className="bg-paper-raised p-6 md:p-8">
                <Link
                  href={routes.category(category as CategoryKey)}
                  className="group block"
                >
                  <h3 className="plate text-[13px] text-graphite">
                    {CATEGORY_LABEL[category]}
                  </h3>
                  <p className="mt-3 flex items-end gap-2">
                    <span className="serial pb-1.5 text-ink-muted">от</span>
                    <span className="tabular font-display text-[38px] leading-none">
                      {fromPrice(category)} €
                    </span>
                    <span className="pb-1.5 text-[13px] text-ink-muted">
                      /месец
                    </span>
                  </p>
                  <p className="mt-3 text-[13px] leading-6 text-ink-muted">
                    {modelsByCategory(category).length} модела · вижте цената на
                    всяка машина
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          {/* Per-day framing. A monthly figure is a commitment; a daily one is
              a comparison against a cup of coffee, which is the honest scale. */}
          <p className="mt-8 max-w-3xl border-l-2 border-accent pl-4 text-[14px] leading-7 text-graphite">
            На страницата на всяка машина месечната цена е разбита и на цена на
            ден - обикновено по-малко от едно кафе от същата машина.
          </p>
        </Container>
      </section>

      <section className="border-y border-line bg-paper">
        <Container className="py-14 md:py-20">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bay-panel riveted p-6 pt-8">
              <h2 className="plate text-[12px] text-graphite">
                Какво влиза в месечната цена
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
                Какво се определя след оценка
              </h2>
              <ul className="mt-4 space-y-2 text-[14px] leading-6 text-paper/85">
                {AFTER_ASSESSMENT.map((x) => (
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
        </Container>
      </section>

      <section className="paper-grain">
        <Container className="py-14 md:py-20">
          <h2 className="text-[26px] md:text-[32px]">Срокът мени вноската</h2>
          {/* D27: a longer term is a lower instalment and a higher total. It is
              never a "saving", and saying so would be false under Directive
              2006/114/EC on misleading B2B advertising. Both numbers, always. */}
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-ink-muted">
            Договорът е от 12 до 60 месеца. По-дългият срок означава по-ниска
            месечна вноска, но по-висока обща сума за целия период. Показваме и
            двете числа на всяка машина, за да ги сравните сами - защото едното
            без другото не е сравнение.
          </p>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-ink-muted">
            В края на срока машината може да бъде изкупена по предварително
            определена остатъчна стойност, записана в договора.
          </p>
        </Container>
      </section>

      {/*
        O14 - the free-machine answer.

        Eleven Bulgarian companies offer a machine at no monthly cost against a
        minimum consumables order. A visitor arriving from "безплатна
        кафемашина" needs the difference stated, not implied. The argument is
        the one Italian buyers already use to separate noleggio from comodato
        d'uso: a rental carries no obligation to buy product from the supplier.
        Nobody in Bulgaria makes it.
      */}
      <section className="border-t border-line bg-paper-sunken">
        <Container className="py-14 md:py-20">
          <h2 className="text-[26px] md:text-[32px]">
            А защо не „безплатна машина“?
          </h2>
          <div className="mt-4 max-w-3xl space-y-4 text-[15px] leading-7 text-ink-muted">
            <p>
              Предложението съществува и е напълно легитимно: машината е без
              месечен наем, но се обвързвате да купувате кафето и консумативите
              от доставчика, в минимални количества всеки месец. Машината не е
              безплатна - плаща се в цената на кафето.
            </p>
            <p>
              Разликата е проста. При наем{" "}
              <strong className="text-graphite">
                нямате задължение да купувате продукти от нас
              </strong>
              . Зареждате машината сами, с каквото кафе прецените и на каквато
              цена го намерите. Ако цената на консумативите се вдигне, сменяте
              доставчика, не машината.
            </p>
            <p>
              Кое излиза по-евтино зависи изцяло от оборота ви. При малък обект с
              ниско потребление обвързаният модел често е по-изгоден и няма да
              твърдим обратното. При сериозно потребление разликата в цената на
              килограм кафе за няколко години надхвърля наема многократно.
            </p>
            <p>
              Сметката е ваша и зависи от числата ви. Затова публикуваме нашите.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href={routes.buyVsRent}>
              Сравнете наем и покупка
            </ButtonLink>
            <ButtonLink href={routes.recommender} variant="outline">
              Коя машина ми трябва?
            </ButtonLink>
            <ButtonLink href={routes.enquiry} variant="outline">
              Изпрати запитване
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}
