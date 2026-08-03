import { Hr, Section, Text } from "@react-email/components";
import { company } from "@/lib/company";
import type { EnquiryRecord } from "@/server/enquiry-store";
import { Eyebrow, MailShell, palette } from "./theme";

/**
 * What the visitor receives, immediately.
 *
 * Its only job is to set an honest expectation. One person answers these,
 * Monday to Friday, 09:00 to 18:00 - so an enquiry sent at 18:30 on Friday is
 * answered Monday morning, and this message says so rather than implying an
 * hour. A promise kept beats a promise that sounded better.
 *
 * Frame, palette and footer come from `theme.tsx`; only what is particular to
 * an acknowledgement lives here.
 */
export function EnquiryAcknowledgement({ enquiry }: { enquiry: EnquiryRecord }) {
  return (
    <MailShell preview={`Получихме запитването ви. ${company.responsePromise}.`}>
      <Section style={{ padding: "28px 24px" }}>
        <Text
          style={{
            margin: 0,
            fontSize: "22px",
            lineHeight: "28px",
            fontWeight: 700,
            color: palette.ink,
          }}
        >
          Получихме запитването ви
        </Text>

        <Text
          style={{
            margin: "14px 0 0",
            fontSize: "15px",
            lineHeight: "24px",
            color: palette.ink,
          }}
        >
          Здравейте, {enquiry.name}. Благодарим ви - ще прегледаме запитването и
          ще се върнем с конкретна машина, срок и цена.
        </Text>

        <Hr style={{ borderColor: palette.line, margin: "22px 0" }} />

        <Eyebrow>Кога да очаквате отговор</Eyebrow>
        <Text
          style={{
            margin: "4px 0 0",
            fontSize: "15px",
            lineHeight: "24px",
            color: palette.ink,
          }}
        >
          {company.responsePromise}. Работно време: {company.workingHours}
        </Text>
        <Text
          style={{
            margin: "8px 0 0",
            fontSize: "14px",
            lineHeight: "22px",
            color: palette.muted,
          }}
        >
          {company.outOfHoursNote}
        </Text>

        <Hr style={{ borderColor: palette.line, margin: "22px 0" }} />

        <Text style={{ margin: 0, fontSize: "13px", lineHeight: "20px", color: palette.muted }}>
          Номер на запитването:{" "}
          <strong style={{ color: palette.ink, fontVariantNumeric: "tabular-nums" }}>
            {enquiry.id}
          </strong>
          <br />
          Ако нещо се промени, отговорете на този имейл.
        </Text>
      </Section>
    </MailShell>
  );
}

export default EnquiryAcknowledgement;
