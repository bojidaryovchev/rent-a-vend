import type { Model, PhotoInput, Spec } from "../schema";

/**
 * Combination machines.
 *
 * A combo is ONE machine, not two. A Brio sits on a Mini Snakky snack base:
 * hot drinks in the top half, snacks, cans and bottles behind the glass below.
 * It arrives on one pallet, occupies one footprint and takes one payment
 * device. The catalogue used to model these as fifteen pairs of cabinets
 * standing side by side, which described a different product - and one the
 * client does not let out.
 *
 * Three pairings survive, which are the three he actually supplies: the Mini
 * Snakky base under a Brio 3, a Brio Up or a Brio Touch.
 *
 * The coffee half is catalogued in its own right, so it is named rather than
 * re-entered and the assembled figures are STACKED onto the base in `index.ts`.
 * Change the Brio's weight and every combo containing one follows.
 */

type ComboDraft = Omit<
  Model,
  "spec" | "recommendation" | "photos" | "cabinetOf" | "condition"
> & {
  cabinetOf?: string | null;
  /** Set only on machines supplied new. Omitted is refurbished - see
   *  `schema.ts`. A combo inherits nothing here: the pairing is stocked as a
   *  unit, so its condition is its own rather than the coffee half's. */
  condition?: Model["condition"];
  recommendation?: Partial<Model["recommendation"]>;
  photos?: PhotoInput[];
};

/**
 * The Mini Snakky base cabinet.
 *
 * Not a catalogue entry: the client supplies it under a Brio, never on its own,
 * and a model page for a machine nobody can rent is a page that generates
 * enquiries we have to turn down. It is a spec, held here, feeding the three
 * machines that are actually for sale.
 *
 * Figures agree across two independent sources, which is why they are stated
 * rather than left null. Necta has since renamed the machine Gusto 6 Mini and
 * republished it at 600 mm wide, 130 kg and 150 W - the current production
 * cabinet, not the one in the stock these combos are built from.
 */
const MINI_SNAKKY_BASE: Partial<Spec> = {
  heightMm: 1080,
  widthMm: 580,
  depthMm: 935,
  depthOpenMm: 1450,
  weightKg: 125,
  voltage: "230 V",
  maxPowerW: 250,
  frequencyHz: 50,
  numberOfSelections: 24,
  numTrays: 4,
  dispensingSystem: "Спирали",
  temperature: "9 °C",
  productCapacity: 252,
  configuration: "Снаксове, кутии и бутилки",
};

export const MINI_SNAKKY = {
  name: "Mini Snakky",
  spec: MINI_SNAKKY_BASE,
  specSource:
    "Дилърски спецификации за Mini Snakky (Coffee Machines Co, device.report); " +
    "Necta днес предлага корпуса като Gusto 6 Mini",
} as const;

interface Pairing {
  /** The catalogued coffee machine mounted on the base. */
  coffee: string;
  slug: string;
  name: string;
  venueTypes: Model["recommendation"]["venueTypes"];
  minHeadcount: number;
  maxHeadcount: number;
  dailyCapacity: number;
  shifts: Model["recommendation"]["shifts"];
  intro: string;
  photos?: PhotoInput[];
}

/**
 * Sized as one compact machine, not as a coffee machine plus a snack machine.
 *
 * The base holds four trays; that is a single small snack cabinet's worth of
 * stock, and a site that empties it daily wants two separate machines instead.
 * So the band tops out at 70 people - well under what the Brio alone would
 * serve - and the recommender offers the combo only inside it.
 */
const PAIRINGS: Pairing[] = [
  {
    coffee: "brio-3",
    slug: "necta-brio-3-minisnakky",
    name: "Necta Brio 3 + Mini Snakky",
    venueTypes: ["office", "car-service", "car-wash", "gym", "retail"],
    minHeadcount: 15,
    maxHeadcount: 60,
    dailyCapacity: 80,
    shifts: [1, 2],
    intro:
      "Кафе машина върху снакс шкаф - една машина, едно място, едно устройство " +
      "за плащане. Горе топли напитки, долу снаксове, кутии и бутилки.",
  },
  {
    coffee: "brio-up",
    slug: "necta-brio-up-minisnakky",
    name: "Necta Brio Up + Mini Snakky",
    venueTypes: ["office", "car-service", "car-wash", "gym", "retail"],
    minHeadcount: 15,
    maxHeadcount: 70,
    dailyCapacity: 80,
    shifts: [1, 2],
    intro:
      "Обновената Brio върху снакс шкаф. Един корпус с кафе, студени напитки и " +
      "снаксове - за обект, в който няма място за две машини.",
  },
  {
    coffee: "brio-touch",
    slug: "necta-brio-touch-minisnakky",
    name: "Necta Brio Touch + Mini Snakky",
    venueTypes: ["office", "business-centre", "hotel", "retail", "gym"],
    minHeadcount: 15,
    maxHeadcount: 70,
    dailyCapacity: 80,
    shifts: [1, 2],
    intro:
      "Brio Touch върху снакс шкаф. Тъч дисплеят избира и от двете половини - " +
      "напитка отгоре, снакс отдолу, без втора клавиатура.",
  },
];

export const combos: ComboDraft[] = PAIRINGS.map((p) => ({
  id: p.slug,
  slug: p.slug,
  name: p.name,
  manufacturer: "necta" as const,
  category: "combo" as const,
  currentName: null,
  coffeeUnit: p.coffee,
  specSource: `Изчислено от ${p.name.split(" + ")[0]} върху корпус Mini Snakky`,
  photos: p.photos ?? [
    {
      src: `/machines/${p.slug}/front.png`,
      alt: `Комбинирана машина ${p.name} - кафе машина върху снакс шкаф, изглед отпред`,
      view: "front" as const,
      credit: "Фабрично изображение на производителя",
    },
  ],
  intro: p.intro,
  recommendation: {
    venueTypes: p.venueTypes,
    minHeadcount: p.minHeadcount,
    maxHeadcount: p.maxHeadcount,
    dailyCapacity: p.dailyCapacity,
    shifts: p.shifts,
    products: ["coffee", "snack", "cold"],
  },
}));
