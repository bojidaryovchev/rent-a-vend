/**
 * The placeholder contract.
 *
 * Everything the client still owes is content, not structure, so the site is
 * built against marked stubs and the real data swaps in later. The danger is
 * that a stub ships unnoticed - a plausible-looking wrong price is worse than
 * no price at all, and the placeholder rate sits inside the real market band.
 *
 * So every stub is registered here. `npm run readiness` reads this file, and a
 * production build refuses to proceed while anything blocking is unresolved
 * unless it is explicitly overridden.
 *
 * To retire a placeholder: land the real data, then flip `resolved` to true.
 */

export type PlaceholderId =
  | "brand-name"
  | "rental-prices"
  | "model-photos"
  | "model-copy"
  | "case-studies"
  | "spec-gaps"
  | "company-details"
  | "map-location"
  | "service-costs";

export interface PlaceholderRecord {
  id: PlaceholderId;
  label: string;
  detail: string;
  /** Owed by us, or by the client. */
  owner: "client" | "us";
  /** True when the site must not go live while this is still a stub. */
  blocksLaunch: boolean;
  resolved: boolean;
}

export const PLACEHOLDERS: PlaceholderRecord[] = [
  {
    id: "rental-prices",
    label: "Наемни цени",
    detail:
      "Всички машини използват временна ставка от 100 EUR/месец за всички срокове. Нужна е реална цена за всяка машина по 12/24/36/48/60 месеца.",
    owner: "client",
    blocksLaunch: true,
    resolved: false,
  },
  {
    id: "model-photos",
    label: "Снимки на моделите",
    detail:
      "Заместващи изображения. Нужен е по един комплект реални снимки за всеки модел: отпред, отстрани, вътрешност, зона за плащане. Сайтът вече ги показва - файловете влизат в public/machines/<slug>/ и по един ред в каталога, без промяна по кода (виж docs/photography.md).",
    owner: "client",
    blocksLaunch: true,
    resolved: false,
  },
  {
    id: "company-details",
    label: "Данни за фирмата",
    detail:
      "Получени на 2 август 2026 г.: Лидер офис МЛ ЕООД, ЕИК 204578516, с. Марково. За потвърждение остава дали фирмата е регистрирана по ДДС - подаденото „BG204578516“ е ДДС форматът на същия ЕИК.",
    owner: "client",
    blocksLaunch: true,
    resolved: true,
  },
  {
    id: "map-location",
    label: "Локация за картата - за потвърждение",
    detail:
      "Картата вече сочи към Околовръстен път 86, с. Марково (42.089274, 24.699687). Тези координати НЕ са получени от клиента - взети са от картата на сайта на „Офис Лидер“ (mlstore.eu), който публикува същия адрес, същото работно време и телефон, съвпадащ с нашия. Много вероятно е същият двор, но иска едно „да“ от клиента, а и една дума кой е входът. Само адресът не стига: „местност Бедрозов бунар“ е местност, не улица, и Google я поставя в средата на Марково, на 2.8 км от мястото. Поправя се в mapPin в src/lib/company.ts.",
    owner: "client",
    blocksLaunch: false,
    resolved: false,
  },
  {
    id: "brand-name",
    label: "Име и лого",
    detail:
      "Работи се с временен словен знак. Заменя се, след като бъде избрано име и регистриран домейн.",
    owner: "client",
    blocksLaunch: true,
    resolved: false,
  },
  {
    id: "case-studies",
    label: "Казуси",
    detail:
      "Две примерни структури без реално съдържание. Нужни са 2-3 реални обекта със съгласие на клиента. Измислени казуси не са опция.",
    owner: "client",
    blocksLaunch: true,
    resolved: false,
  },
  {
    id: "spec-gaps",
    label: "Липсващи технически данни",
    detail:
      "Средна пълнота 42%. Necta са свалили страниците на старите модели, затова данните идват от архивни ръководства и дилърски обяви. 19 модела са под 30%. Празните полета се показват като „няма данни“, не се измислят. Липсващото може да се допълни от машините в склада.",
    owner: "us",
    blocksLaunch: false,
    resolved: false,
  },
  {
    id: "model-copy",
    label: "Текстове за моделите",
    detail:
      "Чернови, изготвени по техническите характеристики. Подлежат на преглед и допълване с практическата информация за всеки модел.",
    owner: "us",
    blocksLaunch: false,
    resolved: false,
  },
  {
    id: "service-costs",
    label: "Разходи за сервиз",
    detail:
      "Нужни за калкулатора „покупка или наем“ във версия 2. Годишна цена на обслужване, средна цена на ремонт, честота.",
    owner: "client",
    blocksLaunch: false,
    resolved: false,
  },
];

export const activePlaceholders = (): PlaceholderRecord[] =>
  PLACEHOLDERS.filter((p) => !p.resolved);

export const blockingPlaceholders = (): PlaceholderRecord[] =>
  activePlaceholders().filter((p) => p.blocksLaunch);

export const hasBlockingPlaceholders = (): boolean =>
  blockingPlaceholders().length > 0;

/**
 * Whether the visible "this is not real data yet" banner should render.
 *
 * Shown everywhere except a build that has explicitly opted out, so that no
 * screenshot, preview link or client review can circulate without it.
 */
export const shouldShowPlaceholderBanner = (): boolean => {
  if (process.env.NEXT_PUBLIC_HIDE_PLACEHOLDER_BANNER === "true") return false;
  return hasBlockingPlaceholders();
};
