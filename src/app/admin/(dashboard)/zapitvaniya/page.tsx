import type { Metadata } from "next";
import {
  getEnquiryStore,
  ENQUIRY_STATUSES,
  STATUS_LABEL_BG,
  type EnquiryStatus,
} from "@/server/enquiry-store";
import { updateEnquiryNotes, updateEnquiryStatus } from "@/server/admin-actions";
import { modelBySlug } from "@/content/models";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Запитвания",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Enquiry management, built before any statistics.
 *
 * Charts of most-viewed machines mean nothing until there is traffic; at launch
 * they show zeros. What one person answering every enquiry personally needs from
 * day one is a list, the context the visitor already gave, and a status. At ten
 * enquiries a week memory copes. At thirty it does not.
 */

const TONE: Record<EnquiryStatus, string> = {
  new: "bg-status-available-bg text-status-available",
  "in-progress": "bg-status-reserved-bg text-status-reserved",
  quoted: "bg-status-reserved-bg text-status-reserved",
  won: "bg-status-available-bg text-status-available",
  lost: "bg-status-unavailable-bg text-status-unavailable",
};

export default async function AdminEnquiriesPage() {
  const enquiries = await getEnquiryStore().list();
  const open = enquiries.filter(
    (e) => e.status === "new" || e.status === "in-progress",
  ).length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-heading tracking-tight">Запитвания</h1>
          <p className="mt-1 text-ui text-ink-muted">
            Всичко, което клиентът вече е избрал, идва със запитването.
          </p>
        </div>
        <p className="text-ui">
          <span className="tabular font-bold">{open}</span>{" "}
          <span className="text-ink-muted">за обработка</span>
        </p>
      </div>

      {enquiries.length === 0 ? (
        <p className="mt-10 rounded-md border border-dashed border-line-strong bg-paper-raised p-10 text-center text-ink-muted">
          Още няма запитвания.
        </p>
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {enquiries.map((e) => {
            const model = e.modelSlug ? modelBySlug(e.modelSlug) : undefined;

            return (
              <li
                key={e.id}
                className="rounded-md border border-line bg-paper-raised p-5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                  <div>
                    <p className="text-body-lg font-bold tracking-tight">
                      {e.company}
                    </p>
                    <p className="text-ui text-ink-muted">
                      {e.name} · {e.phone} · {e.email}
                      {e.vatNumber && ` · ДДС ${e.vatNumber}`}
                    </p>
                  </div>
                  <p className="tabular text-sm text-ink-subtle">
                    {new Date(e.createdAt).toLocaleString("bg-BG")} · {e.id}
                  </p>
                </div>

                {(model || e.term || e.recommenderSummary) && (
                  <div className="mt-3 rounded-sm bg-paper-sunken p-3 text-ui">
                    <ul className="flex flex-wrap gap-x-5 gap-y-1 text-ink-muted">
                      {model && <li>Машина: {model.name}</li>}
                      {e.term && <li>Срок: {e.term} месеца</li>}
                      <li>Източник: {e.source}</li>
                    </ul>
                    {e.recommenderSummary && (
                      <p className="mt-2 text-ink-muted">{e.recommenderSummary}</p>
                    )}
                  </div>
                )}

                {e.message && (
                  <p className="mt-3 leading-relaxed whitespace-pre-wrap">
                    {e.message}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {ENQUIRY_STATUSES.map((status) => {
                    const on = status === e.status;
                    return (
                      <form action={updateEnquiryStatus} key={status}>
                        <input type="hidden" name="id" value={e.id} />
                        <input type="hidden" name="status" value={status} />
                        <button
                          type="submit"
                          aria-pressed={on}
                          className={cn(
                            "min-h-10 rounded-sm border px-3 py-2 text-sm font-medium transition-colors duration-[--duration-fast] ease-[--ease-out] active:scale-[0.97]",
                            on
                              ? `border-transparent font-semibold ${TONE[status]}`
                              : "border-line-strong bg-paper-raised text-ink-muted hover-fine:border-ink",
                          )}
                        >
                          {STATUS_LABEL_BG[status]}
                        </button>
                      </form>
                    );
                  })}
                </div>

                <form action={updateEnquiryNotes} className="mt-4 flex gap-2">
                  <input type="hidden" name="id" value={e.id} />
                  <input
                    name="notes"
                    defaultValue={e.notes ?? ""}
                    placeholder="Бележка"
                    className="h-11 flex-1 rounded-sm border border-line-strong bg-paper-raised px-3 text-ui focus:border-ink"
                  />
                  <button
                    type="submit"
                    className="min-h-11 rounded-sm border border-line-strong px-4 py-2.5 text-ui font-medium transition-colors duration-[--duration-fast] ease-[--ease-out] active:scale-[0.97] hover-fine:border-ink"
                  >
                    Запази
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
