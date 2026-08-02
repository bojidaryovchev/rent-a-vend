import { StatusBadge } from "./status-badge";
import { ButtonLink } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { CONDITION_STATEMENT } from "@/content/taxonomy";
import type { Unit } from "@/content/schema";
import type { AvailabilitySummary } from "@/engine/availability";

/**
 * The actual machines behind a model page.
 *
 * This is what makes "this exact machine" possible, and it is the thing no
 * competitor can copy without holding stock. Units do not get their own indexed
 * URLs: 350 near-identical pages differing only by year and condition would read
 * as thin content and be demoted, taking the model pages down with them.
 *
 * Reserving is an enquiry that names the unit, confirmed by a person. A real
 * hold with an expiry is a concurrency problem, and it is not what v1 needs.
 */
export function UnitList({
  units,
  availability,
}: {
  units: Unit[];
  availability: AvailabilitySummary;
}) {
  if (!availability.canPublish) {
    return (
      <div className="bay-panel border-l-4 border-l-status-reserved p-6">
        <h3 className="plate text-[13px] text-status-reserved">
          Проверете наличност
        </h3>
        <p className="mt-2 max-w-2xl text-[14px] leading-6 text-ink-muted">
          Наличността не е обновявана скоро и не искаме да покажем нещо невярно.
          Обадете се или изпратете запитване и ще потвърдим до един работен час.
        </p>
        <div className="mt-5">
          <ButtonLink href={routes.enquiry} variant="outline">
            Провери наличност
          </ButtonLink>
        </div>
      </div>
    );
  }

  const rentable = units.filter((u) => u.status === "available");
  const others = units.filter((u) => u.status !== "available");

  if (rentable.length === 0) {
    return (
      <div className="bay-panel p-6">
        <h3 className="plate text-[13px] text-graphite">
          {availability.incoming > 0
            ? "Няма налична машина в момента, очаква се доставка"
            : "Няма налична машина от този модел в момента"}
        </h3>
        <p className="mt-2 max-w-2xl text-[14px] leading-6 text-ink-muted">
          Можем да предложим аналогичен модел или да ви запишем за следващата
          доставка.
        </p>
        <div className="mt-5">
          <ButtonLink href={routes.enquiry} variant="outline">
            Уведоми ме при наличност
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {rentable.map((unit) => (
          <li key={unit.id} className="bay-panel riveted flex flex-col p-5 pt-7">
            <div className="flex items-center justify-between">
              <span className="serial text-graphite">{unit.stockRef}</span>
              <StatusBadge status={unit.status} />
            </div>

            <dl className="tabular mt-4 grid grid-cols-2 gap-y-2 border-y border-line py-3 text-[13px]">
              <dt className="text-ink-muted">Година</dt>
              <dd className="text-right text-graphite">{unit.year ?? "-"}</dd>
            </dl>

            {/* Same line on every unit rather than a per-machine grade: the
                statement is about how the stock is prepared, not about how this
                one differs from the next. It stays on the row instead of in a
                tooltip - a tooltip is invisible on a phone. */}
            <p className="mt-3 text-[12px] leading-5 text-ink-muted">
              {CONDITION_STATEMENT}
            </p>

            <div className="mt-5">
              <ButtonLink
                href={`${routes.enquiry}?unit=${encodeURIComponent(unit.stockRef)}`}
                className="w-full"
              >
                Запази тази машина
              </ButtonLink>
            </div>
          </li>
        ))}
      </ul>

      {others.length > 0 && (
        <p className="mt-3 text-sm text-ink-subtle">
          Още {others.length}{" "}
          {others.length === 1 ? "машина от този модел е" : "машини от този модел са"}{" "}
          отдадени, резервирани или в сервиз.
        </p>
      )}

      {/* Says plainly what the button does. It sends an enquiry naming this
          machine; it does not place a hold. Promising a hold we do not
          implement would break the "never claim what cannot be honoured"
          principle on the most consequential button on the page. */}
      <p className="mt-4 max-w-[60ch] text-sm leading-relaxed text-ink-subtle">
        Запазването е запитване за конкретния апарат, не автоматична резервация.
        Потвърждаваме до един работен час. Серийният номер и пълната история на
        машината се предоставят при запитване.
      </p>
    </div>
  );
}
