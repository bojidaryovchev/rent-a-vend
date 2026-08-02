import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Prose } from "@/components/ui/prose";
import { CONDITION_DESCRIPTION, CONDITION_GRADES, CONDITION_LABEL } from "@/content/taxonomy";
import { catalogueStats } from "@/content/models";
import { LocationMap } from "@/components/site/location-map";
import { company } from "@/lib/company";
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  path: routes.about,
  title: "Кои сме ние",
  description:
    "Собствен склад, собствен сервиз и внос на машини от Европа. Как оценяваме състоянието на всяка машина и защо го публикуваме.",
});

/**
 * Trust without a track record to lean on.
 *
 * The brand is deliberately new, so nothing here claims years or reputation it
 * has not got. What it can do is be specific - and specificity is what buyers of
 * used equipment say they cannot find anywhere.
 *
 * The photography placeholders are honest about being placeholders. Stock images
 * of people in suits would be worse than empty space.
 */

const PHOTO_SLOTS = [
  { title: "Складът", note: "Машините, които отдаваме, на място." },
  { title: "Сервизът", note: "Където се реновират и подготвят." },
  { title: "Товаренето", note: "Как машината тръгва към вас." },
  { title: "Монтаж на обект", note: "Готова за работа." },
];

export default function AboutPage() {
  const stats = catalogueStats();

  return (
    <>
      <PageHeader
        eyebrow="Фирмата"
        title="Кои сме ние"
        lead="Собствен склад, собствен сервиз и внос на употребявани машини от Европа. Отдаваме под наем това, което държим и обслужваме сами."
      />

      <section className="py-14">
        <Container>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PHOTO_SLOTS.map((slot) => (
              // One surface, not two. A tinted caption on a tinted figure reads
              // as a card inside a card; the divider carries the separation.
              <figure
                key={slot.title}
                className="overflow-hidden rounded-md border border-line bg-paper-raised"
              >
                <div className="grid aspect-4/3 place-items-center bg-paper-sunken px-5 text-center">
                  <p className="text-micro font-semibold uppercase text-ink-subtle">
                    Тук ще стои реална снимка
                  </p>
                </div>
                <figcaption className="border-t border-line px-4 py-3">
                  <p className="font-semibold">{slot.title}</p>
                  <p className="mt-0.5 text-sm text-ink-muted">{slot.note}</p>
                </figcaption>
              </figure>
            ))}
          </div>

          <p className="mt-4 max-w-[60ch] text-ui leading-relaxed text-ink-subtle">
            Тези места ще заемат снимки от нашия склад и сервиз. Няма да сложим
            стокови снимки на усмихнати хора с чаша кафе - разпознават се веднага
            и постигат обратното на доверие.
          </p>
        </Container>
      </section>

      {/* Directly under the warehouse photography, because it answers the
          question those photographs raise: yes, but where is it? */}
      <LocationMap />

      <section className="border-t border-line py-14">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
            <Prose>
              <h2>Как оценяваме състоянието</h2>
              <p>
                За употребявана техника няма единен стандарт. Клас А при един
                продавач изглежда като клас В при друг, купувачите го знаят и
                затова не вярват на буквата.
              </p>
              <p>
                Затова публикуваме какво точно означава всеки клас при нас, и
                снимаме дефектите, вместо да ги крием. Показан дефект вдъхва
                повече доверие от перфектна снимка - купувачът на употребявана
                машина и без това знае, че тя не е нова.
              </p>

              <h2>Какво няма да намерите тук</h2>
              <p>
                Няма да видите отзиви от несъществуващи клиенти, награди, които не
                сме получавали, или прогнози за печалба, които не можем да
                гарантираме. Където сайтът показва число, то е реално или не е
                показано.
              </p>
              <p>
                Каталогът съдържа <strong>{stats.total} модела</strong>. Част от
                техническите данни липсват, защото производителите свалиха
                страниците на старите машини. Там, където не знаем нещо, пише
                „няма данни“ - не измисляме.
              </p>
            </Prose>

            <div>
              <h2 className="text-heading tracking-tight">Класове състояние</h2>
              <dl className="mt-5 divide-y divide-line border-y border-line">
                {CONDITION_GRADES.map((grade) => (
                  <div key={grade} className="py-4">
                    <dt className="font-bold">{CONDITION_LABEL[grade]}</dt>
                    <dd className="mt-1 leading-relaxed text-ink-muted">
                      {CONDITION_DESCRIPTION[grade]}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-8 rounded-md bg-paper-sunken p-5">
                <p className="font-semibold">Работим в цяла България</p>
                <p className="mt-1.5 leading-relaxed text-ink-muted">
                  {company.coverage}. {company.serviceSla}.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={routes.category("coffee")} size="lg">
              Виж машините
            </ButtonLink>
            <ButtonLink href={routes.contact} size="lg" variant="outline">
              Свържете се с нас
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}
