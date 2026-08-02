"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { ModelCard, type CardData } from "@/components/catalogue/model-card";
import {
  recommend,
  type Candidate,
  type PlanItem,
  type ScoredCandidate,
  type SiteProfile,
} from "@/engine/recommend";
import {
  CATEGORY_UNIT_LABEL,
  PRODUCT_LABEL,
  PRODUCT_KINDS,
  VENUE_LABEL,
  VENUE_TYPES,
  type ProductKind,
  type Shifts,
  type VenueType,
} from "@/content/taxonomy";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/cn";

/**
 * "Коя машина е подходяща за мен?"
 *
 * The free site survey, productised. Notably it does NOT ask how many coffees a
 * day the visitor expects - they do not know, they would guess, and a guessed
 * input produces a confidently wrong answer. It asks what they do know
 * (headcount, shift pattern) and derives demand from published norms, then
 * shows the assumption so it can be corrected.
 *
 * The budget question comes last and is optional, because asking early anchors
 * people below what they would actually pay.
 */

const STEPS = ["Обект", "Хора", "Смени", "Продукти", "Плащане", "Бюджет"] as const;

type Draft = {
  venueType: VenueType | null;
  headcount: number;
  shifts: Shifts | null;
  products: ProductKind[];
  cashless: boolean | null;
  maxMonthlyEur: number | null;
};

const EMPTY: Draft = {
  venueType: null,
  headcount: 60,
  shifts: null,
  products: [],
  cashless: null,
  maxMonthlyEur: null,
};

function Choice({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-sm border px-4 py-3 text-left text-ui font-medium transition-colors duration-[--duration-fast] ease-[--ease-out] active:scale-[0.98]",
        active
          ? "border-ink bg-ink text-ink-inverse"
          : "border-line-strong bg-paper-raised text-ink-muted hover-fine:border-ink hover-fine:text-ink",
      )}
    >
      {children}
    </button>
  );
}

/**
 * A recommended machine, as the catalogue draws it plus the reasons it won.
 *
 * The catalogue card is reused rather than reimplemented: the visitor has
 * already learned what a machine card looks like on the listing pages, and the
 * photograph, the price and the live availability are exactly what they need in
 * order to believe the recommendation.
 */
