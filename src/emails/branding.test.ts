import { describe, expect, it } from "vitest";
import { render } from "@react-email/components";
import { company } from "@/lib/company";
import { palette } from "./theme";
import { Reply } from "./reply";
import { EnquiryAcknowledgement } from "./enquiry-acknowledgement";
import { EnquiryNotification } from "./enquiry-notification";
import type { EnquiryRecord } from "@/server/enquiry-store";

/**
 * The design system, asserted where it cannot be linted.
 *
 * Email templates escape every other check the project has: no Tailwind class
 * to grep, no rendered URL for the design detectors to crawl, and a body that
 * only exists after React has run. So the rules that matter are checked here,
 * against the actual rendered HTML.
 *
 * These are deliberately invariants rather than snapshots. A snapshot of an
 * email breaks on every wording change and teaches everyone to re-record it
 * without looking, which is worse than no test.
 */

const enquiry: EnquiryRecord = {
  id: "A1B2C3D4",
  createdAt: "2026-08-03T09:00:00.000Z",
  name: "Иван Иванов",
  email: "ivan@example.bg",
  phone: "+359 888 123 456",
  company: "Пример ЕООД",
  vatNumber: null,
  message: "Интересува ме кафемашина за офис с 30 души.",
  modelSlug: null,
  term: 24,
  source: "contact",
  recommenderSummary: null,
  status: "new",
  notes: null,
};

const templates: [name: string, html: Promise<string>][] = [
  ["reply", render(Reply({ body: "Здравейте, машината е налична." }))],
  ["acknowledgement", render(EnquiryAcknowledgement({ enquiry }))],
  ["notification", render(EnquiryNotification({ enquiry }))],
];

describe.each(templates)("%s", (_name, htmlPromise) => {
  it("carries the letterhead and the contact details", async () => {
    const html = await htmlPromise;
    expect(html).toContain(company.brandName);
    expect(html).toContain(company.email);
    expect(html).toContain(company.phone);
  });

  it("carries the safety-yellow band", async () => {
    /* The one piece of brand colour in the frame. If it disappears the mail
       still sends, still reads, and stops looking like ours. */
    expect(await htmlPromise).toContain(palette.accent);
  });

  it("declares Bulgarian, so the right Cyrillic letterforms are drawn", async () => {
    // The Bulgarian Letterforms Rule. в г д и к л п ц ш щ are drawn
    // differently from Russian, and the language attribute is what selects them.
    expect(await htmlPromise).toContain('lang="bg"');
  });

  it("keeps every font size at or above the eleven pixel floor", async () => {
    const html = await htmlPromise;
    const sizes = [...html.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)].map((m) =>
      Number(m[1]),
    );

    expect(sizes.length).toBeGreaterThan(0);
    expect(sizes.filter((size) => size < 11)).toEqual([]);
  });

  it("uses no em-dashes in the copy", async () => {
    /* House rule: zero em-dashes in user-visible text. Cheap to check, and the
       one typographic tell that survives copy-paste from a chat window. */
    expect(await htmlPromise).not.toContain("—");
  });
});
