import type { Metadata } from "next";
import { leadPhoto } from "@/content/models";
import { CATEGORIES, CATEGORY_LABEL } from "@/content/taxonomy";
import { loadCatalogue } from "@/server/catalogue";
import { settingsHealth } from "@/server/model-settings-store";
import { monthlyByTerm } from "@/engine/catalogue";
import { TERMS } from "@/engine/rates";
import {
  ModelPriceCard,
  type PriceCardModel,
} from "@/components/admin/model-price-card";

export const metadata: Metadata = {
  title: "Цени",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * The price screen.
 *
 * D50 removed the stock panel and left the published price as the site's last
 * remaining differentiator, which made it the one thing that had to be editable
 * without a deploy. This is that screen.
 *
 * GROUPED BY CATEGORY, because that is how the site is organised and how the
 * client thinks about the range - the four headings below are the four category
 * pages. Within a group the cards sit in the order the pages will show them, and
 * the arrows on each card change that order. So "put this machine at the top of
 * the snack page" is two taps, and it never required a developer.
 *
 * WHAT IT DELIBERATELY CANNOT DO is create a machine. A model needs specs from
 * an archived service manual, photographs of the actual cabinet and written
 * copy; a form that can produce a half-filled machine page is exactly the
 * failure D50 recorded when the unit records died. The client decides what a
 * machine costs and whether it is shown. What it IS stays in
 * `src/content/models/`, in a diff, under test.
 */
export default async function AdminPricingPage() {
  const catalogue = await loadCatalogue();
  const health = await settingsHealth();

  const unpriced = catalogue.unpriced().length;
  const hidden = catalogue.all.length - catalogue.models.length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-heading tracking-tight">Цени и видимост</h1>
          <p className="mt-1 max-w-2xl text-ui text-ink-muted">
            Месечен наем за всяка машина по петте срока. Попълнете цената за 12
            месеца и останалите четири се предлагат сами - остават напълно
            редактируеми. Празно поле означава временна цена.
          </p>
        </div>
        <p className="text-ui">
          <span className="tabular font-bold">
            {catalogue.all.length - unpriced}
          </span>{" "}
          <span className="text-ink-muted">
            от {catalogue.all.length} с реална цена
          </span>
          {hidden > 0 && (
            <>
              {" · "}
              <span className="tabular font-bold">{hidden}</span>{" "}
              <span className="text-ink-muted">скрити</span>
            </>
          )}
        </p>
      </div>

      {!health.ok && (
        <p
          role="status"
          className="mt-6 rounded-md border border-line-strong bg-accent px-4 py-3 text-ui-sm text-accent-ink"
        >
          <strong className="font-bold">Внимание.</strong> {health.message}
        </p>
      )}

      {/* Distinct from the health banner above: the table may be perfectly
          healthy and simply unreadable on this request, in which case every
          figure on the screen is derived rather than the client's. */}
      {health.ok && !catalogue.ok && (
        <p
          role="status"
          className="mt-6 rounded-md border border-line-strong bg-accent px-4 py-3 text-ui-sm text-accent-ink"
        >
          <strong className="font-bold">Внимание.</strong> Записаните цени не
          можаха да се прочетат. Показаните стойности са временни - не
          записвайте, преди страницата да се зареди правилно.
        </p>
      )}

      {CATEGORIES.map((category) => {
        /* Every machine in the category, published or not: this screen is where
           a hidden machine is found and brought back, so hiding it here would
           make that impossible. */
        const models = catalogue.all
          .filter((m) => m.category === category)
          .map((m, index) => ({ model: m, index }))
          .sort((a, b) => {
            const byOrder =
              (catalogue.settings.get(a.model.id)?.sortOrder ?? 0) -
              (catalogue.settings.get(b.model.id)?.sortOrder ?? 0);
            return byOrder !== 0 ? byOrder : a.index - b.index;
          })
          .map((entry) => entry.model);

        if (models.length === 0) return null;

        const priced = models.filter(
          (m) =>
            Object.keys(monthlyByTerm(catalogue.settings.get(m.id) ?? EMPTY))
              .length > 0,
        ).length;

        return (
          <section key={category} className="mt-10">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line pb-2">
              <h2 className="text-body-lg font-bold tracking-tight">
                {CATEGORY_LABEL[category]}
              </h2>
              <p className="tabular text-ui-sm text-ink-muted">
                {priced}/{models.length} с реална цена
              </p>
            </div>

            <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {models.map((model, index) => {
                const record = catalogue.settings.get(model.id);
                const photo = leadPhoto(model);

                const card: PriceCardModel = {
                  id: model.id,
                  name: model.name,
                  currentName: model.currentName,
                  manufacturer: model.manufacturer,
                  photo: photo ? { src: photo.src, alt: photo.alt } : null,
                  rates: TERMS.map((term) => catalogue.rate(model.id, term)),
                  saved: record ? monthlyByTerm(record) : {},
                  published: record?.published ?? true,
                  sortOrder: record?.sortOrder ?? 0,
                  isFirst: index === 0,
                  isLast: index === models.length - 1,
                };

                return (
                  /* Keyed on the row's timestamp as well as the id, so a save,
                     a reset or a reorder remounts the card and its inputs come
                     back holding what is actually stored. */
                  <ModelPriceCard
                    key={`${model.id}:${record?.updatedAt ?? "none"}`}
                    model={card}
                  />
                );
              })}
            </ul>
          </section>
        );
      })}
    </>
  );
}

/** Stand-in for "no row yet", so the count above can use one code path. */
const EMPTY = {
  modelId: "",
  monthly: {},
  published: true,
  sortOrder: 0,
  updatedAt: "",
};
