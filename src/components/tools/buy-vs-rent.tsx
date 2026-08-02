"use client";

import { useMemo, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { ExcludedMark, Field, IncludedMark, inputCls } from "@/components/ui/bits";
import { AnimatedFigure } from "./animated-figure";
import {
  CAPITAL_USES,
  DEFAULTS,
  compareBuyVsRent,
  type BuyVsRentInput,
  type CapitalUseId,
} from "@/engine/buy-vs-rent";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/cn";

/**
 * "Наем или покупка?"
 *
 * Built to be checkable. A procurement manager will run these numbers on paper,
 * and a calculator that always concludes "rent wins" fails that check once and
 * is never trusted again. So the arithmetic is honest, buying is credited with
 * its residual value, and over a long horizon the verdict says buying is
 * cheaper — because it is.
 *
 * The argument for renting is made where it is actually true: no capital locked
 * up on day one, a predictable monthly figure, and service, repairs and
 * insurance carried by someone else.
 */

const YEARS = [3, 5, 8, 10] as const;

function Row({
  label,
  purchase,
  rent,
  emphasis = false,
}: {
  label: string;
  purchase: React.ReactNode;
  rent: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[1.2fr_1fr_1fr] items-baseline gap-3 py-3",
        emphasis && "font-bold",
      )}
    >
      <span className={cn("text-ui", !emphasis && "text-ink-muted")}>
        {label}
      </span>
      <span className="tabular text-right text-ui">{purchase}</span>
      <span className="tabular text-right text-ui">{rent}</span>
    </div>
  );
}

/**
 * A cell that answers yes or no in words rather than in money.
 *
 * Seven of the nine rows are numbers, which the eye compares without reading.
 * The rest say "включен", "включени", "включена", "за ваша сметка", "няма" -
 * five Bulgarian words that all have to be read one at a time to extract a
 * yes or a no, in the one table on the site built for scanning. The mark
 * carries the answer; the word stays, because it says *how*.
 *
 * Deliberately not coloured green and red. Status colours on this site mean
 * stock and nothing else, and borrowing the availability green for "included
 * in the rent" would make every green on the site ambiguous.
 *
 * "при условия" gets no mark on purpose. It is a qualified yes, and a tick
 * beside it would promise a replacement machine unconditionally - which is
 * the one thing this calculator exists not to do.
 */
function Verdict({ tone, children }: { tone: "yes" | "no"; children: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        tone === "yes" ? "text-ink" : "text-ink-subtle",
      )}
    >
      {tone === "yes" ? <IncludedMark /> : <ExcludedMark />}
      {children}
    </span>
  );
}

/** Cumulative cost over time. Two lines, no library. */
function CostChart({
  series,
}: {
  series: { month: number; purchase: number; rent: number }[];
}) {
  const w = 560;
  const h = 180;
  const max = Math.max(...series.map((s) => Math.max(s.purchase, s.rent))) || 1;
  const x = (m: number) => ((m - 1) / Math.max(1, series.length - 1)) * w;
  const y = (v: number) => h - (v / max) * h;

  const path = (key: "purchase" | "rent") =>
    series.map((s, i) => `${i === 0 ? "M" : "L"} ${x(s.month)} ${y(s[key])}`).join(" ");

  return (
    <figure>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-44 w-full"
        role="img"
        aria-label="Натрупан разход във времето: покупка спрямо наем"
      >
        <path d={path("purchase")} fill="none" stroke="var(--color-ink)" strokeWidth={2.5} />
        <path
          d={path("rent")}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={2.5}
        />
      </svg>
      <figcaption className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-muted">
        <span className="flex items-center gap-2">
          <span aria-hidden className="h-0.5 w-4 bg-ink" />
          Покупка
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden className="h-0.5 w-4 bg-accent" />
          Наем
        </span>
        <span className="text-ink-subtle">
          Покупката тръгва високо в първия ден. Наемът расте равномерно.
        </span>
      </figcaption>
    </figure>
  );
}

