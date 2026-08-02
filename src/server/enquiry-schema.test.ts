import { describe, expect, it } from "vitest";
import { enquiryInputSchema } from "./enquiry-schema";

const valid = {
  name: "Иван Петров",
  email: "ivan@example.com",
  phone: "0888123456",
  company: "Тестова Фабрика ЕООД",
  consent: "on",
};

describe("enquiry validation", () => {
  it("accepts the four required fields plus consent", () => {
    expect(enquiryInputSchema.safeParse(valid).success).toBe(true);
  });

  it("requires consent - an unticked box is not a submission", () => {
    const { consent, ...withoutConsent } = valid;
    void consent;
    expect(enquiryInputSchema.safeParse(withoutConsent).success).toBe(false);
  });

  for (const field of ["name", "email", "phone", "company"] as const) {
    it(`rejects a missing ${field}`, () => {
      const { [field]: _omitted, ...rest } = valid;
      void _omitted;
      expect(enquiryInputSchema.safeParse(rest).success).toBe(false);
    });
  }

  it("rejects a malformed email", () => {
    expect(
      enquiryInputSchema.safeParse({ ...valid, email: "не-е-имейл" }).success,
    ).toBe(false);
  });

  it("leaves the VAT number optional", () => {
    // The business contracts with sole traders too, who may not be VAT
    // registered. Requiring it would exclude a real customer segment.
    expect(enquiryInputSchema.safeParse({ ...valid, vatNumber: "" }).success).toBe(true);
    expect(
      enquiryInputSchema.safeParse({ ...valid, vatNumber: "BG123456789" }).success,
    ).toBe(true);
  });

  it("carries machine, term and source without asking for them", () => {
    const parsed = enquiryInputSchema.parse({
      ...valid,
      modelSlug: "necta-snakky",
      term: "36",
      source: "model",
    });
    expect(parsed.modelSlug).toBe("necta-snakky");
    expect(parsed.term).toBe(36);
    expect(parsed.source).toBe("model");
  });

  it("defaults source to direct when nothing was carried", () => {
    expect(enquiryInputSchema.parse(valid).source).toBe("direct");
  });

  it("trims surrounding whitespace", () => {
    const parsed = enquiryInputSchema.parse({ ...valid, name: "  Иван  " });
    expect(parsed.name).toBe("Иван");
  });

  it("treats a filled honeypot as invalid input", () => {
    const result = enquiryInputSchema.safeParse({ ...valid, website: "spam" });
    expect(result.success).toBe(false);
  });

  it("bounds every free-text field so a payload cannot be unbounded", () => {
    expect(
      enquiryInputSchema.safeParse({ ...valid, message: "x".repeat(2001) }).success,
    ).toBe(false);
    expect(
      enquiryInputSchema.safeParse({ ...valid, name: "x".repeat(121) }).success,
    ).toBe(false);
  });
});
