import "server-only";
import { randomUUID } from "node:crypto";
import { company } from "@/lib/company";
import {
  getMailboxStore,
  headerValue,
  matchThread,
  parseMessageIds,
  type MailAttachment,
} from "./mailbox-store";

/**
 * Inbound mail: info@rent-a-vend.com -> the database, then the owner's Gmail.
 *
 * Two things happen to every incoming message, in that order and for different
 * reasons. It is RECORDED, so the conversation can be answered from the admin
 * panel and go out as info@ - which a forward can never do, because a reply
 * from Gmail leaves as the Gmail address. And it is FORWARDED, because a panel
 * nobody has open notifies nobody, and the owner already watches his Gmail.
 *
 * Recording first is deliberate. A forward that fails costs a notification; a
 * record that never happens costs the conversation.
 *
 * WHY NOT `resend.emails.receiving.forward()`. The SDK ships one, and it does
 * almost this. It does not set Reply-To (see forwardPassthrough in
 * resend/dist/index.mjs), so the copy arrives from our own domain and pressing
 * Reply in Gmail writes back to us instead of to the customer. On a site whose
 * headline promise is an answer within one working hour, that is the whole
 * point of the feature, so the forty lines below are ours.
 *
 * The one thing forwarding cannot do is make the reply leave AS info@ - it
 * goes out as the Gmail address. Only a real mailbox (Workspace, Zoho) fixes
 * that, and it costs a monthly fee for one seat.
 *
 * Webhooks carry metadata only: no body, no attachments. Both need a second
 * call to the Received Emails API.
 */

/** Where forwarded mail lands. The same inbox that gets enquiry notifications:
 *  one place to read, not two. */
const INBOX = process.env.MAIL_TO;

/** The domain we receive on. Anything already from here is not forwarded - see
 *  the loop guard below. */
const OUR_DOMAIN = company.email.slice(company.email.indexOf("@") + 1);

/**
 * How much attachment we are willing to re-upload, before base64 inflates it
 * by a third. Resend refuses a message over 40 MB, and a refusal loses the
 * whole forward rather than one PDF, so anything above this is left in the
 * Resend dashboard and named in the body.
 */
const ATTACHMENT_BUDGET = 15_000_000;

export type InboundResult =
  | { status: "forwarded"; id: string }
  /** Understood and deliberately not forwarded. Still a 200: a retry would do
   *  the same thing again. */
  | { status: "ignored"; reason: string }
  | { status: "unauthorized" }
  /** Something broke on our side or Resend's. Answered with a 500 so Resend
   *  retries rather than dropping a customer's email on the floor. */
  | { status: "failed"; error: string };

/** A display name that cannot break the From header. Quotes, angle brackets,
 *  commas and newlines are all header syntax, and this string comes from a
 *  stranger. */
