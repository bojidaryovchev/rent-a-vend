import { z } from "zod";

/**
 * Enquiry validation, kept out of the `"use server"` module.
 *
 * A file marked `"use server"` may only export async functions - every other
 * export becomes an invalid server reference. Schema and types therefore live
 * here, where both the action and any client code can import them safely.
 */

export const enquiryInputSchema = z.object({
  name: z.string().trim().min(2, "Моля, въведете име.").max(120),
  email: z.string().trim().email("Проверете имейл адреса.").max(160),
  phone: z.string().trim().min(6, "Моля, въведете телефон.").max(40),
  company: z.string().trim().min(2, "Моля, въведете име на фирмата.").max(160),

  // Optional because the business contracts with sole traders too, who may not
  // be VAT registered.
  vatNumber: z.string().trim().max(32).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),

  // Carried context - never re-asked.
  modelSlug: z.string().trim().max(120).optional().or(z.literal("")),
  term: z.coerce.number().int().optional(),
  source: z
    .enum(["model", "calculator", "recommender", "contact", "direct"])
    .default("direct"),
  recommenderSummary: z.string().trim().max(1000).optional().or(z.literal("")),

  consent: z.literal("on", {
    message: "Моля, потвърдете, че сте се запознали с политиката.",
  }),

  // Bots fill hidden fields; people cannot see this one.
  website: z.string().max(0).optional().or(z.literal("")),

  turnstileToken: z.string().optional(),
});

export type EnquiryInput = z.infer<typeof enquiryInputSchema>;

export type EnquiryState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> }
  | { status: "success"; id: string };
