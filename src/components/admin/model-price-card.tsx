"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowDown, ArrowUp } from "lucide-react";
import {
  moveModel,
  saveModelPricing,
  resetModelPricing,
  type PricingState,
} from "@/server/admin-actions";
import { TERMS, deriveTerms, type Term } from "@/engine/terms";
import { cn } from "@/lib/cn";

/**
 * One machine's price card.
 *
 * The client asked to see the machines, not a table of ids - so the card leads
 * with the photograph and the name, the way the catalogue page does, and the
 * five term fields sit under it. Recognising a Canto from its cabinet is faster
 * than reading "canto-touch", and this screen is used while standing in a
 * warehouse looking at the thing.
 *
 * TYPE THE 12-MONTH PRICE AND THE OTHER FOUR FILL THEMSELVES. That is what makes
 * this a fifty-number job rather than a two-hundred-and-fifty-number one. The
 * suggestion uses the same curve the derived placeholder does, every field stays
 * editable, and nothing is filled over a figure that is already there - so a
 * machine priced by hand last week is not quietly rewritten by typing in the
 * first box.
 */

export interface PriceCardModel {
  id: string;
  name: string;
  currentName: string | null;
  manufacturer: string;
  photo: { src: string; alt: string } | null;
  /** What the site shows today, per term, and whether it is real. */
  rates: { term: Term; monthlyEur: number; isPlaceholder: boolean }[];
  saved: Partial<Record<Term, number>>;
  published: boolean;
  sortOrder: number;
  /** Position within the category, for disabling the end arrows. */
  isFirst: boolean;
  isLast: boolean;
}

function SaveButton({ dirty }: { dirty: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "min-h-10 rounded-sm px-4 py-2 text-ui font-semibold transition-all duration-[--duration-fast] ease-[--ease-out] active:scale-[0.97] disabled:opacity-60",
        dirty
          ? "bg-ink text-ink-inverse"
          : "border border-line-strong bg-paper-raised text-ink-muted",
      )}
    >
      {pending ? "Записва се..." : "Запази"}
    </button>
  );
}

/** A bare submit that carries only the model id - used by the arrows and the
 *  reset, neither of which has anything to type. */
