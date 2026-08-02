import "server-only";
import type { ReactElement } from "react";
import { company } from "@/lib/company";
import { EnquiryNotification } from "@/emails/enquiry-notification";
import { EnquiryAcknowledgement } from "@/emails/enquiry-acknowledgement";
import type { EnquiryRecord } from "./enquiry-store";

/**
 * Transactional email.
 *
 * Two messages go out per enquiry: a notification to the owner carrying every
 * piece of context the visitor already gave, so he can reply with a real price
 * rather than a round of questions; and an acknowledgement to the visitor that
 * states the working-hours qualifier honestly.
 *
 * Sending is best-effort and never blocks the response. The stored row is the
 * source of truth; if email fails the lead still exists.
 */

/* rent-a-vend.com is verified for sending in Resend, so the published address
   is also the default sender. MAIL_FROM still overrides it - a staging deploy
   has no business sending as the live brand. */
const FROM = process.env.MAIL_FROM || `${company.brandName} <${company.email}>`;

/* Falls back to the published address rather than nowhere. That inbox is real
   - it forwards to the owner's Gmail through src/server/inbound.ts - so a
   missing MAIL_TO costs a hop, not a lead. */
const TO = process.env.MAIL_TO || company.email;

export interface MailResult {
  delivered: boolean;
  channel: "resend" | "console";
  error?: string;
}

function notificationBody(e: EnquiryRecord): string {
  const lines = [
    `Ново запитване от сайта`,
    ``,
    `Име:      ${e.name}`,
    `Фирма:    ${e.company}`,
    `Телефон:  ${e.phone}`,
    `Имейл:    ${e.email}`,
  ];

  if (e.vatNumber) lines.push(`ДДС:      ${e.vatNumber}`);
  lines.push(``);

  if (e.modelSlug) lines.push(`Машина:   ${e.modelSlug}`);
  if (e.unitRef) lines.push(`Апарат:   ${e.unitRef}`);
  if (e.term) lines.push(`Срок:     ${e.term} месеца`);
  lines.push(`Източник: ${e.source}`);

  if (e.recommenderSummary) {
    lines.push(``, `От калкулатора:`, e.recommenderSummary);
  }

  if (e.message) lines.push(``, `Съобщение:`, e.message);

  lines.push(``, `Получено: ${new Date(e.createdAt).toLocaleString("bg-BG")}`);
  lines.push(`Номер: ${e.id}`);

  return lines.join("\n");
}

function acknowledgementBody(e: EnquiryRecord): string {
  return [
    `Здравейте, ${e.name},`,
    ``,
    `Получихме запитването ви и ще се свържем с вас.`,
    ``,
    company.responsePromise + ".",
    `Работно време: ${company.workingHours}`,
    company.outOfHoursNote,
    ``,
    `Номер на запитването: ${e.id}`,
    ``,
    `Поздрави,`,
    company.brandName,
  ].join("\n");
}

async function send(
  to: string,
  subject: string,
  /** Rendered React template. */
  react: ReactElement,
  /** Plain-text twin. Not a fallback nicety: some clients render text only,
   *  and a message with no text part scores worse with spam filters. */
  text: string,
  /** Who a reply should reach. Without it, replying to the notification sends
   *  mail to our own from-address instead of to the customer. */
  replyTo?: string,
): Promise<MailResult> {
  const key = process.env.RESEND_API_KEY;

  if (!key) {
    // Dev fallback: never silently swallow a lead.
    console.info(`\n--- MAIL (не е изпратен, липсва RESEND_API_KEY) ---`);
    console.info(`До: ${to}\nТема: ${subject}\n\n${text}\n`);
    return { delivered: false, channel: "console" };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      react,
      text,
      ...(replyTo ? { replyTo } : {}),
    });
    if (error) return { delivered: false, channel: "resend", error: error.message };
    return { delivered: true, channel: "resend" };
  } catch (err) {
    return {
      delivered: false,
      channel: "resend",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function sendEnquiryEmails(e: EnquiryRecord): Promise<{
  notification: MailResult;
  acknowledgement: MailResult;
}> {
  const [notification, acknowledgement] = await Promise.all([
    /* Reply-To is the customer. The response promise is one working hour, and
       the fastest path to honouring it is pressing Reply - not copying an
       address out of the body into a new message. */
    send(
      TO,
      `Ново запитване: ${e.company} (${e.id})`,
      EnquiryNotification({ enquiry: e }),
      notificationBody(e),
      e.email,
    ),
    send(
      e.email,
      `Получихме вашето запитване`,
      EnquiryAcknowledgement({ enquiry: e }),
      acknowledgementBody(e),
    ),
  ]);

  return { notification, acknowledgement };
}
