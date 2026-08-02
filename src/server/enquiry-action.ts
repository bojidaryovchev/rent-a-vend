"use server";

import { randomUUID } from "node:crypto";
import { getEnquiryStore, type NewEnquiry } from "./enquiry-store";
import { enquiryInputSchema, type EnquiryState } from "./enquiry-schema";
import { sendEnquiryEmails } from "./mailer";
import { verifyTurnstile } from "./turnstile";

/**
 * The enquiry endpoint.
 *
 * Four visible fields. Machine, term and site profile are carried from wherever
 * the visitor came from rather than asked again: measured form data puts three
 * fields near 23% completion and seven near 11%, and this is the only page on
 * the site whose conversion actually matters.
 *
 * Order of operations is deliberate. Validate, store, THEN email. If email
 * fails the lead is already safe, and the visitor still sees success - because
 * from their side it did succeed.
 *
 * This module exports exactly one async function, as a `"use server"` file must.
 */

const blank = (v: string | undefined): string | null =>
  v === undefined || v === "" ? null : v;

export async function submitEnquiry(
  _prev: EnquiryState,
  formData: FormData,
): Promise<EnquiryState> {
  const parsed = enquiryInputSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return {
      status: "error",
      message: "Проверете отбелязаните полета.",
      fieldErrors,
    };
  }

  const input = parsed.data;

  // Honeypot: a filled hidden field is a bot. Fail quietly rather than
  // explaining the trap.
  if (input.website) {
    return { status: "success", id: "OK" };
  }

  const human = await verifyTurnstile(input.turnstileToken);
  if (!human) {
    return {
      status: "error",
      message:
        "Не успяхме да потвърдим, че заявката е от човек. Опитайте отново или се обадете.",
    };
  }

  const enquiry: NewEnquiry = {
    name: input.name,
    email: input.email,
    phone: input.phone,
    company: input.company,
    vatNumber: blank(input.vatNumber),
    message: blank(input.message),
    modelSlug: blank(input.modelSlug),
    unitRef: blank(input.unitRef),
    term: input.term ?? null,
    source: input.source,
    recommenderSummary: blank(input.recommenderSummary),
  };

  const id = randomUUID().slice(0, 8).toUpperCase();
  const createdAt = new Date().toISOString();

  let record;
  try {
    record = await getEnquiryStore().save(enquiry, id, createdAt);
  } catch (err) {
    console.error("Запитването не беше записано:", err);
    return {
      status: "error",
      message:
        "Възникна техническа грешка. Обадете се или опитайте отново след минута.",
    };
  }

  // Email is a notification, not the record. A failure here is logged loudly
  // but never shown to the visitor, whose enquiry is already stored.
  try {
    const result = await sendEnquiryEmails(record);
    if (!result.notification.delivered) {
      console.error(
        `ВНИМАНИЕ: известието за запитване ${id} не беше изпратено.`,
        result.notification.error ?? "(няма ключ за имейл)",
      );
    }
  } catch (err) {
    console.error(`ВНИМАНИЕ: имейлът за запитване ${id} се провали:`, err);
  }

  return { status: "success", id };
}
