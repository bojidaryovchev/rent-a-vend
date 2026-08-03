import "server-only";
import { company } from "@/lib/company";
import { Reply } from "@/emails/reply";
import { renderEmail } from "@/emails/render";
import {
  getMailboxStore,
  normalizeSubject,
  parseMessageIds,
  type MailAttachment,
  type MailThreadDetail,
} from "./mailbox-store";

/**
 * Replying as info@rent-a-vend.com.
 *
 * This is the half a forward to Gmail cannot do. Pressing Reply in Gmail sends
 * from the Gmail address, so the customer's thread shows a company address on
 * the way in and a personal one on the way out - which on a B2B quote reads
 * either as a different person or as a smaller company than the one they wrote
 * to. Sent from here it leaves as info@, signed by our own DKIM.
 *
 * Threading is the other half. `In-Reply-To` and `References` are what put the
 * answer inside the customer's existing conversation instead of starting a new
 * one, and carrying the full References chain is also what lets us recognise
 * their next reply as belonging to this thread - see `matchThread`.
 */

/** Vercel refuses a request body over about 4.5 MB before any of our code
 *  runs, so the honest limit is below that rather than Resend's 40 MB. */
export const REPLY_ATTACHMENT_LIMIT = 4_000_000;

export interface OutgoingAttachment {
  filename: string;
  contentType: string;
  /** Base64. Resend takes bytes or a URL; we have bytes in hand. */
  content: string;
  size: number;
}

export type ReplyResult = { ok: true } | { ok: false; error: string };

/** "оферта" -> "Re: оферта", and "Re: оферта" stays as it is. */
function replySubject(subject: string): string {
  return /^\s*re\s*:/i.test(subject) ? subject : `Re: ${subject}`;
}

/**
 * The chain of ids to quote back.
 *
 * Newest last, deduplicated, capped: References grows by one id per exchange
 * and some clients choke on a header of unbounded length. The first entries
 * matter most for threading, so the cap drops from the middle by keeping the
 * head and the tail.
 */
function referenceChain(thread: MailThreadDetail): string[] {
  const ids = thread.messages
    .flatMap((m) => [...parseMessageIds(m.inReplyTo), ...(m.messageId ? [m.messageId] : [])])
    .filter((id, index, all) => all.indexOf(id) === index);

  return ids.length <= 20 ? ids : [...ids.slice(0, 10), ...ids.slice(-10)];
}

export async function sendReply(
  threadId: string,
  body: string,
  files: OutgoingAttachment[],
): Promise<ReplyResult> {
  const store = getMailboxStore();
  const thread = await store.getThread(threadId);
  if (!thread) return { ok: false, error: "Разговорът не е намерен." };

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return {
      ok: false,
      error: "Липсва RESEND_API_KEY - отговорът не може да бъде изпратен.",
    };
  }

  /* Answer the last thing they actually sent. Replying to the thread's first
     message would thread correctly but quote the wrong parent in clients that
     show one. */
  const lastInbound = [...thread.messages].reverse().find((m) => m.direction === "in");
  const to = lastInbound
    ? lastInbound.fromAddress
    : thread.correspondent;

  const references = referenceChain(thread);
  const headers: Record<string, string> = {};
  if (lastInbound?.messageId) headers["In-Reply-To"] = lastInbound.messageId;
  if (references.length > 0) headers.References = references.join(" ");

  const subject = replySubject(thread.subject);

  /* The plain-text twin. Not a fallback nicety: some clients render text only,
     and a message with no text part scores worse with spam filters. It carries
     the contact details as a signature block because a text part has no
     letterhead to put them in.

     The lone `--` is the standard signature delimiter, and the thread view
     relies on it to hide this block when it lists what we sent - see
     `withoutSignature` in the admin thread page. Changing it here means
     changing it there. */
  const text = [
    body.trim(),
    "",
    "--",
    company.brandName,
    `${company.phone} · ${company.email}`,
    company.workingHours,
  ].join("\n");

  const { Resend } = await import("resend");
  const resend = new Resend(key);

  const sent = await resend.emails.send({
    from: `${company.brandName} <${company.email}>`,
    to,
    subject,
    /* Both parts, same as the enquiry mail: the branded letterhead for clients
       that render HTML, the signed plain text for those that do not. Rendered
       here rather than passed as `react` - see src/emails/render.ts. */
    html: await renderEmail(Reply({ body: body.trim() })),
    text,
    ...(Object.keys(headers).length > 0 ? { headers } : {}),
    ...(files.length > 0
      ? {
          attachments: files.map((f) => ({
            filename: f.filename,
            content: f.content,
            contentType: f.contentType,
          })),
        }
      : {}),
  });

  if (sent.error || !sent.data) {
    // Resend's own message is English and written for developers. It belongs in
    // the log, not under a Bulgarian form.
    console.error(
      "Отговорът не беше изпратен:",
      sent.error?.message ?? "(Resend не върна отговор)",
    );
    return {
      ok: false,
      error: "Отговорът не беше изпратен. Опитайте отново след минута.",
    };
  }

  const attachments: MailAttachment[] = files.map((f) => ({
    filename: f.filename,
    size: f.size,
    contentType: f.contentType,
  }));

  /* Recorded after the send, not before: an unsent reply in the transcript is
     worse than a sent one missing from it, because the second is visible in
     the customer's next message and the first is invisible forever. */
  await store.addMessage({
    id: sent.data.id,
    threadId,
    createdAt: new Date().toISOString(),
    direction: "out",
    fromAddress: `${company.brandName} <${company.email}>`,
    toAddresses: to,
    subject,
    bodyText: text,
    bodyHtml: null,
    /* Resend mints the Message-ID and does not hand it back on send. Nothing
       depends on knowing it: a customer's reply carries their own earlier ids
       in References, and those we do have. */
    messageId: null,
    inReplyTo: lastInbound?.messageId ?? null,
    attachments: attachments.length > 0 ? attachments : null,
  });

  /* Answering reopens a thread that had been marked done, because the person
     it went to is now expected to write back. */
  if (thread.status === "done") await store.setThreadStatus(threadId, "open");

  return { ok: true };
}

/** Exported for the thread view, which shows the subject a reply would carry. */
export { replySubject, normalizeSubject };
