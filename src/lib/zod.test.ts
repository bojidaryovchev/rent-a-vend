import { describe, expect, it } from "vitest";
import { z } from "@/lib/zod";
import { enquiryInputSchema } from "@/server/enquiry-schema";

/**
 * The visitor reads Bulgarian. A Latin letter in a validation message means an
 * untranslated Zod default has reached the page - which is exactly how "Too big:
 * expected string to have <=32 characters" once appeared under "ДДС номер".
 *
 * Digits and punctuation are fine; letters are not.
 */
const LATIN = /[A-Za-z]/;

const messagesFor = (schema: z.ZodType, input: unknown): string[] => {
  const result = schema.safeParse(input);
  expect(result.success).toBe(false);
  return result.success ? [] : result.error.issues.map((i) => i.message);
};

describe("Bulgarian validation messages", () => {
  it("covers every built-in failure Zod can raise on a form", () => {
    const cases: Array<[z.ZodType, unknown]> = [
      [z.string(), undefined],
      [z.string(), 42],
      [z.string().min(2), "a"],
      [z.string().min(1), ""],
      [z.string().max(32), "x".repeat(33)],
      [z.string().max(1), "xx"],
      [z.email(), "не-е-имейл"],
      [z.url(), "не-е-адрес"],
      [z.number(), "abc"],
      [z.number().min(1), 0],
      [z.number().max(10), 11],
      [z.number().int(), 1.5],
      [z.number().multipleOf(5), 7],
      [z.array(z.string()).min(1), []],
      [z.array(z.string()).max(1), ["a", "b"]],
      [z.enum(["a", "b"]), "c"],
      [z.literal("on"), "off"],
      [z.boolean(), "не"],
      [z.object({ a: z.string() }).strict(), { a: "x", b: "y" }],
      [z.iso.date(), "вчера"],
    ];

    for (const [schema, input] of cases) {
      for (const message of messagesFor(schema, input)) {
        expect(message, `${JSON.stringify(input)} -> "${message}"`).not.toMatch(
          LATIN,
        );
      }
    }
  });

  it("says how many characters are allowed, not which type failed", () => {
    expect(messagesFor(z.string().max(32), "x".repeat(33))).toEqual([
      "Максимум 32 символа.",
    ]);
    expect(messagesFor(z.string().max(1), "xx")).toEqual(["Максимум 1 символ."]);
    expect(messagesFor(z.string().min(2), "x")).toEqual(["Минимум 2 символа."]);
  });

  it("leaves an explicit message on a rule untouched", () => {
    expect(messagesFor(z.string().min(2, "Моля, въведете име."), "и")).toEqual([
      "Моля, въведете име.",
    ]);
  });
});

describe("enquiry form messages", () => {
  const valid = {
    name: "Иван Петров",
    email: "ivan@example.com",
    phone: "0888123456",
    company: "Тестова Фабрика ЕООД",
    consent: "on",
  };

  /** Every way a visitor can get this form wrong, field by field. */
  const wrong: Array<Record<string, unknown>> = [
    {},
    { ...valid, name: "и" },
    { ...valid, name: "x".repeat(121) },
    { ...valid, email: "не-е-имейл" },
    { ...valid, email: `${"x".repeat(160)}@example.com` },
    { ...valid, phone: "088" },
    { ...valid, phone: "0".repeat(41) },
    { ...valid, company: "Ф" },
    { ...valid, company: "x".repeat(161) },
    { ...valid, vatNumber: "x".repeat(33) },
    { ...valid, message: "x".repeat(2001) },
    { ...valid, modelSlug: "x".repeat(121) },
    { ...valid, recommenderSummary: "x".repeat(1001) },
    { ...valid, source: "неизвестен" },
    { ...valid, term: "не-е-число" },
    { ...valid, consent: undefined },
    { ...valid, consent: "off" },
    { ...valid, website: "spam" },
  ];

  it("never shows the visitor an English message", () => {
    for (const input of wrong) {
      for (const message of messagesFor(enquiryInputSchema, input)) {
        expect(message, `-> "${message}"`).not.toMatch(LATIN);
      }
    }
  });
});
