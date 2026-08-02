import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { company } from "@/lib/company";
import { getMailboxStore, type MailMessage } from "@/server/mailbox-store";
import { updateThreadStatus } from "@/server/admin-actions";
import { ReplyForm } from "@/components/admin/reply-form";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Разговор",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * One conversation, and the box to answer it from.
 *
 * Bodies are rendered as TEXT, never as the sender's HTML. This is a page an
 * administrator opens, holding markup written by whoever felt like writing to
 * info@; `dangerouslySetInnerHTML` here would be a stored-XSS hole in the one
 * session on the site that can send mail as the company. The plain-text part
 * is what mail clients have always been required to carry, and where a sender
 * omits it the markup is flattened rather than trusted.
 */

/** Last-resort readable text for a message that arrived as HTML only. */
function flatten(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function readableBody(message: MailMessage): string {
  if (message.bodyText?.trim()) return message.bodyText.trim();
  if (message.bodyHtml) return flatten(message.bodyHtml);
  return "(празно съобщение)";
}

const kilobytes = (bytes: number): string =>
  bytes < 1_000_000
    ? `${Math.max(1, Math.round(bytes / 1000))} KB`
    : `${(bytes / 1_000_000).toFixed(1)} MB`;

export default async function AdminThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const thread = await getMailboxStore().getThread(id);
  if (!thread) notFound();

  const nextStatus = thread.status === "open" ? "done" : "open";

  return (
    <>
      <Link
        href="/admin/poshta"
        className="text-ui text-ink-muted hover-fine:text-ink"
      >
        ← Всички разговори
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-heading tracking-tight">{thread.subject}</h1>
          <p className="mt-1 text-ui text-ink-muted">
            {thread.correspondentName
              ? `${thread.correspondentName} · ${thread.correspondent}`
              : thread.correspondent}
          </p>
        </div>

        <form action={updateThreadStatus}>
          <input type="hidden" name="id" value={thread.id} />
          <input type="hidden" name="status" value={nextStatus} />
          <button
            type="submit"
            className="min-h-11 rounded-sm border border-line-strong px-4 py-2.5 text-ui font-medium transition-colors duration-[--duration-fast] ease-[--ease-out] active:scale-[0.97] hover-fine:border-ink"
          >
            {thread.status === "open" ? "Приключи" : "Отвори отново"}
          </button>
        </form>
      </div>

      <ol className="mt-8 flex flex-col gap-3">
        {thread.messages.map((message) => {
          const outgoing = message.direction === "out";

          return (
            <li
              key={message.id}
              className={cn(
                "rounded-md border p-5",
                outgoing
                  ? "border-line bg-paper-sunken"
                  : "border-line-strong bg-paper-raised",
              )}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <p className="text-ui font-semibold">
                  {outgoing ? `Вие (${company.email})` : message.fromAddress}
                </p>
                <p className="tabular text-sm text-ink-subtle">
                  {new Date(message.createdAt).toLocaleString("bg-BG")}
                </p>
              </div>

              <p className="mt-3 leading-relaxed whitespace-pre-wrap">
                {readableBody(message)}
              </p>

              {message.attachments && message.attachments.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {message.attachments.map((file, index) => (
                    <li key={`${message.id}-${index}`}>
                      <a
                        href={`/admin/poshta/fail/${encodeURIComponent(message.id)}/${index}`}
                        className="inline-block rounded-sm border border-line-strong px-3 py-2 text-ui-sm transition-colors duration-[--duration-fast] ease-[--ease-out] hover-fine:border-ink"
                      >
                        {file.filename}{" "}
                        <span className="text-ink-subtle">
                          {kilobytes(file.size)}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>

      <ReplyForm threadId={thread.id} sender={company.email} />
    </>
  );
}
