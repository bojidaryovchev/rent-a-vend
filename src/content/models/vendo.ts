import type { Model, PhotoInput } from "../schema";

/**
 * SandenVendo G-Snack and G-Drink, Design line.
 *
 * The one manufacturer in the catalogue whose pages are still up, so unlike the
 * discontinued Necta range these figures come from the maker rather than from
 * archived manuals and dealer listings. Nothing here is inferred.
 *
 * Capacities are the MAXIMUM configuration the manufacturer publishes - seven
 * shelves rather than the standard five or six. That is the only figure quoted
 * for both lines, so it is the only one that compares like with like, and seven
 * shelves times the selections per shelf reproduces the published totals
 * exactly. A machine delivered in standard trim holds less; the spec source
 * says so rather than the number quietly overstating.
 *
 * Both lines split the body from the payment column, which is why they get
 * through a doorway a machine of this width otherwise would not.
 */

type Draft = Omit<
  Model,
  "spec" | "recommendation" | "photos" | "cabinetOf" | "coffeeUnit" | "condition"
> & {
  /** Set only where a variant differs from its base model behind the panel. */
  cabinetOf?: string | null;
  /** Set only on machines supplied new. Omitted is refurbished, which is most
   *  of the stock - see `schema.ts`. */
  condition?: Model["condition"];
} & {
  spec?: Partial<Model["spec"]>;
  recommendation?: Partial<Model["recommendation"]>;
  /** Empty until this model is photographed; see docs/photography.md. */
  photos?: PhotoInput[];
};

const SPEC_SOURCE = "SandenVendo продуктова страница (макс. конфигурация)";

