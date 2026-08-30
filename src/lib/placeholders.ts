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
  | "domain"
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
      "Цените вече се въвеждат от панела: /admin/tseni, по машина и по петте срока. " +
      "Попълва се цената за 12 месеца, останалите четири се предлагат сами и остават редактируеми. " +
      "Машина без въведена цена показва временна, изведена от каталожните данни, и екранът брои колко са останали. " +
      "Този запис се затваря ръчно, когато клиентът мине през целия каталог - readiness е скрипт без достъп до базата и не може да преброи вместо него.",
    owner: "client",
    blocksLaunch: true,
    resolved: false,
  },
  {
    id: "model-photos",
    label: "Снимки на моделите",
    detail:
      "Заместващи изображения. Нужен е по един комплект реални снимки за всеки модел: отпред, отстрани, вътрешност, зона за плащане. Сайтът вече ги показва - файловете влизат в public/machines/<slug>/ и по един ред в каталога, без промяна по кода (виж docs/catalogue.md).",
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
      "Получени на 2 август 2026 г.: името Rent-a-Vend и логото. Знакът стои в public/logo-icon-only.png, а светлият вариант за тъмен фон - в logo-icon-only-light.png. Домейнът се води отделно, виж „Домейн“.",
    owner: "client",
    blocksLaunch: true,
    resolved: true,
  },
  /**
   * Was a sentence inside `brand-name` - "заменя се, след като бъде избрано име
   * и регистриран домейн". The name and the logo arrived; the domain did not,
   * and resolving that one record would have taken the domain down with it
   * silently. It is its own deliverable, so it is its own row.
   *
   * The comment sits outside the object on purpose: `scripts/readiness.mjs`
   * matches records with /\{\s*id:/, so anything between the brace and the id
   * hides the record from the launch gate entirely.
   */
  {
    id: "domain",
    label: "Домейн",
    detail:
      "Домейнът е получен на 2 август 2026 г.: rent-a-vend.com, с проверени DKIM, SPF и MX записи в Resend, тоест домейнът и изпраща, и получава поща. NEXT_PUBLIC_SITE_URL е зададен локално. Остава същата стойност да влезе в средата на продукцията при първото качване - от нея зависят каноничните адреси, sitemap.xml, robots.txt и всички абсолютни адреси в структурираните данни, а по подразбиране те сочат към example.invalid.",
    owner: "client",
    blocksLaunch: true,
    resolved: false,
  },
  {
    id: "case-studies",
    label: "Казуси",
    detail:
      "Три реални казуса са публикувани: завод със собствено управление на 10 машини, Necta Canto ES + Lavazza Blue и Necta Brio 3 + Mini Snakky. Броят е достатъчен. Остава писмено потвърждение от клиентите, че проектите могат да се публикуват, и описание на обекта за два от трите - засега са без такова, защото не е съгласувано.",
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
