import type { Metadata } from "next";
import Image from "next/image";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Prose } from "@/components/ui/prose";
import { CONDITION_POINTS } from "@/content/taxonomy";
import { catalogueStats } from "@/content/models";
import { LocationMap } from "@/components/site/location-map";
import { company } from "@/lib/company";
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  path: routes.about,
  title: "Кои сме ние",
  description:
    "Собствен склад, собствен сервиз и внос на машини от Европа. През какво минава всяка машина, преди да тръгне към обекта.",
});

/**
 * Trust without a track record to lean on.
 *
 * The brand is deliberately new, so nothing here claims years or reputation it
 * has not got. What it can do is be specific - and specificity is what buyers of
 * used equipment say they cannot find anywhere.
 *
 * The photography is ours - our base, our van, our machines on a real site. No
 * stock images of people in suits; they read as stock immediately and achieve
 * the opposite of trust.
 */

const PHOTOS = [
  {
    src: "/skladut.png",
    title: "Складът",
    note: "Базата в с. Марково, откъдето тръгват машините.",
    alt: "Сградата на базата на Rent-a-Vend в с. Марково в деня на откриването",
  },
  {
    src: "/servizut.png",
    title: "Сервизът",
    note: "Където се реновират и подготвят.",
    alt: "Техник зарежда снакс автомат в склада, до него втора машина с отворена врата",
  },
  {
    src: "/tovareneto.png",
    title: "Товаренето",
    note: "Как машината тръгва към вас.",
    alt: "Кафе автомат и снакс автомат на платформата на камион пред склада",
  },
  {
    src: "/montazh-na-obekt.png",
    title: "Монтаж на обект",
    note: "Готова за работа.",
    alt: "Снакс автомат и кафе автомат, монтирани и заредени пред търговски обект",
  },
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
            {PHOTOS.map((photo) => (
              // One surface, not two. A tinted caption on a tinted figure reads
              // as a card inside a card; the divider carries the separation.
              <figure
                key={photo.src}
                className="overflow-hidden rounded-md border border-line bg-paper-raised"
              >
                {/* Square, because the set is three portraits and one landscape
                    and a 4:3 band would cut the truck shot in half. Cropped
                    rather than contained: unlike a machine on the catalogue,
                    these are scenes, and a scene survives losing its edges. */}
                <div className="relative aspect-square bg-paper-sunken">
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes="(min-width: 1280px) 292px, (min-width: 1024px) 23vw, (min-width: 640px) 46vw, 92vw"
                    className="object-cover"
                  />
                </div>
                <figcaption className="border-t border-line px-4 py-3">
                  <p className="font-semibold">{photo.title}</p>
                  <p className="mt-0.5 text-sm text-ink-muted">{photo.note}</p>
                </figcaption>
              </figure>
            ))}
          </div>

          <p className="mt-4 max-w-[60ch] text-ui leading-relaxed text-ink-subtle">
            Снимките са наши - базата, сервизът и машини, монтирани на реален
            обект. Няма стокови снимки на усмихнати хора с чаша кафе -
            разпознават се веднага и постигат обратното на доверие.
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
              <h2>В какво състояние са машините</h2>
              <p>
                Не разделяме машините на класове. Всяка машина, която излиза от
                базата, минава през едно и също - рециклиране, подмяна на
                износените части и тест преди да тръгне към обекта.
              </p>
              <p>
                Снимките на машините са наши и показват конкретната техника,
                вместо да я разкрасяват. Купувачът на употребявана машина и без
                това знае, че тя не е нова - показаното вдъхва повече доверие от
                перфектния рендер.
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
              <h2 className="text-heading tracking-tight">
                Преди всяка доставка
              </h2>
              <ul className="mt-5 divide-y divide-line border-y border-line">
                {CONDITION_POINTS.map((point) => (
                  <li key={point} className="py-4 font-bold">
                    {point}
                  </li>
                ))}
              </ul>

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
