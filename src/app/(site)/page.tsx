import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Eyebrow, IncludedMark, SectionHead } from "@/components/ui/bits";
import { ButtonLink } from "@/components/ui/button";
import { MachineImage } from "@/components/ui/machine-image";
import { ModelCard } from "@/components/catalogue/model-card";
import { toCardData } from "@/lib/card-data";
import { catalogueStats, leadPhoto, modelBySlug } from "@/content/models";
import type { Catalogue } from "@/engine/catalogue";
import { loadCatalogue } from "@/server/catalogue";
import { fromMonthly, INCLUDED_IN_RENT } from "@/engine/quote";
import { CATEGORIES, CATEGORY_LABEL } from "@/content/taxonomy";
import { company } from "@/lib/company";
import { routes, CATEGORY_LABELS, type CategoryKey } from "@/lib/routes";
import { absolute, SHARE_CARD } from "@/lib/seo";

/**
 * Canonical only. Title and description deliberately come from the root
 * layout's defaults - they already carry `вендинг машини под наем`, the largest
 * single rental term measured, and routing them through `pageMetadata` would
 * append the brand suffix meant for subpages to the one page that should not
 * have it.
 */
export const metadata: Metadata = {
  alternates: { canonical: absolute(routes.home) },
  /* Named rather than inherited: setting `url` here replaces the root layout's
     whole `openGraph` object, card included. See `SHARE_CARD` in lib/seo. */
  openGraph: {
    url: absolute(routes.home),
    images: [{ url: absolute(SHARE_CARD) }],
  },
};

/**
 * Home.
 *
 * Persuade surface. Two rules drive the whole page, and every Bulgarian
 * competitor breaks both: lead with the offer and a number rather than a
 * category name, and show the price.
 *
 * The field opens with "Вендинг машини" over a stock photo and a "Вижте повече"
 * button. This opens with what it costs.
 */

const DIFFS = [
  {
    n: "01",
    tag: "цена",
    title: "Виждате цената",
    body: "Месечна цена на всяка машина, за всеки срок. Не „свържете се за оферта“.",
  },
  {
    n: "02",
    tag: "наличност",
    title: "Всеки модел е наличен",
    body: "Каталогът не е витрина с разпродадени машини. Каквото е публикувано, можем да го доставим.",
  },
  {
    n: "03",
    tag: "състояние",
    title: "Готови за работа",
    body: "Нови и изцяло рециклирани, всичките проверени от нашия екип, преди да тръгнат към обекта. Снимките са на реални машини.",
  },
];

const PROCESS = [
  { n: "01", t: "Избор", d: "Каталог или няколко въпроса." },
  { n: "02", t: "Оферта", d: "Решение до 24 часа." },
  { n: "03", t: "Договор", d: "На място или дистанционно." },
  { n: "04", t: "Монтаж", d: "2 до 5 работни дни." },
];

const CATEGORY_INTRO: Record<CategoryKey, string> = {
  coffee: "Машини за кафе и топли напитки. Реални апарати от нашия склад.",
  snack: "Автомати за снаксове, пакетирани стоки и храна.",
  combo: "Кафе машина върху снакс шкаф - един корпус, едно място, едно плащане.",
  cold: "Автомати за студени напитки в кутии и бутилки.",
};

function Stat({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`px-4 py-5 md:px-6 ${className ?? ""}`}>
      <dt className="stencil text-[11px] text-paper/75">{label}</dt>
      <dd className="tabular mt-1 font-display text-[28px] leading-none text-paper">
        {value}
      </dd>
    </div>
  );
}

/** The machine the hero leads on. Named rather than computed: this is an
 *  editorial recommendation, and the combination machine is the one product in
 *  the catalogue photographed exactly as it is delivered - assembled. */
const HERO_MODEL_SLUG = "necta-brio-up-minisnakky";

/**
 * The hero's machine.
 *
 * A recommendation, stated as ours. The site has no sales history, so "най-
 * избирано" would be a claim nobody can check, sitting three sections above
 * "Виждате и дефектите" - the page would be spending its own argument. What it
 * says instead is who the machine is for, which is a judgement we can defend
 * from the model's own record (15-70 души, 1-2 смени) and which lets a
 * three-hundred-person plant rule itself out in one line.
 *
 * Falls back to the drawing if the frame ever goes missing, so the hero degrades
 * rather than breaking.
 */