export function BuyVsRentCalculator() {
  const [form, setForm] = useState<BuyVsRentInput>(DEFAULTS);
  const [use, setUse] = useState<CapitalUseId>("working-capital");

  const set = <K extends keyof BuyVsRentInput>(key: K, v: BuyVsRentInput[K]) =>
    setForm((f) => ({ ...f, [key]: v }));

  const result = useMemo(() => compareBuyVsRent(form), [form]);
  const eur = (n: number) => `${n.toLocaleString("bg-BG")} €`;
  const chosenUse = CAPITAL_USES.find((u) => u.id === use)!;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.35fr] lg:gap-12">
      {/* -- inputs ---------------------------------------------------------- */}
      <div className="flex flex-col gap-5">
        <Field label="Цена на машината" suffix="€">
          <input
            type="number"
            min={0}
            step={100}
            value={form.machinePriceEur}
            onChange={(e) =>
              set("machinePriceEur", Math.max(0, Number(e.target.value)))
            }
            className={inputCls}
          />
        </Field>

        <div>
          <span className="block text-ui font-semibold">
            Срок на използване
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {YEARS.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => set("years", y)}
                aria-pressed={form.years === y}
                className={cn(
                  "tabular inline-flex min-h-11 items-center justify-center rounded-sm border px-4 py-2.5 text-ui font-semibold transition-colors duration-[--duration-fast] ease-[--ease-out] active:scale-[0.97]",
                  form.years === y
                    ? "border-ink bg-ink text-ink-inverse"
                    : "border-line-strong text-ink-muted hover-fine:border-ink hover-fine:text-ink",
                )}
              >
                {y} г.
              </button>
            ))}
          </div>
        </div>

        <Field label="Месечен наем" suffix="€/мес.">
          <input
            type="number"
            min={0}
            step={5}
            value={form.monthlyRentEur}
            onChange={(e) => set("monthlyRentEur", Math.max(0, Number(e.target.value)))}
            className={inputCls}
          />
        </Field>

        <Field label="Лихва по кредит" hint="0 означава плащане в брой." suffix="%">
          <input
            type="number"
            min={0}
            step={0.5}
            value={form.creditInterestPct}
            onChange={(e) => set("creditInterestPct", Math.max(0, Number(e.target.value)))}
            className={inputCls}
          />
        </Field>

        <Field label="Сервиз при покупка" hint="Ориентировъчно. Коригирайте според вашия опит." suffix="€/год.">
          <input
            type="number"
            min={0}
            step={10}
            value={form.annualServiceEur}
            onChange={(e) => set("annualServiceEur", Math.max(0, Number(e.target.value)))}
            className={inputCls}
          />
        </Field>

        <Field label="Ремонти при покупка" hint="Ориентировъчно." suffix="€/год.">
          <input
            type="number"
            min={0}
            step={10}
            value={form.annualRepairsEur}
            onChange={(e) => set("annualRepairsEur", Math.max(0, Number(e.target.value)))}
            className={inputCls}
          />
        </Field>

        <Field label="Остатъчна стойност" hint="Колко струва машината в края на периода. В полза на покупката." suffix="%">
          <input
            type="number"
            min={0}
            step={5}
            value={form.residualValuePct}
            onChange={(e) => set("residualValuePct", Math.max(0, Number(e.target.value)))}
            className={inputCls}
          />
        </Field>
      </div>

      {/* -- result ---------------------------------------------------------- */}
      <div>
        <div className="bay-panel p-6 sm:p-7">
          <div className="grid grid-cols-[1.2fr_1fr_1fr] gap-3 border-b border-line pb-3">
            <span className="text-micro font-semibold uppercase text-ink-subtle">
              За {form.years} години
            </span>
            <span className="text-right text-micro font-semibold uppercase text-ink-subtle">
              Покупка
            </span>
            <span className="text-right text-micro font-semibold uppercase text-ink-subtle">
              Наем
            </span>
          </div>

          <div className="divide-y divide-line">
            <Row
              label="Първоначална инвестиция"
              purchase={eur(result.purchase.upfront)}
              rent="0 €"
            />
            {result.mode === "credit" && (
              <Row
                label="Лихва по кредита"
                purchase={eur(result.purchase.financingCost)}
                rent="0 €"
              />
            )}
            <Row
              label="Наем за периода"
              purchase="-"
              rent={eur(result.rent.rentPaid)}
            />
            <Row
              label="Сервиз"
              purchase={eur(result.purchase.service)}
              rent={<Verdict tone="yes">включен</Verdict>}
            />
            <Row
              label="Ремонти и части"
              purchase={eur(result.purchase.repairs)}
              rent={<Verdict tone="yes">включени</Verdict>}
            />
            <Row
              label="Застраховка"
              purchase={<Verdict tone="no">за ваша сметка</Verdict>}
              rent={<Verdict tone="yes">включена</Verdict>}
            />
            <Row
              label="Заместваща машина"
              purchase={<Verdict tone="no">няма</Verdict>}
              rent="при условия"
            />
            <Row
              label="Остатъчна стойност"
              purchase={`- ${eur(result.purchase.residualValue)}`}
              rent="-"
            />
            <Row
              label="Общо за периода"
              purchase={eur(result.purchase.total)}
              rent={eur(result.rent.total)}
              emphasis
            />
          </div>
        </div>

        {/* Honest verdict. It says "buying is cheaper" when buying is cheaper. */}
        <div className="bay-panel mt-5 p-6 sm:p-7">
          <h2 className="text-body-xl font-bold tracking-tight">
            {result.cheaper === "rent"
              ? `За ${form.years} години наемът излиза по-евтино`
              : result.cheaper === "purchase"
                ? `За ${form.years} години покупката излиза по-евтино`
                : "За този период двете излизат почти еднакво"}
          </h2>

          {result.cheaper !== "equal" && (
            <p className="tabular mt-2 text-body-lg text-ink-muted">
              Разлика:{" "}
              <strong className="font-bold text-ink">
                <AnimatedFigure value={result.differenceEur} /> €
              </strong>
            </p>
          )}

          {result.crossoverMonth && (
            <p className="mt-3 leading-relaxed text-ink-muted">
              Покупката настига наема по натрупан разход около{" "}
              <strong className="font-semibold text-ink">
                {result.crossoverMonth}-и месец
              </strong>
              . След това всеки месец е в полза на покупката.
            </p>
          )}

          {result.cheaper === "purchase" && (
            <p className="mt-3 leading-relaxed text-ink-muted">
              Казваме го направо, защото е вярно. При дълъг период покупката
              обикновено е по-изгодна като обща сума. Наемът остава по-добрият
              избор, когато капиталът ви трябва другаде, когато искате
              предвидим разход или когато не желаете да носите риска от ремонти.
            </p>
          )}
        </div>

        {/* Capital, named but never priced. Attaching a return rate to "you
            could have spent this on advertising" would be inventing a forecast. */}
        {result.capitalRetained > 0 && (
          <div className="bay-panel-dark riveted mt-5 p-6 pt-8 sm:p-7">
            <p className="text-micro font-semibold uppercase text-ink-inverse/50">
              Запазен капитал
            </p>
            <p className="tabular mt-3 text-figure leading-none font-extrabold tracking-tight">
              <AnimatedFigure value={result.capitalRetained} /> €
            </p>
            <p className="mt-4 leading-relaxed text-ink-inverse/75">
              При покупка тези пари излизат от бизнеса в първия ден. При наем
              остават при вас - например за {chosenUse.label}.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {CAPITAL_USES.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setUse(u.id)}
                  aria-pressed={use === u.id}
                  className={cn(
                    "min-h-9 rounded-sm border px-3 py-1.5 text-sm font-medium transition-colors duration-[--duration-fast] ease-[--ease-out] active:scale-[0.97]",
                    use === u.id
                      ? "border-accent bg-accent text-accent-ink"
                      : "border-ink-inverse/25 text-ink-inverse/75",
                  )}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="bay-panel mt-5 p-6 sm:p-7">
          <h2 className="text-micro font-semibold uppercase text-ink-subtle">
            Натрупан разход във времето
          </h2>
          <div className="mt-4">
            <CostChart series={result.series} />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href={routes.enquiry} size="lg">
            Изпрати запитване
          </ButtonLink>
          <ButtonLink href={routes.recommender} size="lg" variant="outline">
            Коя машина ми трябва?
          </ButtonLink>
        </div>

        <p className="mt-5 max-w-[60ch] text-sm leading-relaxed text-ink-subtle">
          Сметката е ориентировъчна и работи с числата, които сте въвели.
          Разходите за сервиз и ремонти зависят от машината, натоварването и
          обекта. Всички суми са в евро, без ДДС.
        </p>
      </div>
    </div>
  );
}