function displayName(from: string): string {
  const withoutAddress = from.replace(/<[^>]*>/, "").trim();
  const name = withoutAddress.replace(/^"|"$/g, "").trim() || from;
  return name.replace(/[<>"\\,;:\r\n]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
}

/** The envelope, restated at the top of the forwarded copy. Without it the
 *  original sender and recipient are lost: the copy is from us, to the Gmail. */
function envelopeLines(email: {
  from: string;
  received_for: string[];
  created_at: string;
}): string[] {
  return [
    `От: ${email.from}`,
    `До: ${email.received_for.join(", ")}`,
    `Получено: ${new Date(email.created_at).toLocaleString("bg-BG")}`,
  ];
}

export async function handleInboundEmail(
  /** The raw request body, byte for byte. Verification is over the exact
   *  bytes, so it must not have been through JSON.parse and back. */
  payload: string,
  headers: { id: string; timestamp: string; signature: string },
): Promise<InboundResult> {
  const key = process.env.RESEND_API_KEY;
  const secret = process.env.RESEND_WEBHOOK_SECRET;

  if (!key || !secret) {
    return { status: "failed", error: "липсва RESEND_API_KEY или RESEND_WEBHOOK_SECRET" };
  }
  if (!INBOX) {
    return { status: "failed", error: "липсва MAIL_TO - няма къде да се препрати" };
  }
  if (INBOX.endsWith(`@${OUR_DOMAIN}`)) {
    // Forwarding our own domain to itself is an infinite loop with a rate limit
    // at the end of it.
    return { status: "failed", error: `MAIL_TO сочи към @${OUR_DOMAIN}` };
  }

  const { Resend } = await import("resend");
  const resend = new Resend(key);

  let event;
  try {
    event = resend.webhooks.verify({ payload, headers, webhookSecret: secret });
  } catch {
    return { status: "unauthorized" };
  }

  if (event.type !== "email.received") {
    return { status: "ignored", reason: event.type };
  }

  const emailId = event.data.email_id;

  /* The sender is on our own domain: our own acknowledgement bouncing, or a
     copy of something we sent. Forwarding it starts a ping-pong. */
  if (event.data.from.toLowerCase().includes(`@${OUR_DOMAIN}`)) {
    return { status: "ignored", reason: `подател от @${OUR_DOMAIN}` };
  }

  const { data: email, error } = await resend.emails.receiving.get(emailId);
  if (error || !email) {
    return { status: "failed", error: error?.message ?? "празен отговор" };
  }

  const { data: list } = await resend.emails.receiving.attachments.list({ emailId });
  const held = list?.data ?? [];

  /* Recorded before anything is forwarded. If this throws we answer 500 and
     Resend retries the whole webhook; the insert conflicts on Resend's own id
     the second time round, so a retry costs a duplicate Gmail copy at worst
     and never a duplicate conversation. */
  try {
    await record(email, emailId, held);
  } catch (err) {
    return {
      status: "failed",
      error: `записът в пощенската кутия се провали: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  /* Attachments come back as signed download URLs, not bytes. Fetch each and
     re-encode, stopping at the budget rather than failing the whole message. */
  const attachments: { filename: string; content: string; contentType: string }[] = [];
  const skipped: string[] = [];
  let spent = 0;

  for (const item of held) {
    const name = item.filename ?? "прикачен файл";
    if (spent + item.size > ATTACHMENT_BUDGET) {
      skipped.push(name);
      continue;
    }
    try {
      const response = await fetch(item.download_url);
      if (!response.ok) {
        skipped.push(name);
        continue;
      }
      const bytes = Buffer.from(await response.arrayBuffer());
      attachments.push({
        filename: name,
        content: bytes.toString("base64"),
        contentType: item.content_type,
      });
      spent += bytes.byteLength;
    } catch {
      // One unreachable attachment must not cost the message it came with.
      skipped.push(name);
    }
  }

  const envelope = envelopeLines(email);
  if (skipped.length > 0) {
    envelope.push(
      `Непрепратени файлове (твърде големи, останали в Resend): ${skipped.join(", ")}`,
    );
  }

  const text = [...envelope, "", "---", "", email.text ?? "(празно съобщение)"].join("\n");
  /* Same two greys as src/emails/*.tsx. Inline and literal because an email
     body has no stylesheet and no custom properties to read from. */
  const html = email.html
    ? `<div style="font:13px/1.5 ui-sans-serif,system-ui,sans-serif;color:#56534c">${envelope
        .map((line) => `${escapeHtml(line)}<br>`)
        .join("")}</div><hr style="border:0;border-top:1px solid #e0ddd6;margin:16px 0">${email.html}`
    : undefined;

  /* Reply-To is the whole reason this file exists. The copy is sent by us, so
     without it Reply answers us; with it, Reply answers the customer. */
  const replyTo = email.reply_to?.length ? email.reply_to : [email.from];

  const sent = await resend.emails.send({
    from: `"${displayName(email.from)} чрез ${company.brandName}" <${company.email}>`,
    to: INBOX,
    subject: email.subject || "(без тема)",
    text,
    ...(html ? { html } : {}),
    replyTo,
    ...(attachments.length > 0 ? { attachments } : {}),
  });

  if (sent.error || !sent.data) {
    return { status: "failed", error: sent.error?.message ?? "празен отговор" };
  }

  return { status: "forwarded", id: sent.data.id };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** `"Иван Иванов" <ivan@example.bg>` taken apart. The address is lowercased
 *  because it is used as a key; the name is left as written. */
export function parseAddress(header: string): {
  name: string | null;
  address: string;
} {
  const angle = header.match(/<([^>]+)>/);
  if (!angle) return { name: null, address: header.trim().toLowerCase() };

  const name = header.slice(0, angle.index).trim().replace(/^"|"$/g, "").trim();
  return { name: name || null, address: angle[1].trim().toLowerCase() };
}

/**
 * File the message in the mailbox.
 *
 * Where it goes is `matchThread`'s decision; this only mints a thread when
 * there is nothing to attach it to. The id is short and uppercase like an
 * enquiry reference, because it ends up in a URL the owner may read out.
 */
async function record(
  email: {
    from: string;
    to: string[];
    subject: string;
    text: string | null;
    html: string | null;
    created_at: string;
    message_id: string;
    headers: Record<string, string> | null;
  },
  emailId: string,
  held: { id: string; filename?: string; size: number; content_type: string }[],
): Promise<void> {
  const store = getMailboxStore();
  const sender = parseAddress(email.from);
  const subject = email.subject || "(без тема)";

  /* In-Reply-To names the parent, References names every ancestor. Both are
     offered to the matcher: a client that sends only one of them is common. */
  const references = [
    ...parseMessageIds(headerValue(email.headers, "in-reply-to")),
    ...parseMessageIds(headerValue(email.headers, "references")),
  ];

  let threadId = await matchThread(store, references, sender.address, subject);

  if (!threadId) {
    threadId = randomUUID().slice(0, 8).toUpperCase();
    await store.createThread({
      id: threadId,
      createdAt: email.created_at,
      subject,
      correspondent: sender.address,
      correspondentName: sender.name,
    });
  }

  const attachments: MailAttachment[] = held.map((item) => ({
    filename: item.filename ?? "прикачен файл",
    size: item.size,
    contentType: item.content_type,
  }));

  await store.addMessage({
    id: emailId,
    threadId,
    createdAt: email.created_at,
    direction: "in",
    fromAddress: email.from,
    toAddresses: email.to.join(", "),
    subject,
    bodyText: email.text,
    bodyHtml: email.html,
    messageId: email.message_id,
    inReplyTo: headerValue(email.headers, "in-reply-to") ?? null,
    attachments: attachments.length > 0 ? attachments : null,
  });
}