function HeroFeature({ catalogue }: { catalogue: Catalogue }) {
  const featured = modelBySlug(HERO_MODEL_SLUG);
  const photo = featured ? leadPhoto(featured) : null;

  /* The hero machine is named in code, so unpublishing it has to be survivable:
     the drawing fallback below is already the "no frame" path and serves here
     too, rather than the home page linking to a 404. */
  if (!featured || !photo || !catalogue.isPublished(featured.id)) {
    return (
      <MachineImage
        category="combo"
        name="Вендинг машина"
        showNote
        className="animate-shutter h-105"
      />
    );
  }

  return (
    <Link
      href={routes.model(featured.category as CategoryKey, featured.slug)}
      className="animate-shutter group flex flex-col overflow-hidden border border-line bg-paper-sunken"
    >
      {/* The render is white-backed, so it sits on paper rather than being
          knocked out - the drop shadow under the cabinet is part of the image
          and a cut-out would take it with it. */}
      <div className="paper-grain relative h-70 sm:h-80">
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          priority
          sizes="(min-width: 1024px) 40vw, 100vw"
          className="object-contain p-3"
        />
        <span className="serial absolute top-0 left-0 bg-graphite px-2 py-1 text-paper/80">
          препоръчваме
        </span>
      </div>

      {photo.credit && (
        <p className="border-t border-line bg-paper-raised px-3 py-2">
          <span className="serial text-ink-subtle">{photo.credit}</span>
        </p>
      )}

      <div className="border-t border-line bg-paper-raised p-4">
        <h2 className="plate text-[14px] text-graphite">{featured.name}</h2>
        <p className="mt-2 text-[13px] leading-6 text-ink-muted">
          Кафе машина върху снакс шкаф - един корпус вместо две машини. За офис,
          автосервиз и фитнес до 70 души.
        </p>

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-line pt-3">
          <span className="tabular font-display text-[26px] leading-none text-graphite">
            от {fromMonthly(catalogue, featured.id)}&nbsp;€
            <span className="ml-1 font-sans text-[12px] font-normal text-ink-muted">
              /месец
            </span>
          </span>
          <span className="serial text-line-strong transition-colors duration-200 group-hover:text-graphite">
            детайли →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default async function HomePage() {
  const stats = catalogueStats();
  const catalogue = await loadCatalogue();

  // Cheapest entry point across the whole catalogue - the honest "from" figure.
  const from = Math.min(
    ...catalogue.models.map((m) => fromMonthly(catalogue, m.id)),
  );

  // The strip used to lead on whatever was rentable today. With one
  // availability state (D50) there is nothing to sort on, so it leads on the
  // cheapest four - the figure the page is already selling on.
  const featured = [...catalogue.models]
    .sort((a, b) => fromMonthly(catalogue, a.id) - fromMonthly(catalogue, b.id))
    .slice(0, 4)
    .map((m) => toCardData(m, catalogue));

  return (
    <>
      {/* -- hero ----------------------------------------------------------
          Dark steel rather than paper. The machine is the product and the
          machine is graphite; opening on the material states what this is
          before a word is read. */}
      <section className="steel relative overflow-hidden border-b border-graphite-edge">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.98 0 0 / 0.3) 1px, transparent 1px), linear-gradient(90deg, oklch(0.98 0 0 / 0.3) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(90% 70% at 20% 20%, black, transparent 75%)",
          }}
        />

        <Container className="relative grid gap-10 py-14 md:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="animate-rise">
            <Eyebrow tone="light">
              Кафе · Снакс · Комбинирани · Студени напитки
            </Eyebrow>

            <h1 className="mt-5 text-[36px] leading-[1.05] text-paper sm:text-[52px] lg:text-[62px]">
              Вендинг машина под наем от{" "}
              <span className="tabular border-b-4 border-accent whitespace-nowrap text-accent">
                {from} €
              </span>
              /месец
            </h1>

            <p className="mt-6 max-w-xl text-[15px] leading-7 text-paper/75">
              Реални машини от нашия склад, с публикувана цена на всяка.
              Доставка, монтаж, сервиз и застраховка са включени. Без
              първоначална инвестиция.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={routes.recommender}>
                Коя машина ми трябва?{" "}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </ButtonLink>
              <ButtonLink href={routes.category("coffee")} variant="ghostLight">
                Виж наличните машини
              </ButtonLink>
            </div>

            <p className="mt-6 flex items-start gap-2 border-l-2 border-accent/60 pl-3 text-[12px] leading-5 text-paper/75">
              {company.serviceSla}
            </p>
          </div>

          <HeroFeature catalogue={catalogue} />
        </Container>

        {/* Stat strip */}
        <div className="relative border-t border-graphite-edge bg-graphite-deep">
          <Container>
            <dl className="grid grid-cols-2 divide-x divide-paper/10 md:grid-cols-3">
              <Stat label="Модели" value={String(stats.total)} />
              <Stat label="Категории" value={String(CATEGORIES.length)} />
              <Stat
                label="Срок"
                value="12-60 мес."
                className="col-span-2 border-t border-paper/10 md:col-span-1 md:border-t-0"
              />
            </dl>
          </Container>
        </div>
      </section>

      {/* -- the thesis ---------------------------------------------------- */}
      <section className="paper-grain border-b border-line">
        <Container className="py-16 md:py-24">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHead
              index="00"
              title="Всичко, което другите крият"
              lead="Цена на всеки модел, публикувана на страницата му."
            />
            <span aria-hidden className="hatch h-6 w-40 opacity-10" />
          </div>

          <div className="mt-10 grid border border-line-strong bg-paper-raised md:grid-cols-3">
            {DIFFS.map((d) => (
              <article
                key={d.n}
                className="group relative flex flex-col gap-4 border-line p-7 transition-colors duration-200 hover-fine:bg-paper-sunken md:p-8 [&:not(:last-child)]:border-b md:[&:not(:last-child)]:border-r md:[&:not(:last-child)]:border-b-0"
              >
                {/* A painted line drawn on, left to right, when you approach it. */}
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-accent transition-transform duration-300 group-hover:scale-x-100"
                />
                <div className="flex items-center justify-between">
                  <span className="font-display text-[44px] leading-none text-line">
                    {d.n}
                  </span>
                  <span className="serial border border-line px-1.5 py-0.5 text-line-strong">
                    {d.tag}
                  </span>
                </div>
                <h3 className="plate text-[15px] text-graphite">{d.title}</h3>
                <p className="text-[14px] leading-6 text-ink-muted">{d.body}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* -- categories ---------------------------------------------------- */}
      <section className="border-b border-line bg-paper">
        <Container className="py-16 md:py-24">
          <SectionHead
            index="01"
            title="Машини под наем"
            lead="Нови и изцяло рециклирани, проверени, с цена на всеки модел."
          />

          <div className="mt-10 grid gap-px border border-line-strong bg-line-strong sm:grid-cols-2 lg:grid-cols-4">
            {/* A category with nothing published in it 404s, so it must not be
                linked from here either. */}
            {CATEGORIES.filter((c) => catalogue.byCategory(c).length > 0).map((c) => {
              const list = catalogue.byCategory(c);

              return (
                <Link
                  key={c}
                  href={routes.category(c as CategoryKey)}
                  className="group flex flex-col justify-between gap-8 bg-paper-raised p-6 transition-colors duration-200 hover-fine:bg-paper-sunken"
                >
                  <div>
                    <span className="serial text-line-strong">
                      {CATEGORY_LABELS[c as CategoryKey]}
                    </span>
                    <h3 className="plate mt-3 text-[14px] leading-6 text-graphite">
                      {CATEGORY_LABEL[c]}
                    </h3>
                    <p className="mt-3 text-[13px] leading-6 text-ink-muted">
                      {CATEGORY_INTRO[c as CategoryKey]}
                    </p>
                  </div>
                  <div className="flex items-end justify-between border-t border-line pt-3">
                    <span className="tabular text-[13px] text-ink-muted">
                      {list.length} модела
                    </span>
                    <ArrowRight
                      aria-hidden
                      className="h-4 w-4 text-line-strong transition-transform duration-200 group-hover:translate-x-1 group-hover:text-graphite"
                    />
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((m) => (
              <ModelCard key={m.id} data={m} />
            ))}
          </div>
        </Container>
      </section>

      {/* -- process ------------------------------------------------------- */}
      <section className="steel border-b border-graphite-edge">
        <Container className="py-16 md:py-24">
          <SectionHead index="02" title="Как протича наемът" tone="light" />

          <ol className="mt-10 grid gap-px bg-paper/12 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map((s) => (
              <li key={s.n} className="bg-graphite p-6">
                <span className="serial text-accent">{s.n}</span>
                <h3 className="plate mt-3 text-[14px] text-paper">{s.t}</h3>
                <p className="mt-2 text-[13px] leading-6 text-paper/75">{s.d}</p>
              </li>
            ))}
          </ol>

          <Link
            href={routes.howItWorks}
            className="plate mt-8 inline-flex min-h-11 items-center gap-2 text-[11px] text-accent"
          >
            Подробно как работи наемът{" "}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Container>
      </section>

      {/* -- closing ------------------------------------------------------- */}
      <section className="paper-grain">
        <Container className="py-16 md:py-24">
          <div className="bay-panel riveted grid gap-8 p-8 md:grid-cols-[1.2fr_0.8fr] md:items-center md:p-12">
            <div>
              <h2 className="text-[28px] leading-tight md:text-[36px]">
                Кажете ни за обекта си
              </h2>
              <p className="mt-4 max-w-lg text-[15px] leading-7 text-ink-muted">
                Реални машини от нашия склад, с ясна месечна цена и включен
                сервиз.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <ButtonLink href={routes.enquiry}>Започни</ButtonLink>
                <ButtonLink href={routes.howItWorks} variant="outline">
                  Какво влиза в месечната цена
                </ButtonLink>
              </div>
            </div>

            <div className="border border-line bg-paper-sunken p-5">
              <span className="serial text-ink-muted">включено в наема</span>
              <ul className="mt-3 space-y-2 text-[13px] leading-6 text-graphite">
                {INCLUDED_IN_RENT.map((x) => (
                  <li
                    key={x}
                    className="flex items-center gap-2 border-b border-line pb-2 last:border-0"
                  >
                    <IncludedMark className="text-graphite" />
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
