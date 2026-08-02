/**
 * Shared vocabularies.
 *
 * One venue taxonomy serves four features - filters, comparison, alternatives
 * and the recommender - so the visitor never picks a category in one place and
 * fails to find it in another. Twelve detailed types are shown on machine pages
 * and in the recommender; they collapse to six groups for filtering, because
 * twelve types against 62 models produces empty result pages.
 */

export const CATEGORIES = ["coffee", "snack", "combo", "cold"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABEL: Record<Category, string> = {
  coffee: "Кафе машини",
  snack: "Снакс машини",
  combo: "Комбинирани машини",
  cold: "Автомати за студени напитки",
};

/**
 * Counting form for individual machines - "1 кафе автомат", "2 кафе автомата" -
 * as opposed to the category label, which heads a listing page. Bulgarian takes
 * a distinct count form after a numeral, so both are stored rather than guessed.
 */
export const CATEGORY_UNIT_LABEL: Record<Category, { one: string; many: string }> = {
  coffee: { one: "кафе автомат", many: "кафе автомата" },
  snack: { one: "снакс автомат", many: "снакс автомата" },
  combo: { one: "комбинирана машина", many: "комбинирани машини" },
  cold: {
    one: "автомат за студени напитки",
    many: "автомата за студени напитки",
  },
};

/* -- venues ------------------------------------------------------------- */

export const VENUE_TYPES = [
  "office",
  "business-centre",
  "manufacturing",
  "warehouse",
  "logistics",
  "hotel",
  "car-service",
  "car-wash",
  "school",
  "hospital",
  "retail",
  "gym",
] as const;
export type VenueType = (typeof VENUE_TYPES)[number];

export const VENUE_LABEL: Record<VenueType, string> = {
  office: "Офис",
  "business-centre": "Бизнес сграда",
  manufacturing: "Производствено предприятие",
  warehouse: "Склад",
  logistics: "Логистична база",
  hotel: "Хотел",
  "car-service": "Автосервиз",
  "car-wash": "Автомивка",
  school: "Училище",
  hospital: "Болница",
  retail: "Търговски обект",
  gym: "Фитнес",
};

export const VENUE_GROUPS = [
  "office",
  "industry",
  "hospitality",
  "automotive",
  "public",
  "retail",
] as const;
export type VenueGroup = (typeof VENUE_GROUPS)[number];

export const VENUE_GROUP_LABEL: Record<VenueGroup, string> = {
  office: "Офис и бизнес сграда",
  industry: "Производство и склад",
  hospitality: "Хотел и заведение",
  automotive: "Автосервиз и автомивка",
  public: "Училище и болница",
  retail: "Търговски обект и фитнес",
};

export const VENUE_TO_GROUP: Record<VenueType, VenueGroup> = {
  office: "office",
  "business-centre": "office",
  manufacturing: "industry",
  warehouse: "industry",
  logistics: "industry",
  hotel: "hospitality",
  "car-service": "automotive",
  "car-wash": "automotive",
  school: "public",
  hospital: "public",
  retail: "retail",
  gym: "retail",
};

/* -- products ----------------------------------------------------------- */

export const PRODUCT_KINDS = ["coffee", "snack", "cold", "food"] as const;
export type ProductKind = (typeof PRODUCT_KINDS)[number];

export const PRODUCT_LABEL: Record<ProductKind, string> = {
  coffee: "Топли напитки",
  snack: "Снаксове",
  cold: "Студени напитки",
  food: "Храна",
};

/* -- photography --------------------------------------------------------- */

/**
 * The four views that make up one model's set (decision D25).
 *
 * Fixed rather than free-form so a model with three photos is visibly missing
 * one, and so the gallery can label a frame without the photographer writing a
 * caption for all 62 models.
 */
export const PHOTO_VIEWS = ["front", "side", "interior", "payment"] as const;
export type PhotoView = (typeof PHOTO_VIEWS)[number];

export const PHOTO_VIEW_LABEL: Record<PhotoView, string> = {
  front: "Отпред",
  side: "Отстрани",
  interior: "Вътрешност",
  payment: "Зона за плащане",
};

/* -- condition and availability ----------------------------------------- */

/**
 * One statement for every machine, in place of a per-unit grade.
 *
 * The A/B/C/as-is rubric that used to live here was dropped at the client's
 * request: every machine he lets out is refurbished and tested first, so
 * sorting the stock into letters described a difference he does not make.
 */
export const CONDITION_STATEMENT =
  "Изцяло рециклирана, проверена от нашия екип, готова за употреба.";

/** The same claim split up, for the places where a list reads better. */
export const CONDITION_POINTS = [
  "Изцяло рециклирана",
  "Проверена от нашия екип",
  "Готова за употреба",
] as const;

export const UNIT_STATUSES = [
  "available",
  "reserved",
  "rented",
  "incoming",
  "sold",
  "servicing",
] as const;
export type UnitStatus = (typeof UNIT_STATUSES)[number];

export const STATUS_LABEL: Record<UnitStatus, string> = {
  available: "Налична",
  reserved: "Резервирана",
  rented: "Отдадена под наем",
  incoming: "Очаквана доставка",
  sold: "Продадена",
  servicing: "В сервиз",
};

/** Which statuses count as "you can rent this today". */
export const RENTABLE_STATUSES: UnitStatus[] = ["available"];

/** Tone mapping for the three visual treatments the design system carries. */
export const STATUS_TONE: Record<UnitStatus, "available" | "reserved" | "unavailable"> = {
  available: "available",
  reserved: "reserved",
  incoming: "reserved",
  rented: "unavailable",
  sold: "unavailable",
  servicing: "unavailable",
};

/* -- contract terms ------------------------------------------------------ */

export const TERMS = [12, 24, 36, 48, 60] as const;
export type Term = (typeof TERMS)[number];

/** Shifts drive demand as much as headcount does. */
export const SHIFT_OPTIONS = [1, 2, 3] as const;
export type Shifts = (typeof SHIFT_OPTIONS)[number];
