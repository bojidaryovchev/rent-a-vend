import { cn } from "@/lib/cn";
import type { Spec } from "@/content/schema";

/**
 * Specification table.
 *
 * Missing values render "няма данни" rather than being hidden. These machines
 * are mostly discontinued and the manufacturers have withdrawn their pages, so
 * gaps are real. Showing the gap is more honest than a shorter table that looks
 * complete, and it tells a buyer exactly what to ask on the phone.
 */

interface Row {
  label: string;
  value: string | null;
}

const mm = (v: number | null) => (v === null ? null : `${v} мм`);

export function specRows(spec: Spec): Row[] {
  return [
    { label: "Интерфейс", value: spec.userInterface },
    {
      label: "Брой селекции",
      value: spec.numberOfSelections === null ? null : String(spec.numberOfSelections),
    },
    { label: "Височина", value: mm(spec.heightMm) },
    { label: "Ширина", value: mm(spec.widthMm) },
    { label: "Дълбочина", value: mm(spec.depthMm) },
    { label: "Дълбочина при отворена врата", value: mm(spec.depthOpenMm) },
    { label: "Тегло", value: spec.weightKg === null ? null : `${spec.weightKg} кг` },
    { label: "Захранване", value: spec.voltage },
    {
      label: "Максимална мощност",
      value: spec.maxPowerW === null ? null : `${spec.maxPowerW} W`,
    },
    {
      label: "Честота",
      value: spec.frequencyHz === null ? null : `${spec.frequencyHz} Hz`,
    },
    { label: "Брой рафтове", value: spec.numTrays === null ? null : String(spec.numTrays) },
    {
      label: "Капацитет",
      value: spec.productCapacity === null ? null : `${spec.productCapacity} продукта`,
    },
    { label: "Система за доставка", value: spec.dispensingSystem },
    { label: "Асансьор", value: spec.elevator },
    { label: "Температура", value: spec.temperature },
    { label: "Конфигурация", value: spec.configuration },
    { label: "Платежен протокол", value: spec.protocol },
  ];
}

export function SpecTable({ spec }: { spec: Spec }) {
  const rows = specRows(spec);
  const known = rows.filter((r) => r.value !== null).length;

  return (
    <div>
      {/* Two columns of alternating rows inside a panel: the register of a
          specification sheet, not a web table. */}
      <div className="bay-panel overflow-hidden">
        <dl className="tabular grid sm:grid-cols-2">
          {rows.map((row, i) => (
            <div
              key={row.label}
              className={cn(
                "flex items-baseline justify-between gap-4 border-b border-line px-4 py-3 text-[13px]",
                i % 2 === 1 && "bg-paper-sunken/60",
                "sm:[&:nth-child(odd)]:border-r",
              )}
            >
              <dt className="text-ink-muted">{row.label}</dt>
              <dd
                className={
                  row.value === null
                    ? "text-right text-line-strong italic"
                    : "text-right text-graphite"
                }
              >
                {row.value ?? "няма данни"}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {known < rows.length && (
        <p className="mt-4 max-w-[60ch] text-sm leading-relaxed text-ink-subtle">
          Тази машина е спряна от производство и производителят е свалил
          страницата ѝ. Данните идват от архивни сервизни ръководства. Липсващото
          можем да измерим по конкретния апарат преди доставка.
        </p>
      )}
    </div>
  );
}
