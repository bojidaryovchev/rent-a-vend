import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Column,
  Section,
  Text,
} from "@react-email/components";
import type { EnquiryRecord } from "@/server/enquiry-store";

/**
 * What the owner receives.
 *
 * The whole point is that he can reply with a real price rather than a round of
 * questions, so every piece of context the visitor already gave is here: the
 * machine, the unit, the term, and the recommender's answers.
 *
 * Email clients are a hostile rendering target - no external CSS, patchy flexbox
 * and grid - so this is tables and inline styles by necessity, not by choice.
 */

const ink = "#2a2825";
const muted = "#56534c";
const line = "#e0ddd6";
const accent = "#ffd400";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Row style={{ marginBottom: "6px" }}>
      <Column style={{ width: "110px", verticalAlign: "top" }}>
        <Text style={{ margin: 0, fontSize: "12px", color: muted }}>{label}</Text>
      </Column>
      <Column>
        <Text style={{ margin: 0, fontSize: "14px", color: ink, fontWeight: 600 }}>
          {value}
        </Text>
      </Column>
    </Row>
  );
}

export function EnquiryNotification({ enquiry }: { enquiry: EnquiryRecord }) {
  const hasContext =
    enquiry.modelSlug ?? enquiry.unitRef ?? enquiry.term ?? enquiry.recommenderSummary;

  return (
    <Html lang="bg">
      <Head />
      <Preview>
        {`Ново запитване: ${enquiry.company} · ${enquiry.name}`}
      </Preview>
      <Body
        style={{
          backgroundColor: "#faf9f7",
          fontFamily: "-apple-system, Segoe UI, Roboto, Arial, sans-serif",
          margin: 0,
          padding: "24px 0",
        }}
      >
        <Container
          style={{
            maxWidth: "560px",
            margin: "0 auto",
            backgroundColor: "#ffffff",
            border: `1px solid ${line}`,
          }}
        >
          <Section style={{ backgroundColor: ink, padding: "16px 24px" }}>
            <Text
              style={{
                margin: 0,
                color: accent,
                fontSize: "11px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              Ново запитване
            </Text>
            <Heading
              as="h1"
              style={{ margin: "6px 0 0", color: "#ffffff", fontSize: "20px" }}
            >
              {enquiry.company}
            </Heading>
          </Section>

          <Section style={{ padding: "24px" }}>
            <Field label="Име" value={enquiry.name} />
            <Field label="Телефон" value={enquiry.phone} />
            <Field label="Имейл" value={enquiry.email} />
            {enquiry.vatNumber ? (
              <Field label="ДДС номер" value={enquiry.vatNumber} />
            ) : null}

            {hasContext ? (
              <>
                <Hr style={{ borderColor: line, margin: "20px 0" }} />
                <Text
                  style={{
                    margin: "0 0 10px",
                    fontSize: "11px",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: muted,
                    fontWeight: 700,
                  }}
                >
                  Какво вече е избрал
                </Text>
                {enquiry.modelSlug ? (
                  <Field label="Машина" value={enquiry.modelSlug} />
                ) : null}
                {enquiry.unitRef ? (
                  <Field label="Апарат" value={enquiry.unitRef} />
                ) : null}
                {enquiry.term ? (
                  <Field label="Срок" value={`${enquiry.term} месеца`} />
                ) : null}
                {enquiry.recommenderSummary ? (
                  <Field label="Обект" value={enquiry.recommenderSummary} />
                ) : null}
              </>
            ) : null}

            {enquiry.message ? (
              <>
                <Hr style={{ borderColor: line, margin: "20px 0" }} />
                <Text
                  style={{
                    margin: "0 0 6px",
                    fontSize: "11px",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: muted,
                    fontWeight: 700,
                  }}
                >
                  Съобщение
                </Text>
                <Text
                  style={{
                    margin: 0,
                    fontSize: "14px",
                    lineHeight: "22px",
                    color: ink,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {enquiry.message}
                </Text>
              </>
            ) : null}
          </Section>

          <Section
            style={{
              borderTop: `1px solid ${line}`,
              backgroundColor: "#f2f0ec",
              padding: "12px 24px",
            }}
          >
            <Text style={{ margin: 0, fontSize: "12px", color: muted }}>
              № {enquiry.id} · източник: {enquiry.source}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default EnquiryNotification;
