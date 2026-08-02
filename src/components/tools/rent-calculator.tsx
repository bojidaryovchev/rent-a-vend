"use client";

import { useState } from "react";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { IncludedMark } from "@/components/ui/bits";
import { AnimatedFigure } from "./animated-figure";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/cn";

/**
 * Rent calculator.
 *
 * Every term is rendered in the markup rather than computed on selection, so
 * the figures are in the HTML for search engines and readable with JavaScript
 * off. Selecting a term only changes emphasis.
 *
 * Ordering is fixed by decision: monthly instalment largest, then the per-day
 * framing, then what the rent covers, and the term total last, smaller, and
 * behind a disclosure. The total is never hidden - hiding it would be worse -
 * but a 60-month sum sitting next to "a machine costs a few thousand to buy"
 * loses the sale if it leads.
 *
 * The result sits on a dark riveted panel: this is the instrument, and it
 * should read as one.
 */

export interface TermQuote {
  term: number;
  monthlyEur: number;
  dailyEur: number;
  totalEur: number;
  reductionLabel: string | null;
}

export function RentCalculator({
  quotes,
  included,
  enquiryHref = routes.enquiry,
}: {
  quotes: TermQuote[];
  included: readonly string[];
  enquiryHref?: string;
}) {
  const [term, setTerm] = useState(quotes[2]?.term ?? quotes[0].term);
  const [open, setOpen] = useState(false);
  const active = quotes.find((q) => q.term === term) ?? quotes[0];

  return (
    <section className="steel border-y border-graphite-edge">
      <Container className="py-14 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <h2 className="text-[26px] text-paper md:text-[34px]">
              Изчисли наема
            </h2>
            <p className="mt-3 max-w-md text-[14px] leading-6 text-paper/70">
              Изберете срок и вижте месечната вноска за тази машина.
            </p>

            <fieldset className="mt-8">
              <legend className="plate text-[11px] text-paper/75">
                Срок на договора
              </legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {quotes.map((q) => (
                  <button
                    key={q.term}
                    type="button"
                    onClick={() => setTerm(q.term)}
                    aria-pressed={q.term === term}
                    className={cn(
                      "tabular min-h-11 min-w-16 border px-3 text-[13px] transition-all duration-200",
                      q.term === term
                        ? "border-accent bg-accent font-semibold text-graphite"
                        : "border-paper/25 text-paper/80 hover-fine:border-paper/60",
                    )}
                  >
                    {q.term}
                    <span className="ml-1 text-[11px] opacity-70">месеца</span>
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="bay-panel-dark riveted p-6 md:p-8">
            <span className="stencil text-[11px] text-accent">на месец</span>

            {/* The site's one authored moment: the figure counts to its new
                value over 640ms. It is the only place anyone watches a price
                move, and the whole thesis of the page. */}
            <p className="tabular mt-2 font-display text-[64px] leading-none text-paper md:text-[80px]">
              <AnimatedFigure value={active.monthlyEur} /> €
            </p>

            <p className="tabular mt-2 text-[14px] text-paper/70">
              около {active.dailyEur.toFixed(2).replace(".", ",")} € на ден
            </p>

            {active.reductionLabel && (
              <p className="tabular mt-4 inline-flex items-center gap-2 border border-accent/50 px-2.5 py-1.5 text-[12px] text-accent">
                {active.reductionLabel}
              </p>
            )}

            <div className="mt-6 border-t border-paper/12 pt-5">
              <span className="plate text-[11px] text-paper/75">
                Какво включва наемът
              </span>
              <ul className="mt-3 grid gap-1.5 text-[13px] text-paper/80 sm:grid-cols-2">
                {included.map((x) => (
                  <li key={x} className="flex items-center gap-2">
                    <IncludedMark className="text-accent" />
                    {x}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6">
              <ButtonLink
                href={`${enquiryHref}?term=${active.term}`}
                className="w-full"
              >
                Изпрати запитване
              </ButtonLink>
            </div>

            <p className="mt-4 text-[12px] leading-5 text-paper/75">
              Цените са в евро, без ДДС. Депозитът и отстъпката при повече машини
              се определят след оценка на фирмата.
            </p>

            <div className="mt-5 border-t border-paper/12 pt-4">
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                className="serial flex min-h-11 w-full items-center justify-between text-paper/75 hover-fine:text-paper"
              >
                Обща стойност за целия срок
                <span aria-hidden className="tabular">
                  {open ? "−" : "+"}
                </span>
              </button>

              {open && (
                <div className="pb-1">
                  <p className="tabular font-display text-[26px] leading-none text-paper/85">
                    {active.totalEur.toLocaleString("bg-BG")} €
                  </p>
                  <p className="mt-3 text-[12px] leading-5 text-paper/75">
                    По-дългият срок дава по-ниска месечна вноска, но по-голяма
                    обща сума. В замяна разходът е фиксиран и предвидим, сервизът
                    и застраховката са включени, а първоначална инвестиция няма.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
