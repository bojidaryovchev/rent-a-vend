import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Container } from "@/components/ui/container";
import { SectionHead } from "@/components/ui/bits";
import { ButtonLink } from "@/components/ui/button";
import { MapEmbed } from "@/components/site/map-embed";
import { company, mapEmbedSrc, mapPin, mapsLink } from "@/lib/company";

/**
 * "Where are you, actually?"
 *
 * The one question a map answers that an address line does not, and on a page
 * whose whole argument is "we hold the machines ourselves, in our own
 * warehouse" it is load-bearing rather than decorative. A rental company with
 * no visible premises is indistinguishable from a middleman, and the buyers of
 * used equipment interviewed in the research say that is exactly what they are
 * trying to avoid.
 *
 * Three states, because the location is not known yet and a map is the sort of
 * component that quietly renders as a grey rectangle over Kansas when its data
 * is missing:
 *
 *   1. no location   - a labelled empty bay, in the same idiom as the missing
 *                      photography. It says what will be here.
 *   2. no API key    - the address and a link into Google Maps proper. No
 *                      embed, no guessing at an undocumented keyless URL.
 *   3. both present  - the click-to-load embed. See `MapEmbed` for why it is
 *                      not simply an iframe.
 *
 * The address block renders identically in all three, because it is the part
 * that actually gets someone to the gate.
 */

/**
 * The map well, sized by aspect so the panel reserves its space before the
 * iframe arrives and nothing below it jumps.
 *
 * 3:1 at full width lands near 410px, which is about as much map as a location
 * is worth on a page that is not about the location. Wider than that and it is
 * a grey rectangle with a pin in the middle of it.
 */
const MAP_WELL = "aspect-4/3 sm:aspect-16/9 lg:aspect-3/1";

/**
 * The placeholder does not use that aspect, and does not get a well of its own.
 *
 * It has no layout shift to prevent, 400px of empty paper reads as a broken
 * component rather than as a promise, and a fixed-height well around copy that
 * does not fill it leaves a paper band above and below the tint - which looks
 * exactly like a rendering fault. It sizes to its own text instead.
 */

export function LocationMap() {
  const src = mapEmbedSrc();
  const link = mapsLink();

  return (
    <section className="paper-grain border-t border-line">
      <Container className="py-14 md:py-20">
        {/* No serial index: nothing else on this page is numbered, and a lone
            "03" would imply two sections above it that do not exist. */}
        <SectionHead
          title="Къде сме"
          lead="Машините стоят в нашия склад, не при доставчик. Заповядайте да видите тази, която ви интересува, преди да наемете."
        />

        <div className="bay-panel mt-8">
          {src ? (
            <div className={cn(MAP_WELL, "overflow-hidden border-b border-line")}>
              <MapEmbed src={src} title="Карта до склада" />
            </div>
          ) : (
            <PendingMap hasLocation={link !== null} />
          )}

          <div className="grid gap-x-10 gap-y-6 p-6 sm:grid-cols-2 sm:p-7">
            <dl className="space-y-4">
              <Row label="Адрес" value={mapPin.address ?? "Ще бъде обявен"} />
              {mapPin.directions && (
                <Row label="Упътване" value={mapPin.directions} />
              )}
              <Row label="Работно време" value={company.workingHours} />
            </dl>

            <div className="sm:text-right">
              <p className="text-[14px] leading-6 text-ink-muted">
                Обадете се преди да тръгнете - ще извадим машината от реда и ще
                я включим, за да я видите как работи.
              </p>
              <div className="mt-5 flex flex-wrap gap-3 sm:justify-end">
                <ButtonLink href={company.phoneHref} variant="outline" size="sm">
                  {company.phone}
                </ButtonLink>
                {link && (
                  <ButtonLink
                    href={link}
                    variant="outline"
                    size="sm"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Отвори в Google Maps
                    <ArrowUpRight aria-hidden className="size-4" />
                  </ButtonLink>
                )}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/**
 * The bay before there is a map in it.
 *
 * Two different absences, and they are not the same message. Without a location
 * we do not know where we are yet; with a location but no key the map is a
 * configuration away while the address beneath is already usable. Saying "map
 * unavailable" for both would misreport the first as a fault.
 */
function PendingMap({ hasLocation }: { hasLocation: boolean }) {
  return (
    <div className="border-b border-line bg-paper-sunken px-6 py-14 text-center">
      <div className="mx-auto max-w-sm">
        <p className="plate text-[11px] text-ink-muted">
          {hasLocation ? "Картата не е налична" : "Тук ще стои картата"}
        </p>
        <p className="mt-3 text-[14px] leading-6 text-graphite">
          {hasLocation
            ? "Адресът отдолу е точен - отворете го направо в Google Maps."
            : "Точният адрес на склада ще бъде обявен тук, заедно с картата."}
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="plate text-[11px] text-ink-muted">{label}</dt>
      <dd className="mt-1.5 text-[15px] leading-6 text-graphite">{value}</dd>
    </div>
  );
}