function MachineCard({
  pick,
  card,
  label,
}: {
  pick: ScoredCandidate;
  card?: CardData;
  label?: string;
}) {
  return (
    <div className="flex flex-col">
      {label && (
        <span className="serial mb-2 self-start bg-graphite px-2 py-1 text-paper">
          {label}
        </span>
      )}
      {card ? (
        <ModelCard data={card} />
      ) : (
        /* Only reachable if a model is scored but not published to the grid.
           Better a plain panel than a hole in the plan. */
        <article className="bay-panel flex-1 p-5">
          <h4 className="plate text-[13px] text-graphite">
            {pick.candidate.name}
          </h4>
          <p className="tabular mt-3 font-display text-[30px] leading-none text-graphite">
            {pick.candidate.fromEur}&nbsp;€
            <span className="ml-1 font-sans text-[12px] font-normal text-ink-muted">
              /месец
            </span>
          </p>
        </article>
      )}
      <ul className="mt-3 flex flex-col gap-1.5">
        {pick.reasons.slice(0, 3).map((reason) => (
          <li
            key={reason}
            className="flex gap-2 text-[12px] leading-5 text-ink-muted"
          >
            <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 bg-line-strong" />
            {reason}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** One line of the plan: which machine, and how many of it. */
function PlanCard({ item, card }: { item: PlanItem; card?: CardData }) {
  const unit = CATEGORY_UNIT_LABEL[item.line];
  return (
    <MachineCard
      pick={item.pick}
      card={card}
      label={`${item.count} × ${item.count === 1 ? unit.one : unit.many}`}
    />
  );
}

export function Recommender({
  candidates,
  cards,
}: {
  candidates: Candidate[];
  /** The catalogue's card data, so a recommendation can show real machines. */
  cards: CardData[];
}) {
  const cardById = useMemo(
    () => new Map(cards.map((c) => [c.id, c])),
    [cards],
  );
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [done, setDone] = useState(false);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const canAdvance =
    (step === 0 && draft.venueType !== null) ||
    (step === 1 && draft.headcount > 0) ||
    (step === 2 && draft.shifts !== null) ||
    (step === 3 && draft.products.length > 0) ||
    step === 4 ||
    step === 5;

  const result = useMemo(() => {
    if (!done || !draft.venueType || !draft.shifts) return null;
    const profile: SiteProfile = {
      venueType: draft.venueType,
      headcount: draft.headcount,
      shifts: draft.shifts,
      products: draft.products,
      cashless: draft.cashless,
      maxMonthlyEur: draft.maxMonthlyEur,
    };
    return recommend(profile, candidates);
  }, [done, draft, candidates]);

  if (result) {
    const total = result.demand.machineCount;
    const headline =
      total === 1 && result.primary
        ? result.primary.candidate.name
        : `${total} машини за вашия обект`;

    /* The whole plan, carried into the enquiry. Without it the visitor is shown
       three machines and arrives at a form that remembers one. */
    const enquirySummary = [
      `${draft.venueType ? VENUE_LABEL[draft.venueType] : ""}, ${draft.headcount} души, ${draft.shifts} смени.`,
      draft.products.length
        ? `Продукти: ${draft.products.map((x) => PRODUCT_LABEL[x]).join(", ")}.`
        : "",
      `Препоръка: ${result.plan
        .map((i) => `${i.count} × ${i.pick.candidate.name}`)
        .join(", ")}.`,
      `Ориентировъчно от ${result.monthlyFromEur} €/месец общо.`,
    ]
      .filter(Boolean)
      .join(" ")
      .slice(0, 1000);

    const enquiryHref =
      `${routes.enquiry}?source=recommender` +
      `&model=${result.primary?.candidate.slug ?? ""}` +
      `&summary=${encodeURIComponent(enquirySummary)}`;

    const answers: [string, string][] = [
      ["Обект", draft.venueType ? VENUE_LABEL[draft.venueType] : "няма данни"],
      ["Хора", draft.headcount ? String(draft.headcount) : "няма данни"],
      ["Смени", draft.shifts ? `${draft.shifts}` : "няма данни"],
      [
        "Продукти",
        draft.products.length
          ? draft.products.map((x) => PRODUCT_LABEL[x]).join(", ")
          : "няма данни",
      ],
      [
        "Безкасово",
        draft.cashless === null
          ? "Няма значение"
          : draft.cashless
            ? "Да"
            : "Не",
      ],
      [
        "Бюджет",
        draft.maxMonthlyEur ? `${draft.maxMonthlyEur} €/месец` : "няма данни",
      ],
    ];

    return (
      <div>
        <div className="bay-panel-dark riveted grid gap-8 p-7 pt-9 md:grid-cols-[1fr_320px] md:p-10">
          <div>
            <span className="stencil text-[10px] text-accent">
              Нашата препоръка
            </span>
            <h2 className="mt-3 text-[30px] leading-tight text-paper md:text-[38px]">
              {result.plan.length > 0 ? headline : "Няма подходяща машина"}
            </h2>

            {result.plan.length > 0 && (
              <>
                {/* The price of the plan, not of one machine of it. Every figure
                    in it is a real per-machine rate from the catalogue, so the
                    total is a sum rather than a multiplication of one price. */}
                <p className="tabular mt-6 font-display text-[40px] leading-none text-paper">
                  от {result.monthlyFromEur} €/месец
                </p>
                <p className="serial mt-2 text-paper/75">
                  {total === 1 ? "за машината" : `общо за ${total} машини`}
                </p>
              </>
            )}

            <span className="serial mt-7 block text-paper/75">за обекта</span>
            <ul className="mt-3 flex flex-col gap-2">
              {result.notes.map((note) => (
                <li
                  key={note}
                  className="flex gap-2.5 text-[13px] leading-6 text-paper/70"
                >
                  <span aria-hidden className="mt-2 h-1 w-1 shrink-0 bg-accent" />
                  {note}
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-wrap gap-3">
              {/* The enquiry carries the whole plan, not just the first machine. */}
              <ButtonLink href={enquiryHref}>Изпрати запитване</ButtonLink>
              <Button
                variant="ghostLight"
                onClick={() => {
                  setDone(false);
                  setStep(0);
                }}
              >
                Коригирай отговорите
              </Button>
            </div>
          </div>

          {/* Their answers, read back. Proof the wizard listened. */}
          <dl className="tabular border border-paper/15 p-5 text-[13px]">
            <span className="serial text-paper/75">вашите отговори</span>
            {answers.map(([k, v]) => (
              <div
                key={k}
                className="flex justify-between gap-4 border-b border-paper/10 py-2 last:border-0"
              >
                <dt className="text-paper/75">{k}</dt>
                <dd className="text-right text-paper/90">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="mt-5 max-w-3xl text-[12px] leading-5 text-ink-muted">
          Препоръката се изчислява по отраслови норми за потребление и по
          техническите данни на машините. Тя е ориентировъчна - окончателният
          избор го правим заедно, след като разберем повече за обекта.
        </p>

        {/* The plan itself, as machines you can look at. A recommendation of
            three machines that shows one card is not a recommendation of three
            machines. */}
        {result.plan.length > 0 && (
          <div className="mt-12">
            <h3 className="plate text-[12px] text-ink-muted">
              {result.plan.length === 1
                ? "Машината, която предлагаме"
                : "Машините, които предлагаме"}
            </h3>
            <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {result.plan.map((item) => (
                <PlanCard
                  key={item.pick.candidate.id}
                  item={item}
                  card={cardById.get(item.pick.candidate.id)}
                />
              ))}
            </div>
          </div>
        )}

        {result.comboInstead && (
          <div className="mt-12">
            <h3 className="plate text-[12px] text-ink-muted">
              Или една комбинирана машина
            </h3>
            {/* Deliberately says nothing about price: a combination machine is
                often dearer than the two cabinets it replaces. What it always
                saves is floor space. */}
            <p className="mt-2 max-w-2xl text-[13px] leading-6 text-ink-muted">
              Един корпус вместо два - по-малко място и една доставка, срещу
              по-малък капацитет на зареждане.
            </p>
            <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <MachineCard
                pick={result.comboInstead}
                card={cardById.get(result.comboInstead.candidate.id)}
              />
            </div>
          </div>
        )}

        {result.alternatives.length > 0 && (
          <div className="mt-12">
            <h3 className="plate text-[12px] text-ink-muted">
              Други подходящи машини
            </h3>
            <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {result.alternatives.map((pick) => (
                <MachineCard
                  key={pick.candidate.id}
                  pick={pick}
                  card={cardById.get(pick.candidate.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr] lg:items-start">
      {/* Step rail. Numbered like a procedure, not like a progress bar - each
          step is reachable, because a wizard you cannot go back through is a
          form that has trapped you. */}
      <ol className="bay-panel divide-y divide-line">
        {STEPS.map((label, i) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => setStep(i)}
              aria-current={i === step ? "step" : undefined}
              className={cn(
                "flex min-h-11 w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-200",
                i === step ? "bg-graphite text-paper" : "hover-fine:bg-paper-sunken",
              )}
            >
              <span
                className={cn(
                  "serial",
                  i === step
                    ? "text-accent"
                    : i < step
                      ? "text-status-available"
                      : "text-line-strong",
                )}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className={cn(
                  "plate text-[11px]",
                  i === step ? "text-paper" : "text-graphite",
                )}
              >
                {label}
              </span>
            </button>
          </li>
        ))}
      </ol>

      <div className="bay-panel riveted p-6 pt-8 md:p-10 md:pt-11">
        <div className="mb-6 flex items-center justify-between border-b border-line pb-4">
          <span className="serial text-ink-muted">
            стъпка {step + 1} / {STEPS.length}
          </span>
          <div className="flex gap-1" aria-hidden>
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={cn("h-1 w-8", i <= step ? "bg-accent" : "bg-line")}
              />
            ))}
          </div>
        </div>


        {step === 0 && (
          <fieldset>
            <legend className="text-[24px] leading-tight md:text-[30px]">
              Какъв е вашият обект?
            </legend>
            <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {VENUE_TYPES.map((v) => (
                <Choice
                  key={v}
                  active={draft.venueType === v}
                  onClick={() => {
                    set("venueType", v);
                    setStep(1);
                  }}
                >
                  {VENUE_LABEL[v]}
                </Choice>
              ))}
            </div>
          </fieldset>
        )}

        {step === 1 && (
          <fieldset>
            <legend className="text-[24px] leading-tight md:text-[30px]">
              Колко души използват обекта?
            </legend>
            <p className="mt-2 text-ink-muted">
              Приблизително е достатъчно. От този брой изчисляваме очакваното
              потребление.
            </p>
            <div className="mt-7 flex items-center gap-4">
              <input
                type="range"
                min={5}
                max={500}
                step={5}
                value={Math.min(500, Math.max(5, draft.headcount))}
                onChange={(e) => set("headcount", Number(e.target.value))}
                aria-label="Брой хора"
                className="h-2 flex-1 cursor-pointer accent-ink"
              />
              {/* Typed as well as dragged. The slider stops at 500 and steps by
                  5; a 1,200-person plant and a 63-person office both exist, and
                  neither should have to approximate itself to use the wizard.
                  Empty is allowed while typing - clamping on every keystroke
                  makes the field impossible to clear. */}
              <input
                type="number"
                min={1}
                max={10000}
                inputMode="numeric"
                value={draft.headcount || ""}
                onChange={(e) =>
                  set(
                    "headcount",
                    e.target.value === ""
                      ? 0
                      : Math.min(10000, Math.max(0, Number(e.target.value))),
                  )
                }
                onBlur={() => {
                  if (draft.headcount < 1) set("headcount", 1);
                }}
                aria-label="Брой хора"
                className="tabular h-14 w-28 rounded-sm border border-line-strong bg-paper-raised px-3 text-right text-[1.75rem] leading-none font-extrabold tracking-tight transition-colors duration-[--duration-fast] ease-[--ease-out] focus:border-ink focus:outline-none"
              />
            </div>
          </fieldset>
        )}

        {step === 2 && (
          <fieldset>
            <legend className="text-[24px] leading-tight md:text-[30px]">
              Колко смени работите?
            </legend>
            <div className="mt-6 grid gap-2 sm:grid-cols-3">
              {([1, 2, 3] as Shifts[]).map((s) => (
                <Choice
                  key={s}
                  active={draft.shifts === s}
                  onClick={() => {
                    set("shifts", s);
                    setStep(3);
                  }}
                >
                  {s === 1 ? "Една смяна" : s === 2 ? "Две смени" : "Три смени, 24/7"}
                </Choice>
              ))}
            </div>
          </fieldset>
        )}

        {step === 3 && (
          <fieldset>
            <legend className="text-[24px] leading-tight md:text-[30px]">Какво желаете?</legend>
            <p className="mt-2 text-[13px] leading-6 text-ink-muted">Може повече от едно.</p>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {PRODUCT_KINDS.map((p) => (
                <Choice
                  key={p}
                  active={draft.products.includes(p)}
                  onClick={() =>
                    set(
                      "products",
                      draft.products.includes(p)
                        ? draft.products.filter((x) => x !== p)
                        : [...draft.products, p],
                    )
                  }
                >
                  {PRODUCT_LABEL[p]}
                </Choice>
              ))}
            </div>
          </fieldset>
        )}

        {step === 4 && (
          <fieldset>
            <legend className="text-[24px] leading-tight md:text-[30px]">
              Желаете ли безкасово плащане?
            </legend>
            <div className="mt-6 grid gap-2 sm:grid-cols-3">
              {[
                { label: "Да", value: true },
                { label: "Не", value: false },
                { label: "Няма значение", value: null },
              ].map((o) => (
                <Choice
                  key={o.label}
                  active={draft.cashless === o.value}
                  onClick={() => {
                    set("cashless", o.value);
                    setStep(5);
                  }}
                >
                  {o.label}
                </Choice>
              ))}
            </div>
          </fieldset>
        )}

        {step === 5 && (
          <fieldset>
            <legend className="text-[24px] leading-tight md:text-[30px]">
              Имате ли ориентировъчен месечен бюджет?
            </legend>
            <p className="mt-2 text-[13px] leading-6 text-ink-muted">
              Незадължително. Ако пропуснете, ще покажем всички подходящи машини.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-sm border border-line-strong px-4">
                <input
                  type="number"
                  min={0}
                  step={10}
                  value={draft.maxMonthlyEur ?? ""}
                  onChange={(e) =>
                    set(
                      "maxMonthlyEur",
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                  placeholder="напр. 150"
                  aria-label="Максимален месечен бюджет в евро"
                  className="tabular h-12 w-32 bg-transparent text-body-lg font-semibold outline-none"
                />
                <span className="text-ink-muted">€/месец</span>
              </div>
            </div>
          </fieldset>
        )}

        <div className="mt-10 flex items-center justify-between gap-3 border-t border-line pt-6">
          <Button
            variant="outline"
            onClick={() => setStep((v) => Math.max(0, v - 1))}
            disabled={step === 0}
            className={cn(step === 0 && "opacity-40")}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Назад
          </Button>

          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((v) => v + 1)} disabled={!canAdvance}>
              Напред <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          ) : (
            <Button onClick={() => setDone(true)}>
              Виж препоръката <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