function IconAction({
  action,
  modelId,
  label,
  disabled,
  extra,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  modelId: string;
  label: string;
  disabled?: boolean;
  extra?: Record<string, string>;
  children: React.ReactNode;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="modelId" value={modelId} />
      {Object.entries(extra ?? {}).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button
        type="submit"
        disabled={disabled}
        aria-label={label}
        title={label}
        className="flex min-h-9 min-w-9 items-center justify-center rounded-sm border border-line-strong bg-paper-raised text-ink-muted transition-colors duration-[--duration-fast] ease-[--ease-out] disabled:opacity-35 hover-fine:not-disabled:border-ink hover-fine:not-disabled:text-ink"
      >
        {children}
      </button>
    </form>
  );
}

export function ModelPriceCard({ model }: { model: PriceCardModel }) {
  const [state, action] = useActionState<PricingState, FormData>(
    saveModelPricing,
    {},
  );

  /* Uncontrolled would be simpler, but the auto-fill has to write into four
     fields the user has not touched, and "is anything unsaved" needs comparing
     against what is stored. Both want the values in state. */
  const [values, setValues] = useState<Record<Term, string>>(() =>
    Object.fromEntries(
      TERMS.map((t) => [t, model.saved[t] !== undefined ? String(model.saved[t]) : ""]),
    ) as Record<Term, string>,
  );
  const [published, setPublished] = useState(model.published);

  const dirty =
    published !== model.published ||
    TERMS.some(
      (t) =>
        values[t] !== (model.saved[t] !== undefined ? String(model.saved[t]) : ""),
    );

  /** Fills the empty terms from a typed 12-month figure. Never overwrites. */
  function suggestFromBaseline(raw: string) {
    const baseline = Number(raw.replace(",", "."));
    if (!Number.isFinite(baseline) || baseline <= 0) return;

    const suggested = deriveTerms(baseline);
    setValues((prev) => {
      const next = { ...prev };
      for (const term of TERMS) {
        if (term !== 12 && next[term].trim() === "") {
          next[term] = String(suggested[term]);
        }
      }
      return next;
    });
  }

  const unpriced = TERMS.every((t) => model.saved[t] === undefined);

  return (
    <li
      className={cn(
        "flex flex-col rounded-md border bg-paper-raised transition-opacity",
        published ? "border-line" : "border-dashed border-line-strong opacity-70",
      )}
    >
      <div className="flex items-start gap-3 border-b border-line p-3">
        <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-sm bg-paper-sunken">
          {model.photo ? (
            <Image
              src={model.photo.src}
              alt={model.photo.alt}
              fill
              sizes="64px"
              className="object-contain p-1"
            />
          ) : (
            <span className="flex h-full items-center justify-center text-center text-[10px] leading-tight text-ink-subtle">
              без
              <br />
              снимка
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-ui font-bold tracking-tight">{model.name}</p>
          <p className="truncate text-ui-sm text-ink-muted">
            {model.manufacturer}
            {model.currentName && ` · днес ${model.currentName}`}
          </p>
          <p className="mt-1.5">
            <span
              className={cn(
                "inline-block rounded-sm px-1.5 py-0.5 text-[11px] font-semibold",
                unpriced
                  ? "bg-status-reserved-bg text-status-reserved"
                  : "bg-status-available-bg text-status-available",
              )}
            >
              {unpriced ? "временна цена" : "реална цена"}
            </span>
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-1">
          <IconAction
            action={moveModel}
            modelId={model.id}
            label="Нагоре в категорията"
            disabled={model.isFirst}
            extra={{ direction: "up" }}
          >
            <ArrowUp className="h-4 w-4" aria-hidden />
          </IconAction>
          <IconAction
            action={moveModel}
            modelId={model.id}
            label="Надолу в категорията"
            disabled={model.isLast}
            extra={{ direction: "down" }}
          >
            <ArrowDown className="h-4 w-4" aria-hidden />
          </IconAction>
        </div>
      </div>

      <form action={action} className="flex flex-1 flex-col p-3">
        <input type="hidden" name="modelId" value={model.id} />
        <input type="hidden" name="sortOrder" value={model.sortOrder} />

        <div className="grid grid-cols-5 gap-1.5">
          {TERMS.map((term) => {
            const shown = model.rates.find((r) => r.term === term);
            return (
              <label key={term} className="flex flex-col gap-1">
                <span className="text-center text-[11px] font-medium text-ink-muted">
                  {term} мес.
                </span>
                <input
                  name={`monthly_${term}`}
                  value={values[term]}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [term]: e.target.value }))
                  }
                  onBlur={
                    term === 12
                      ? (e) => suggestFromBaseline(e.target.value)
                      : undefined
                  }
                  inputMode="numeric"
                  /* The derived figure as the placeholder, so an empty field
                     still shows what the site is publishing right now rather
                     than reading as a zero. */
                  placeholder={shown ? String(shown.monthlyEur) : ""}
                  aria-label={`Месечна цена за ${term} месеца`}
                  className="tabular h-10 w-full rounded-sm border border-line-strong bg-paper px-1 text-center text-ui focus:border-ink"
                />
              </label>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-ui-sm">
            <input
              type="checkbox"
              name="published"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="h-4 w-4 accent-[color:var(--color-ink)]"
            />
            <span className={published ? "text-ink" : "font-medium text-ink-muted"}>
              {published ? "В сайта" : "Скрита"}
            </span>
          </label>

          <div className="flex items-center gap-2">
            {!unpriced && (
              <IconAction
                action={resetModelPricing}
                modelId={model.id}
                label="Изчисти цените и върни временните"
              >
                <span className="px-1 text-[11px] font-medium">нулирай</span>
              </IconAction>
            )}
            <SaveButton dirty={dirty} />
          </div>
        </div>

        {state.error && (
          <p role="alert" className="mt-2 text-sm font-medium text-danger">
            {state.error}
          </p>
        )}
        {state.savedId === model.id && !dirty && (
          <p role="status" className="mt-2 text-sm text-ink-muted">
            Записано.
          </p>
        )}
      </form>
    </li>
  );
}
