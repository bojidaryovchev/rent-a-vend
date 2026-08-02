import type { Metadata } from "next";
import { UnitStatusControl } from "@/components/admin/unit-status-control";
import { getUnits, lastStockUpdate } from "@/server/stock-store";
import { availabilityOverall, STALE_AFTER_HOURS } from "@/engine/availability";
import { MODELS, modelById } from "@/content/models";

export const metadata: Metadata = {
  title: "Наличности",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminStockPage() {
  const units = await getUnits();
  const summary = availabilityOverall(new Date(), units);
  const { hoursAgo } = await lastStockUpdate();

  // Group by model, and put anything with a rentable unit first: those are the
  // rows most likely to need changing today.
  const byModel = MODELS.map((m) => ({
    model: m,
    units: units.filter((u) => u.modelId === m.id),
  }))
    .filter((g) => g.units.length > 0)
    .sort((a, b) => {
      const aFree = a.units.filter((u) => u.status === "available").length;
      const bFree = b.units.filter((u) => u.status === "available").length;
      return bFree - aFree || a.model.name.localeCompare(b.model.name, "bg");
    });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-heading tracking-tight">Наличности</h1>
          <p className="mt-1 text-ui text-ink-muted">
            Един натиск сменя статуса. Сайтът се обновява веднага.
          </p>
        </div>

        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-ui">
          <div className="flex gap-2">
            <dt className="text-ink-muted">Налични</dt>
            <dd className="tabular font-bold text-status-available">
              {summary.available}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-ink-muted">Общо</dt>
            <dd className="tabular font-bold">{summary.total}</dd>
          </div>
        </dl>
      </div>

      <div
        className={
          summary.freshness === "fresh"
            ? "mt-5 rounded-md border border-line bg-paper-raised px-4 py-3 text-ui text-ink-muted"
            : "mt-5 rounded-md border border-danger bg-danger-bg px-4 py-3 text-ui text-danger"
        }
      >
        {summary.freshness === "stale" ? (
          <>
            <strong className="font-bold">Наличността е спряна от сайта.</strong>{" "}
            Не е обновявана от {hoursAgo} часа, затова посетителите виждат
            „Проверете наличност“ вместо брой. Натиснете кой да е статус, за да
            я върнете.
          </>
        ) : summary.freshness === "ageing" ? (
          <>
            Последно обновяване преди {hoursAgo} ч. След{" "}
            {STALE_AFTER_HOURS} ч. без промяна сайтът спира да показва наличност.
          </>
        ) : (
          <>Обновено преди {hoursAgo ?? 0} ч. Сайтът показва реална наличност.</>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-8">
        {byModel.map(({ model, units: modelUnits }) => (
          <section key={model.id}>
            <h2 className="text-body-lg font-bold tracking-tight">
              {model.name}
              <span className="ml-3 text-sm font-normal text-ink-muted">
                {modelUnits.filter((u) => u.status === "available").length} от{" "}
                {modelUnits.length} налични
              </span>
            </h2>

            <ul className="mt-3 flex flex-col gap-3">
              {modelUnits.map((unit) => (
                <li
                  key={unit.id}
                  className="rounded-md border border-line bg-paper-raised p-4"
                >
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-ui">
                    <span className="tabular font-bold">{unit.stockRef}</span>
                    {unit.year && (
                      <span className="tabular text-ink-muted">{unit.year} г.</span>
                    )}
                    {unit.supplier && (
                      <span className="text-ink-subtle">{unit.supplier}</span>
                    )}
                  </div>

                  <div className="mt-3">
                    <UnitStatusControl unitId={unit.id} current={unit.status} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {byModel.length === 0 && (
        <p className="mt-10 text-ink-muted">
          Няма машини. Каталогът се зарежда от {modelById("snakky")?.name ?? "склада"}.
        </p>
      )}
    </>
  );
}
