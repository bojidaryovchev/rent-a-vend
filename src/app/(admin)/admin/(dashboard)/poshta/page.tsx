import type { Metadata } from "next";
import Link from "next/link";
import { company } from "@/lib/company";
import { getMailboxStore, type MailThreadSummary } from "@/server/mailbox-store";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Поща",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * The info@ inbox.
 *
 * Sorted by activity, not by arrival, and split at the top into what still owes
 * an answer. The one question this screen exists to answer is "who is waiting
 * on me", and a plain reverse-chronological list answers it only by accident -
 * the oldest unanswered message is the one furthest down.
 */

/** Waiting on us: still open, and the last word was theirs. */
const awaitingReply = (t: MailThreadSummary): boolean =>
  t.status === "open" && t.lastDirection === "in";

export default async function AdminMailboxPage() {
  const threads = await getMailboxStore().listThreads();
  const waiting = threads.filter(awaitingReply);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-heading tracking-tight">Поща</h1>
          <p className="mt-1 text-ui text-ink-muted">
            Всичко, писано до {company.email}. Отговорът тръгва от същия адрес.
          </p>
        </div>
        <p className="text-ui">
          <span className="tabular font-bold">{waiting.length}</span>{" "}
          <span className="text-ink-muted">чакат отговор</span>
        </p>
      </div>

      {threads.length === 0 ? (
        <div className="mt-10 rounded-md border border-dashed border-line-strong bg-paper-raised p-10 text-center">
          <p className="text-ink-muted">Още няма получена поща.</p>
          <p className="mx-auto mt-2 max-w-prose text-ui-sm text-ink-subtle">
            Съобщенията се появяват тук веднага след като Resend извести сайта.
            Ако е пристигнала поща, а списъкът е празен, проверете дали е
            настроен webhook за <code className="font-mono">email.received</code>{" "}
            и дали е зададен RESEND_WEBHOOK_SECRET.
          </p>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-2">
          {threads.map((thread) => (
            <li key={thread.id}>
              <Link
                href={`/admin/poshta/${thread.id}`}
                className={cn(
                  "block rounded-md border bg-paper-raised p-4 transition-colors duration-[--duration-fast] ease-[--ease-out] hover-fine:border-ink",
                  awaitingReply(thread)
                    ? "border-line-strong"
                    : "border-line opacity-80",
                )}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <p className="text-body-lg font-bold tracking-tight">
                    {thread.correspondentName ?? thread.correspondent}
                    {awaitingReply(thread) && (
                      <span className="ml-2 rounded-sm bg-status-available-bg px-1.5 py-0.5 align-middle text-sm font-semibold text-status-available">
                        чака отговор
                      </span>
                    )}
                    {thread.status === "done" && (
                      <span className="ml-2 align-middle text-sm font-normal text-ink-subtle">
                        приключена
                      </span>
                    )}
                  </p>
                  <p className="tabular text-sm text-ink-subtle">
                    {new Date(thread.lastMessageAt).toLocaleString("bg-BG")}
                    {thread.messageCount > 1 && ` · ${thread.messageCount} писма`}
                  </p>
                </div>

                <p className="mt-1 text-ui font-medium">{thread.subject}</p>
                {thread.snippet && (
                  <p className="mt-0.5 line-clamp-1 text-ui text-ink-muted">
                    {thread.lastDirection === "out" && "Вие: "}
                    {thread.snippet}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
