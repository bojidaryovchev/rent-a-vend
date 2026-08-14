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

/* -- condition ----------------------------------------------------------- */

/**
 * New or refurbished, chosen per model.
 *
 * ⚠ THIS USED TO BE ONE SENTENCE FOR THE WHOLE CATALOGUE, and the history
 * matters because it explains the shape. An A/B/C/as-is rubric was dropped at
 * the client's request (D49): every machine he let out was refurbished and
 * tested first, so sorting the stock into letters described a difference he did
 * not make. One constant was therefore the honest answer.
 *
 * The premise has since changed - the owner now stocks new machines alongside
 * the rebuilt ones. A blanket "изцяло рециклирана" is now false on part of the
 * catalogue, and it also *undersells* it: new is the stronger claim of the two,
 * and printing the weaker one on a new cabinet gives away the sale. So the
 * sentence is selected from `model.condition` instead of being a constant.
 *
 * ⚠ THIS IS NOT A RETURN OF PER-UNIT STATUS (D50). Condition is a property of
 * the model as catalogued, not a live stock record: there is still no count, no
 * availability engine and no per-unit grade. "This model is supplied new" is a
 * standing fact about what the business stocks; "this cabinet is unit #14" is
 * the inventory D50 removed, and nothing here brings it back.
 */
export const CONDITIONS = ["refurbished", "new"] as const;
export type Condition = (typeof CONDITIONS)[number];

/**
 * The one-line claim, per condition.
 *
 * Both end on readiness rather than on provenance, because readiness is what
 * the visitor is actually asking about - a machine that arrives working is the
 * promise, and "нова" or "рециклирана" is only how it got there. The middle
 * clause is identical on purpose: the workshop check happens either way, and a
 * new machine that skipped it would be the surprising thing to say.
 */
export const CONDITION_STATEMENT: Record<Condition, string> = {
  refurbished: "Изцяло рециклирана, проверена от нашия екип, готова за употреба.",
  new: "Чисто нова, проверена от нашия екип, готова за употреба.",
};

/** The same claim split up, for the places where a list reads better. */
export const CONDITION_POINTS: Record<Condition, readonly string[]> = {
  refurbished: [
    "Изцяло рециклирана",
    "Проверена от нашия екип",
    "Готова за употреба",
  ],
  new: ["Чисто нова", "Проверена от нашия екип", "Готова за употреба"],
};

/**
 * What is true of EVERY machine, whatever its condition.
 *
 * The about page promises what happens before a delivery, and that promise now
 * has to cover both halves of the stock. Dropping provenance from the list is
 * not a hedge: the workshop check and the working machine are the parts that
 * were ever a promise, and they are unchanged.
 */
export const CONDITION_PROMISE = [
  "Проверена от нашия екип",
  "Подменени износващи се части",
  "Готова за употреба",
] as const;

/** Badge-sized, for a listing card that has no room for the sentence. */
export const CONDITION_LABEL: Record<Condition, string> = {
  refurbished: "Рециклирана",
  new: "Нова",
};

/**
 * How the catalogue describes itself where it cannot speak per machine - meta
 * descriptions, listing intros, `llms.txt`. Naming both halves is the only
 * honest summary once the stock is mixed.
 */
export const CATALOGUE_CONDITION_SUMMARY = "нови и изцяло рециклирани";

/**
 * `itemCondition` for the JSON-LD offer.
 *
 * Declaring condition in structured data is ground nobody in this market holds,
 * and it is free - but only while it is true per page. A hardcoded value across
 * a mixed catalogue would be a false machine-readable claim, which is a worse
 * failure than omitting it: prose is read by a person who can see the machine,
 * a `schema.org` URL is read by a crawler that cannot.
 */
export const CONDITION_SCHEMA_URL: Record<Condition, string> = {
  refurbished: "https://schema.org/RefurbishedCondition",
  new: "https://schema.org/NewCondition",
};

/** What the catalogue says about supply, everywhere it says anything. */
export const AVAILABILITY_LABEL = "Налична";

/* -- contract terms ------------------------------------------------------ */

export const TERMS = [12, 24, 36, 48, 60] as const;
export type Term = (typeof TERMS)[number];

/** Shifts drive demand as much as headcount does. */
export const SHIFT_OPTIONS = [1, 2, 3] as const;
export type Shifts = (typeof SHIFT_OPTIONS)[number];
