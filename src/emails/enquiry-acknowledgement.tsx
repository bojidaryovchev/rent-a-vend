import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { company } from "@/lib/company";
import type { EnquiryRecord } from "@/server/enquiry-store";

/**
 * What the visitor receives, immediately.
 *
 * Its only job is to set an honest expectation. One person answers these,
 * Monday to Friday, 09:00 to 18:00 - so an enquiry sent at 18:30 on Friday is
 * answered Monday morning, and this message says so rather than implying an
 * hour. A promise kept beats a promise that sounded better.
 */

const ink = "#2a2825";
const muted = "#56534c";
const line = "#e0ddd6";
const accent = "#ffd400";

export function EnquiryAcknowledgement({ enquiry }: { enquiry: EnquiryRecord }) {
  return (
    <Html lang="bg">
      <Head />
      <Preview>Получихме запитването ви. {company.responsePromise}.</Preview>
      <Body
        style={{
          backgroundColor: "#faf9f7",
          fontFamily: "-apple-system, Segoe UI, Arial, sans-serif",
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
          <Section
            style={{
              backgroundColor: accent,
              padding: "4px 24px",
            }}
          />

          <Section style={{ padding: "28px 24px" }}>
            <Heading as="h1" style={{ margin: 0, fontSize: "22px", color: ink }}>
              Получихме запитването ви
            </Heading>

            <Text
              style={{
                margin: "14px 0 0",
                fontSize: "15px",
                lineHeight: "24px",
                color: ink,
              }}
            >
              Здравейте, {enquiry.name}. Благодарим ви - ще прегледаме
              запитването и ще се върнем с конкретна машина, срок и цена.
            </Text>

            <Hr style={{ borderColor: line, margin: "22px 0" }} />

            <Text
              style={{
                margin: "0 0 4px",
                fontSize: "11px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: muted,
                fontWeight: 700,
              }}
            >
              Кога да очаквате отговор
            </Text>
            <Text
              style={{ margin: 0, fontSize: "15px", lineHeight: "24px", color: ink }}
            >
              {company.responsePromise}. Работно време: {company.workingHours}
            </Text>
            <Text
              style={{
                margin: "8px 0 0",
                fontSize: "14px",
                lineHeight: "22px",
                color: muted,
              }}
            >
              {company.outOfHoursNote}
            </Text>

            <Hr style={{ borderColor: line, margin: "22px 0" }} />

            <Text style={{ margin: 0, fontSize: "13px", color: muted }}>
              Номер на запитването: <strong style={{ color: ink }}>{enquiry.id}</strong>
              <br />
              Ако нещо се промени, отговорете на този имейл.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default EnquiryAcknowledgement;