export const vendo: Draft[] = [
  {
    id: "vendo-g-snack-design-6",
    slug: "vendo-g-snack-design-6",
    photos: [
      {
        src: "/machines/vendo-g-snack-design-6/front.png",
        alt: "Снакс автомат Vendo G-Snack Design 6, изглед отпред",
        view: "front",
        credit: "Фабрично изображение на SandenVendo",
      },
      {
        src: "/machines/vendo-g-snack-design-6/side.png",
        alt: "Снакс автомат Vendo G-Snack Design 6, изглед отстрани",
        view: "side",
        credit: "Фабрично изображение на SandenVendo",
      },
    ],
    name: "Vendo G-Snack Design 6",
    manufacturer: "vendo",
    category: "snack",
    currentName: null,
    specSource: SPEC_SOURCE,
    intro:
      "Най-тясната от трите G-Snack Design. Минава през врата, която по-широка машина не минава, защото платежната колона се отделя от корпуса.",
    spec: {
      numberOfSelections: 42,
      protocol: "Executive / MDB",
      heightMm: 1830,
      widthMm: 830,
      depthMm: 845,
      weightKg: 275,
      voltage: "230/240 V",
      maxPowerW: 350,
      frequencyHz: 50,
      numTrays: 7,
      temperature: "+2 °C до +18 °C",
      configuration: "Снаксове, кутии и бутилки",
    },
    recommendation: {
      venueTypes: ["office", "manufacturing", "car-service", "gym"],
      minHeadcount: 30,
      maxHeadcount: 100,
      dailyCapacity: 100,
      shifts: [1, 2],
      products: ["snack", "cold"],
    },
  },
  {
    id: "vendo-g-snack-design-8",
    slug: "vendo-g-snack-design-8",
    photos: [
      {
        src: "/machines/vendo-g-snack-design-8/front.png",
        alt: "Снакс автомат Vendo G-Snack Design 8, изглед отпред",
        view: "front",
        credit: "Фабрично изображение на SandenVendo",
      },
      {
        src: "/machines/vendo-g-snack-design-8/side.png",
        alt: "Снакс автомат Vendo G-Snack Design 8, изглед отстрани",
        view: "side",
        credit: "Фабрично изображение на SandenVendo",
      },
    ],
    name: "Vendo G-Snack Design 8",
    manufacturer: "vendo",
    category: "snack",
    currentName: null,
    specSource: SPEC_SOURCE,
    intro:
      "Средната G-Snack Design - осем избора на рафт при 980 мм ширина. Работният кон за обект с две смени.",
    spec: {
      numberOfSelections: 56,
      protocol: "Executive / MDB",
      heightMm: 1830,
      widthMm: 980,
      depthMm: 845,
      weightKg: 310,
      voltage: "230/240 V",
      maxPowerW: 350,
      frequencyHz: 50,
      numTrays: 7,
      temperature: "+2 °C до +18 °C",
      configuration: "Снаксове, кутии и бутилки",
    },
    recommendation: {
      venueTypes: ["manufacturing", "warehouse", "logistics", "school"],
      minHeadcount: 60,
      maxHeadcount: 180,
      dailyCapacity: 150,
      shifts: [2, 3],
      products: ["snack", "cold"],
    },
  },
  {
    id: "vendo-g-snack-design-10",
    slug: "vendo-g-snack-design-10",
    photos: [
      {
        src: "/machines/vendo-g-snack-design-10/front.png",
        alt: "Снакс автомат Vendo G-Snack Design 10, изглед отпред",
        view: "front",
        credit: "Фабрично изображение на SandenVendo",
      },
      {
        src: "/machines/vendo-g-snack-design-10/side.png",
        alt: "Снакс автомат Vendo G-Snack Design 10, изглед отстрани",
        view: "side",
        credit: "Фабрично изображение на SandenVendo",
      },
    ],
    name: "Vendo G-Snack Design 10",
    manufacturer: "vendo",
    category: "snack",
    currentName: null,
    specSource: SPEC_SOURCE,
    intro:
      "Най-широката G-Snack Design, до 70 избора. За обект, на който зареждането веднъж седмично трябва да стигне.",
    spec: {
      numberOfSelections: 70,
      protocol: "Executive / MDB",
      heightMm: 1830,
      widthMm: 1125,
      depthMm: 845,
      weightKg: 340,
      voltage: "230/240 V",
      maxPowerW: 350,
      frequencyHz: 50,
      numTrays: 7,
      temperature: "+2 °C до +18 °C",
      configuration: "Снаксове, кутии и бутилки",
    },
    recommendation: {
      venueTypes: ["manufacturing", "logistics", "hospital", "school", "retail"],
      minHeadcount: 100,
      maxHeadcount: 300,
      dailyCapacity: 220,
      shifts: [2, 3],
      products: ["snack", "cold"],
    },
  },
  {
    id: "vendo-g-drink-design-6",
    slug: "vendo-g-drink-design-6",
    photos: [
      {
        src: "/machines/vendo-g-drink-design-6/front.png",
        alt: "Автомат за студени напитки Vendo G-Drink Design 6, изглед отпред",
        view: "front",
        credit: "Фабрично изображение на SandenVendo",
      },
      {
        src: "/machines/vendo-g-drink-design-6/side.png",
        alt: "Автомат за студени напитки Vendo G-Drink Design 6, изглед отстрани",
        view: "side",
        credit: "Фабрично изображение на SandenVendo",
      },
    ],
    name: "Vendo G-Drink Design 6",
    manufacturer: "vendo",
    category: "cold",
    currentName: null,
    specSource: SPEC_SOURCE,
    intro:
      "Автомат за студени напитки с вертикален асансьор - бутилката се сваля, а не пада, така че газираното не се разклаща. До 336 кутии или 240 бутилки.",
    spec: {
      numberOfSelections: 42,
      protocol: "Executive / MDB",
      heightMm: 1830,
      widthMm: 940,
      depthMm: 845,
      weightKg: 295,
      voltage: "230/240 V",
      maxPowerW: 370,
      frequencyHz: 50,
      numTrays: 7,
      elevator: "Вертикален асансьор",
      temperature: "+2 °C до +10 °C",
      productCapacity: 336,
      configuration: "Кутии 0.33 л и бутилки 0.5 л",
    },
    recommendation: {
      venueTypes: ["office", "gym", "school", "retail", "manufacturing"],
      minHeadcount: 40,
      maxHeadcount: 150,
      dailyCapacity: 120,
      shifts: [1, 2],
      products: ["cold"],
    },
  },
  {
    id: "vendo-g-drink-design-9",
    slug: "vendo-g-drink-design-9",
    photos: [
      {
        src: "/machines/vendo-g-drink-design-9/front.png",
        alt: "Автомат за студени напитки Vendo G-Drink Design 9, изглед отпред",
        view: "front",
        credit: "Фабрично изображение на SandenVendo",
      },
      {
        src: "/machines/vendo-g-drink-design-9/side.png",
        alt: "Автомат за студени напитки Vendo G-Drink Design 9, изглед отстрани",
        view: "side",
        credit: "Фабрично изображение на SandenVendo",
      },
    ],
    name: "Vendo G-Drink Design 9",
    manufacturer: "vendo",
    category: "cold",
    currentName: null,
    specSource: SPEC_SOURCE,
    intro:
      "Голямата G-Drink Design - до 504 кутии или 360 бутилки, също с вертикален асансьор. За обект, на който студената напитка свършва преди края на смяната.",
    spec: {
      numberOfSelections: 63,
      protocol: "Executive / MDB",
      heightMm: 1830,
      widthMm: 1215,
      depthMm: 845,
      weightKg: 345,
      voltage: "230/240 V",
      maxPowerW: 370,
      frequencyHz: 50,
      numTrays: 7,
      elevator: "Вертикален асансьор",
      temperature: "+2 °C до +10 °C",
      productCapacity: 504,
      configuration: "Кутии 0.33 л и бутилки 0.5 л",
    },
    recommendation: {
      venueTypes: ["manufacturing", "logistics", "school", "retail", "gym"],
      minHeadcount: 100,
      maxHeadcount: 300,
      dailyCapacity: 200,
      shifts: [2, 3],
      products: ["cold"],
    },
  },
];
