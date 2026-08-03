import { Column, Hr, Row, Section, Text } from "@react-email/components";
import type { EnquiryRecord } from "@/server/enquiry-store";
import { Eyebrow, MailShell, palette, plateFont } from "./theme";

/**
 * What the owner receives.
 *
 * The whole point is that he can reply with a real price rather than a round of
 * questions, so every piece of context the visitor already gave is here: the
 * machine, the unit, the term, and the recommender's answers.
 *
 * Email clients are a hostile rendering target - no external CSS, patchy
 * flexbox and grid - so this is tables and inline styles by necessity, not by
 * choice. The frame and the palette come from `theme.tsx`.
 */

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Row style={{ marginBottom: "6px" }}>
      <Column style={{ width: "110px", verticalAlign: "top" }}>
        <Text style={{ margin: 0, fontSize: "12px", lineHeight: "20px", color: palette.muted }}>
          {label}
        </Text>
      </Column>
      <Column>
        <Text
          style={{
            margin: 0,
            fontSize: "14px",
            lineHeight: "20px",
            color: palette.ink,
            fontWeight: 600,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
        </Text>
      </Column>
    </Row>
  );
}

export function EnquiryNotification({ enquiry }: { enquiry: EnquiryRecord }) {
  const hasContext =
    enquiry.modelSlug ?? enquiry.term ?? enquiry.recommenderSummary;

  return (
    <MailShell preview={`Ново запитване: ${enquiry.company} · ${enquiry.name}`}>
      <Section style={{ padding: "24px 24px 20px" }}>
        <Eyebrow>Ново запитване</Eyebrow>
        <Text
          style={{
            margin: "6px 0 20px",
            fontFamily: plateFont,
            fontSize: "24px",
            lineHeight: "28px",
            letterSpacing: "0.01em",
            fontWeight: 700,
            color: palette.ink,
          }}
        >
          {enquiry.company}
        </Text>

        <Field label="Име" value={enquiry.name} />
        <Field label="Телефон" value={enquiry.phone} />
        <Field label="Имейл" value={enquiry.email} />
        {enquiry.vatNumber ? (
          <Field label="ДДС номер" value={enquiry.vatNumber} />
        ) : null}

        {hasContext ? (
          <>
            <Hr style={{ borderColor: palette.line, margin: "20px 0" }} />
            <Eyebrow>Какво вече е избрал</Eyebrow>
            <div style={{ marginTop: "10px" }}>
              {enquiry.modelSlug ? (
                <Field label="Машина" value={enquiry.modelSlug} />
              ) : null}
              {enquiry.term ? (
                <Field label="Срок" value={`${enquiry.term} месеца`} />
              ) : null}
              {enquiry.recommenderSummary ? (
                <Field label="Обект" value={enquiry.recommenderSummary} />
              ) : null}
            </div>
          </>
        ) : null}

        {enquiry.message ? (
          <>
            <Hr style={{ borderColor: palette.line, margin: "20px 0" }} />
            <Eyebrow>Съобщение</Eyebrow>
            <Text
              style={{
                margin: "6px 0 0",
                fontSize: "14px",
                lineHeight: "22px",
                color: palette.ink,
                whiteSpace: "pre-wrap",
              }}
            >
              {enquiry.message}
            </Text>
          </>
        ) : null}

        <Hr style={{ borderColor: palette.line, margin: "20px 0 0" }} />
        <Text
          style={{
            margin: "12px 0 0",
            fontSize: "12px",
            lineHeight: "18px",
            /* On the white sheet, where subtle measures 4.8:1. It would fail
               on the sunken footer - see the note in theme.tsx. */
            color: palette.subtle,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          № {enquiry.id} · източник: {enquiry.source}
        </Text>
      </Section>
    </MailShell>
  );
}

export default EnquiryNotification;
