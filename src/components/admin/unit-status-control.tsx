import { updateUnitStatus } from "@/server/admin-actions";
import { STATUS_LABEL, UNIT_STATUSES, type UnitStatus } from "@/content/taxonomy";
import { cn } from "@/lib/cn";

/**
 * Two taps to change a machine's status.
 *
 * This control is the entire mechanism behind the site's biggest advantage. If
 * it is slower than not bothering, it will not be used daily, availability will
 * go stale, and the staleness rule will quietly switch the whole catalogue to
 * "проверете наличност".
 *
 * So: no dropdown, no modal, no save button. Every status is one visible target,
 * sized for a thumb, in a form that posts on press.
 */

const TONE: Record<UnitStatus, string> = {
  available: "data-[on=true]:bg-status-available data-[on=true]:text-white",
  reserved: "data-[on=true]:bg-status-reserved data-[on=true]:text-white",
  rented: "data-[on=true]:bg-graphite data-[on=true]:text-ink-inverse",
  incoming: "data-[on=true]:bg-status-reserved data-[on=true]:text-white",
  sold: "data-[on=true]:bg-graphite data-[on=true]:text-ink-inverse",
  servicing: "data-[on=true]:bg-graphite data-[on=true]:text-ink-inverse",
};

export function UnitStatusControl({
  unitId,
  current,
}: {
  unitId: string;
  current: UnitStatus;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {UNIT_STATUSES.map((status) => {
        const on = status === current;
        return (
          <form action={updateUnitStatus} key={status}>
            <input type="hidden" name="unitId" value={unitId} />
            <input type="hidden" name="status" value={status} />
            <button
              type="submit"
              data-on={on}
              aria-pressed={on}
              className={cn(
                "min-h-11 rounded-sm border border-line-strong px-3 py-2.5 text-sm font-medium whitespace-nowrap",
                "transition-colors duration-[--duration-fast] ease-[--ease-out] active:scale-[0.97]",
                on ? "border-transparent" : "bg-paper-raised text-ink-muted hover-fine:border-ink",
                TONE[status],
              )}
            >
              {STATUS_LABEL[status]}
            </button>
          </form>
        );
      })}
    </div>
  );
}
