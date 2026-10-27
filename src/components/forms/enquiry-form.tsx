"use client";

import { useId, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { z } from "@/lib/zod";
import Link from "next/link";
import { submitEnquiry } from "@/server/enquiry-action";
import { Turnstile, resetTurnstile, turnstileEnabled } from "./turnstile";
import { trackEvent } from "@/components/site/analytics";
import { company } from "@/lib/company";
import { routes } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/**
 * The enquiry form.
 *
 * Four visible required fields. Everything the visitor already told us -
 * machine, term, unit, site profile - rides along hidden rather than being
 * asked twice.
 *
 * The measured cost of getting this wrong: three fields convert near 23%, seven
 * near 11%. The original brief specified nine.
 *
 * Validation runs client-side through the same shape the server enforces, so a
 * mistake is caught before a round trip - but the server still validates
 * independently, because anything the client checks can be bypassed.
 */

/** The visible fields only. Carried context is not the visitor's to get wrong. */
const formSchema = z.object({
  name: z.string().trim().min(2, "Моля, въведете име.").max(120),
  company: z.string().trim().min(2, "Моля, въведете име на фирмата.").max(160),
  phone: z.string().trim().min(6, "Моля, въведете телефон.").max(40),
  email: z.string().trim().email("Проверете имейл адреса.").max(160),
  vatNumber: z.string().trim().max(32).optional(),
  message: z.string().trim().max(2000).optional(),
  consent: z.literal(true, {
    message: "Моля, потвърдете, че сте се запознали с политиката.",
  }),
  /** Honeypot: hidden from people, irresistible to bots. */
  website: z.string().max(0).optional(),
});

type FormValues = z.input<typeof formSchema>;

export interface CarriedContext {
  modelSlug?: string;
  modelName?: string;
  monthlyEur?: number;
  term?: number;
  source?: "model" | "calculator" | "recommender" | "contact" | "direct";
  recommenderSummary?: string;
}

/**
 * One labelled field.
 *
 * The label is a real `<label for>`, pointed at the control by id. It was a
 * styled `<span>` above the input, which looked right and named nothing: a
 * screen reader announced six unlabelled edit fields on the one form this site
 * exists to have filled in, and tapping the word did not focus the box. The
 * classes are unchanged, so it looks the same.
 *
 * The hint and the error carry ids of their own, which the control lists in
 * `aria-describedby` (see `describedBy`), so they are read with the field and
 * not only at the moment they appear.
 */
function Field({
  id,
  label,
  error,
  hint,
  optional,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="plate block text-[11px] text-ink-muted">
        {/* The label is now the field's name, and a margin alone made it
            "ДДС номерпо избор". The space has to sit inside the label's own
            text: Chrome drops a space that stands alone between two nodes. */}
        {optional ? `${label} ` : label}
        {optional && (
          <span className="ml-1 font-normal text-ink-subtle">по избор</span>
        )}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-ink-subtle">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p
          id={`${id}-error`}
          className="mt-1.5 text-sm font-medium text-danger"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

/** The ids a field's control is described by: its hint, and its error while
 *  there is one. */
const describedBy = (
  id: string,
  { hint = false, error = false }: { hint?: boolean; error?: boolean },
) =>
  [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") ||
  undefined;

/**
 * Form controls sit on the `body-lg` step (1.0625rem / 17px), not on the
 * smaller `ui` step the rest of the interface uses.
 *
 * iOS Safari zooms the viewport whenever a focused input renders below 16px,
 * which throws the visitor out of the layout mid-form on the one page whose
 * conversion actually matters. `body-lg` is the smallest documented step that
 * clears that threshold — so this satisfies the type ramp rather than escaping
 * it. Do not "tidy" it down to `ui`.
 */
const inputClass = (invalid: boolean) =>
  cn(
    "mt-2 h-12 w-full rounded-sm border bg-paper-raised px-3.5 text-body-lg transition-colors duration-[--duration-fast] ease-[--ease-out]",
    invalid ? "border-danger" : "border-line-strong focus:border-ink",
  );

export function EnquiryForm({ context = {} }: { context?: CarriedContext }) {
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  /* Empty until Cloudflare hands one over, and empty again after a rejection.
     The server refuses a blank token only when a site key is configured, so
     this stays harmless on a deployment with no bot protection. */
  const [turnstileToken, setTurnstileToken] = useState("");
  /* One prefix per form, so the ids stay unique if a page ever holds two -
     every id in the form takes it, the honeypot's included. Ids only: the
     field names, and so what the form submits, are unchanged. */
  const uid = useId();
  const id = (field: string) => `${uid}-${field}`;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { vatNumber: "", message: "", website: "" },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const data = new FormData();
      Object.entries(values).forEach(([k, v]) => {
        if (v === true) data.set(k, "on");
        else if (v != null) data.set(k, String(v));
      });

      // Carried context, appended server-side of the visitor's attention.
      data.set("modelSlug", context.modelSlug ?? "");
      data.set("term", context.term ? String(context.term) : "");
      data.set("source", context.source ?? "direct");
      data.set("recommenderSummary", context.recommenderSummary ?? "");

      /* Set explicitly rather than left to the widget's own hidden input: this
         form builds its FormData from react-hook-form's values, so anything the
         widget injects into the DOM never reaches the action. */
      data.set("turnstileToken", turnstileToken);

      const result = await submitEnquiry({ status: "idle" }, data);

      if (result.status === "success") {
        setSubmitted(result.id);
        toast.success("Запитването е изпратено.");
        /**
         * The one event that matters on this site.
         *
         * Fired after the server confirms, never on click: an event on the
         * button counts intent, and intent is not the number anyone is trying
         * to learn. The properties are the context the enquiry already carries,
         * so the figures answer whether the recommender, the calculator or the
         * plain model pages are what produce enquiries. No personal data - the
         * machine and the route, never the name or the phone number.
         */
        trackEvent("enquiry_submitted", {
          source: context.source ?? "direct",
          model: context.modelSlug ?? "none",
          term: context.term ?? 0,
          fromRecommender: Boolean(context.recommenderSummary),
        });
      } else if (result.status === "error") {
        toast.error(result.message);
        // A token is single-use. Retrying with the spent one fails as "not
        // human", which would blame the visitor for our error.
        if (turnstileEnabled) {
          setTurnstileToken("");
          resetTurnstile();
        }
      }
    });
  });

  if (submitted) {
    return (
      <div>
        <p className="stencil text-[10px] text-status-available">Изпратено</p>
        <h2 className="mt-3 text-[26px] leading-tight md:text-[30px]">
          Получихме запитването ви
        </h2>
        <p className="mt-4 text-lead text-ink-muted text-pretty">
          {company.responsePromise}. Работно време: {company.workingHours}{" "}
          {company.outOfHoursNote}
        </p>
        <p className="tabular mt-5 text-ui text-ink-muted">
          Номер на запитването: <strong className="text-ink">{submitted}</strong>
        </p>
        <p className="mt-6 text-ui">
          <Link
            href={routes.home}
            className="font-semibold underline underline-offset-4 hover-fine:text-ink-muted"
          >
            Обратно към началото
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {/* Honeypot. */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor={id("website")}>Не попълвайте това поле</label>
        <input
          id={id("website")}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register("website")}
        />
      </div>

      {/* Their evidence that the context travelled. Shown in the words they
          were just reading. */}
      {(context.modelName || context.term || context.recommenderSummary) && (
        <div className="border-l-2 border-accent bg-paper-sunken p-4 text-ui">
          <p className="plate text-[0.6875rem] text-ink-subtle">Вашият избор</p>
          <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-ink-muted">
            {/* A recommendation is a plan of several machines. Showing only its
                first line here would contradict the page they came from. */}
            {context.recommenderSummary && (
              <li className="basis-full leading-6">
                {context.recommenderSummary}
              </li>
            )}
            {!context.recommenderSummary && context.modelName && (
              <li>{context.modelName}</li>
            )}
            {context.term && <li>Срок: {context.term} месеца</li>}
            {/* The summary already carries the plan's total; one machine's rate
                next to it would read as a contradiction. */}
            {context.monthlyEur && !context.recommenderSummary && (
              <li className="tabular font-semibold text-ink">
                от {context.monthlyEur} €/месец
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={id("name")} label="Име" error={errors.name?.message}>
          <input
            id={id("name")}
            type="text"
            autoComplete="name"
            aria-invalid={!!errors.name}
            aria-describedby={describedBy(id("name"), { error: !!errors.name })}
            className={inputClass(!!errors.name)}
            {...register("name")}
          />
        </Field>
        <Field id={id("company")} label="Фирма" error={errors.company?.message}>
          <input
            id={id("company")}
            type="text"
            autoComplete="organization"
            aria-invalid={!!errors.company}
            aria-describedby={describedBy(id("company"), { error: !!errors.company })}
            className={inputClass(!!errors.company)}
            {...register("company")}
          />
        </Field>
        <Field id={id("phone")} label="Телефон" error={errors.phone?.message}>
          <input
            id={id("phone")}
            type="tel"
            autoComplete="tel"
            aria-invalid={!!errors.phone}
            aria-describedby={describedBy(id("phone"), { error: !!errors.phone })}
            className={inputClass(!!errors.phone)}
            {...register("phone")}
          />
        </Field>
        <Field id={id("email")} label="Имейл" error={errors.email?.message}>
          <input
            id={id("email")}
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={describedBy(id("email"), { error: !!errors.email })}
            className={inputClass(!!errors.email)}
            {...register("email")}
          />
        </Field>
      </div>

      <Field
        id={id("vatNumber")}
        label="ДДС номер"
        optional
        hint="Ако фирмата е регистрирана по ДДС. Ускорява изготвянето на офертата."
        error={errors.vatNumber?.message}
      >
        <input
          id={id("vatNumber")}
          type="text"
          aria-invalid={!!errors.vatNumber}
          aria-describedby={describedBy(id("vatNumber"), {
            hint: true,
            error: !!errors.vatNumber,
          })}
          className={inputClass(!!errors.vatNumber)}
          {...register("vatNumber")}
        />
      </Field>

      <Field
        id={id("message")}
        label="Съобщение"
        optional
        error={errors.message?.message}
      >
        <textarea
          id={id("message")}
          aria-describedby={describedBy(id("message"), { error: !!errors.message })}
          rows={4}
          className="mt-2 w-full rounded-sm border border-line-strong bg-paper-raised px-3.5 py-3 text-body-lg transition-colors duration-[--duration-fast] ease-[--ease-out] focus:border-ink"
          {...register("message")}
        />
      </Field>

      <div>
        <label className="flex cursor-pointer items-start gap-3 text-ui text-ink-muted">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 shrink-0 accent-accent"
            aria-invalid={!!errors.consent}
            aria-describedby={describedBy(id("consent"), { error: !!errors.consent })}
            {...register("consent")}
          />
          {/* Each space sits inside a string with words in it. On its own, as
              `{" "}` beside the link, Chrome dropped it from the checkbox's
              name: "сполитиката за поверителности искам". */}
          <span>
            {"Запознах се с "}
            <Link
              href={routes.legal.privacy}
              className="underline underline-offset-4"
            >
              политиката за поверителност
            </Link>
            {" и искам да получа оферта."}
          </span>
        </label>
        {errors.consent && (
          <p
            id={`${id("consent")}-error`}
            className="mt-1.5 text-sm font-medium text-danger"
            role="alert"
          >
            {errors.consent.message}
          </p>
        )}
      </div>

      <Turnstile onToken={setTurnstileToken} language="bg" />

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? "Изпращане..." : "Изпрати запитване"}
      </Button>
    </form>
  );
}
