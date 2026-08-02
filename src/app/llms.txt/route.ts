import { MODELS } from "@/content/models";
import { CATEGORIES, CATEGORY_LABEL } from "@/content/taxonomy";
import { company, hasUnresolvedBrand } from "@/lib/company";
import { fromMonthly } from "@/engine/quote";
import { CATEGORY_SLUGS, routes, type CategoryKey } from "@/lib/routes";
import { absolute, isIndexable } from "@/lib/seo";

/**
 * llms.txt - a plain-language map of the site for AI search.
 *
 * Generated rather than written, so it cannot drift from the catalogue the way
 * a hand-maintained file would. Worth having here specifically: AI Overviews
 * already appear on four of six sampled Bulgarian vending queries, and this is
 * the only site in the market publishing machine-readable rental prices, so
 * being legible to an assistant is a real advantage rather than a formality.
 *
 * Gated on the same flag as indexing. Inviting assistants to read a catalogue
 * priced at placeholders would spread figures that are slow to correct - the
 * same reasoning as robots.ts.
 */
export const dynamic = "force-static";

export function GET() {
  if (!isIndexable()) {
    return new Response("Not found", { status: 404 });
  }

  const name = hasUnresolvedBrand() ? company.legalName : company.brandName;
  const from = Math.min(...MODELS.map((m) => fromMonthly(m.id)));

  const categories = CATEGORIES.map((c) => {
    const models = MODELS.filter((m) => m.category === c);
    const cheapest = Math.min(...models.map((m) => fromMonthly(m.id)));
    return `- [${CATEGORY_LABEL[c]}](${absolute(`/${CATEGORY_SLUGS[c as CategoryKey]}`)}): ${models.length} модела под наем, от ${cheapest} €/месец`;
  }).join("\n");

  const key = [
    [routes.pricing, "Цени - месечна цена по категории и какво влиза в нея"],
    [routes.buyVsRent, "Наем или покупка - сравнение на пълната цена за 3-10 години"],
    [routes.howItWorks, "Как протича наемът - от избора до монтажа"],
    [routes.recommender, "Коя машина е подходяща - препоръка по обект и брой хора"],
    [routes.faq, "Често задавани въпроси"],
    [routes.legal.rental, "Условия за наем"],
    [routes.contact, "Контакти"],
  ]
    .map(([path, label]) => `- [${label}](${absolute(path)})`)
    .join("\n");

  const body = `# ${name}

> Вендинг машини под наем в България - кафе, снакс, комбинирани и автомати за
> студени напитки. Машините са употребявани и реновирани, всяка с публикувана
> месечна цена, година и състояние. От ${from} €/месец.

Наемодател на вендинг оборудване в България. За разлика от повечето сайтове в
бранша, тук цената, наличността и състоянието на всяка машина са публикувани
предварително, без да е нужно обаждане.

Ключови факти:

- Обхват: само България. Доставка и монтаж в цялата страна.
- Срок на договора: 12 до 60 месеца, с изкупуване по остатъчна стойност в края.
- В наема влизат доставка, монтаж, сервиз при нормална експлоатация, техническа
  поддръжка и застраховка на машината.
- Клиентът зарежда машината с продукти. Зареждането може да се поеме от нас по
  отделна оферта.
- Реакция при сервизен сигнал: до 48 часа в страната, до 24 часа в областните
  градове.
- Цените са в евро, без ДДС, и са ориентировъчни до изготвяне на оферта.
- Работно време за запитвания: ${company.workingHours}

## Каталог

${categories}

## Основни страници

${key}

## Бележки

- Машините са спрени от производство; техническите данни идват от архивни
  сервизни ръководства и там, където липсват, се отбелязва „няма данни“ вместо
  да се допълват по предположение.
- Наличността се обновява ръчно и при остарели данни сайтът показва „проверете
  наличност“ вместо брой.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
