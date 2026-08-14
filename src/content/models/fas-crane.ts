import type { Model, PhotoInput } from "../schema";

/**
 * FAS International and Crane.
 *
 * FAS has completed the transition of its entire portfolio from R134a to CO2
 * (R744) refrigerant - a verifiable environmental claim that matters in tenders
 * from schools, hospitals and corporates with procurement ESG criteria. It is
 * stated on the machines it applies to rather than as a generic badge.
 *
 * Crane's Merchant line is ambient glass-front SNACK equipment; only BevMax is
 * a cold drinks machine. Grouping all Crane under cold drinks would hide the
 * Merchants from snack buyers and mislead drinks buyers.
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

export const fasCrane: Draft[] = [
  /* -- FAS ---------------------------------------------------------------- */
  {
    id: "fas-900",
    slug: "fas-900",
    photos: [
      {
        src: "/machines/fas-900/front.png",
        alt: "Снакс автомат FAS 900, изглед отпред",
        view: "front",
        credit: "Фабрично изображение на FAS International",
      },
    ],
    name: "FAS 900",
    manufacturer: "fas",
    category: "snack",
    currentName: null,
    specSource: "Дилърски спецификации (Vending Systems, Vendex)",
    intro:
      "Широка италианска машина с шест рафта и до 56 позиции. Здрава конструкция за натоварени обекти.",
    spec: {
      userInterface: "Бутони",
      numberOfSelections: 56,
      heightMm: 1840,
      widthMm: 1010,
      depthMm: 895,
      weightKg: 260,
      voltage: "230 V",
      numTrays: 6,
      dispensingSystem: "Спирали",
    },
    recommendation: {
      venueTypes: ["manufacturing", "warehouse", "logistics", "school"],
      minHeadcount: 100,
      maxHeadcount: 300,
      dailyCapacity: 200,
      shifts: [2, 3],
      products: ["snack", "cold"],
    },
  },
  {
    id: "fas-1050",
    slug: "fas-1050",
    photos: [
      {
        src: "/machines/fas-1050/front.png",
        alt: "Снакс автомат FAS 1050, изглед отпред",
        view: "front",
        credit: "Фабрично изображение на FAS International",
      },
    ],
    name: "FAS 1050",
    manufacturer: "fas",
    category: "snack",
    currentName: null,
    specSource: "FAS International продуктова страница, VP Salestech",
    intro:
      "До 70 селекции и шест рафта по осем спирали. Поддържа Executive, BDV и MDB, тоест приема почти всяко платежно устройство.",
    spec: {
      userInterface: "Тъч дисплей 7\"",
      numberOfSelections: 70,
      protocol: "Executive · BDV · MDB",
      heightMm: 1830,
      widthMm: 860,
      depthMm: 760,
      voltage: "230 V",
      numTrays: 6,
      dispensingSystem: "Спирали (8 на рафт)",
    },
    recommendation: {
      venueTypes: ["manufacturing", "warehouse", "logistics", "school", "hospital"],
      minHeadcount: 100,
      maxHeadcount: 350,
      dailyCapacity: 250,
      shifts: [2, 3],
      products: ["snack", "cold"],
    },
  },
  {
    id: "fas-1050-plus",
    slug: "fas-1050-plus",
    cabinetOf: "fas-1050",
    name: "FAS 1050 Plus",
    manufacturer: "fas",
    category: "snack",
    currentName: null,
    specSource: "Вариант на FAS 1050 - общ корпус",
    intro: "FAS 1050 с разширено оборудване.",
    spec: {
      protocol: "Executive · BDV · MDB",
      heightMm: 1830,
      widthMm: 860,
      depthMm: 760,
      voltage: "230 V",
      numTrays: 6,
      dispensingSystem: "Спирали (8 на рафт)",
    },
    recommendation: {
      venueTypes: ["manufacturing", "warehouse", "logistics", "hospital"],
      minHeadcount: 100,
      maxHeadcount: 350,
      dailyCapacity: 250,
      shifts: [2, 3],
      products: ["snack", "cold"],
    },
  },
  {
    id: "fas-1050-evo",
    slug: "fas-1050-evo",
    cabinetOf: "fas-1050",
    name: "FAS 1050 EVO",
    manufacturer: "fas",
    category: "snack",
    currentName: null,
    specSource: "Вариант на FAS 1050 - общ корпус, CO2 охлаждане",
    intro:
      "Обновената FAS 1050 с охлаждащ агрегат на CO2 (R744) - природен газ с нисък парников потенциал.",
    spec: {
      protocol: "Executive · BDV · MDB",
      heightMm: 1830,
      widthMm: 860,
      depthMm: 760,
      voltage: "230 V",
      numTrays: 6,
      dispensingSystem: "Спирали (8 на рафт)",
    },
    recommendation: {
      venueTypes: ["manufacturing", "school", "hospital", "logistics"],
      minHeadcount: 100,
      maxHeadcount: 350,
      dailyCapacity: 250,
      shifts: [2, 3],
      products: ["snack", "cold"],
    },
  },
  {
    id: "fas-easy-6000",
    slug: "fas-easy-6000",
    photos: [
      {
        src: "/machines/fas-easy-6000/front.png",
        alt: "Барабанен автомат FAS Easy 6000, изглед отпред",
        view: "front",
        credit: "Фабрично изображение на FAS International",
      },
    ],
    name: "FAS Easy 6000",
    manufacturer: "fas",
    category: "snack",
    currentName: null,
    specSource: "FAS International продуктова страница, Westomatic",
    intro:
      "Барабанна машина за прясна храна. Осем барабана с регулируеми клетки и охлаждане до 5 °C - подходяща за сандвичи и салати.",
    spec: {
      numberOfSelections: 48,
      heightMm: 1830,
      widthMm: 910,
      depthMm: 790,
      depthOpenMm: 1660,
      weightKg: 315,
      voltage: "230 V",
      dispensingSystem: "Барабани (8 бр., 120 мм)",
      temperature: "5 °C и по-ниска",
      configuration: "Клетки по 4/6/8/12/16/24/48 на барабан",
    },
    recommendation: {
      venueTypes: ["manufacturing", "hospital", "school", "business-centre", "logistics"],
      minHeadcount: 120,
      maxHeadcount: 400,
      dailyCapacity: 200,
      shifts: [2, 3],
      products: ["food", "snack"],
    },
  },

  /* -- Crane: cold drinks -------------------------------------------------- */
  {
    id: "crane-bevmax-media-2-6",
    slug: "crane-bevmax-media-2-6",
    photos: [
      {
        src: "/machines/crane-bevmax-media-2-6/front.png",
        alt: "Автомат за студени напитки Crane BevMax Media 2 6 с шест колони бутилки и кутии, изглед отпред",
        view: "front",
        credit: "Фабрично изображение на производителя",
      },
    ],
    name: "Crane BevMax Media 2 6",
    manufacturer: "crane",
    category: "cold",
    currentName: null,
    specSource: "Crane / CPI продуктова документация",
    intro:
      "Автомат за студени напитки с асансьорна доставка - бутилката не пада, а се сваля. Тъч дисплей 9 инча.",
    spec: {
      userInterface: 'Тъч дисплей 9"',
      numberOfSelections: 45,
      voltage: "230 V",
      elevator: "Прецизна асансьорна доставка",
      configuration: "Кутии и бутилки",
    },
    recommendation: {
      venueTypes: ["manufacturing", "logistics", "gym", "retail", "school"],
      minHeadcount: 80,
      maxHeadcount: 300,
      dailyCapacity: 200,
      shifts: [2, 3],
      products: ["cold"],
    },
  },
  {
    id: "crane-bevmax-media-2-9",
    slug: "crane-bevmax-media-2-9",
    photos: [
      {
        src: "/machines/crane-bevmax-media-2-9/front.png",
        alt: "Автомат за студени напитки Crane BevMax Media 2 9 с девет колони бутилки и кутии, изглед отпред",
        view: "front",
        credit: "Фабрично изображение на производителя",
      },
    ],
    name: "Crane BevMax Media 2 9",
    manufacturer: "crane",
    category: "cold",
    currentName: null,
    specSource: "Crane / CPI продуктова документация",
    intro:
      "По-широкият BevMax с по-голям капацитет, за обекти с постоянен поток.",
    spec: {
      userInterface: 'Тъч дисплей 9"',
      numberOfSelections: 45,
      voltage: "230 V",
      elevator: "Прецизна асансьорна доставка",
      configuration: "Кутии и бутилки",
    },
    recommendation: {
      venueTypes: ["manufacturing", "logistics", "retail", "school", "hospital"],
      minHeadcount: 120,
      maxHeadcount: 400,
      dailyCapacity: 280,
      shifts: [2, 3],
      products: ["cold"],
    },
  },

  /* -- Crane: snack (ambient, glass front) --------------------------------- */
  {
    id: "crane-merchant-4",
    slug: "crane-merchant-4",
    photos: [
      {
        src: "/machines/crane-merchant-4/front.png",
        alt: "Снакс автомат Crane Merchant 4, изглед отпред",
        view: "front",
        credit: "Фабрично изображение на производителя",
      },
    ],
    name: "Crane Merchant 4",
    manufacturer: "crane",
    category: "snack",
    currentName: null,
    specSource: "Crane / CPI продуктова документация",
    intro:
      "По-тесният Merchant, за обекти с ограничено място по ширина.",
    spec: {
      userInterface: "Тъч дисплей",
      heightMm: 1830,
      voltage: "230 V",
      dispensingSystem: "Спирали",
    },
    recommendation: {
      venueTypes: ["office", "car-service", "gym", "retail"],
      minHeadcount: 40,
      maxHeadcount: 120,
      dailyCapacity: 120,
      shifts: [1, 2],
      products: ["snack"],
    },
  },
  {
    id: "crane-merchant-6",
    slug: "crane-merchant-6",
    photos: [
      {
        src: "/machines/crane-merchant-6/front.png",
        alt: "Снакс автомат Crane Merchant 6, изглед отпред",
        view: "front",
        credit: "Фабрично изображение на производителя",
      },
    ],
    name: "Crane Merchant 6",
    manufacturer: "crane",
    category: "snack",
    currentName: null,
    specSource: "Дилърски спецификации (VendTek, AVS Companies)",
    intro:
      "Широка машина с ярко осветена витрина и до 564 продукта. 42 селекции, разширяеми до 58.",
    spec: {
      userInterface: 'Тъч дисплей 9"',
      numberOfSelections: 58,
      heightMm: 1830,
      widthMm: 1180,
      depthMm: 810,
      weightKg: 293,
      voltage: "230 V",
      dispensingSystem: "Спирали",
      productCapacity: 564,
    },
    recommendation: {
      venueTypes: ["manufacturing", "warehouse", "logistics", "school", "retail"],
      minHeadcount: 120,
      maxHeadcount: 400,
      dailyCapacity: 280,
      shifts: [2, 3],
      products: ["snack"],
    },
  },
  {
    id: "crane-merchant-media-2",
    slug: "crane-merchant-media-2",
    photos: [
      {
        src: "/machines/crane-merchant-media-2/front.png",
        alt: "Снакс автомат Crane Merchant Media 2 с тъч дисплей, изглед отпред",
        view: "front",
        credit: "Фабрично изображение на производителя",
      },
    ],
    name: "Crane Merchant Media 2",
    manufacturer: "crane",
    category: "snack",
    currentName: null,
    specSource: "Crane / CPI продуктова документация",
    intro:
      "Merchant с платформата Media2: по-бърз процесор и тъч дисплей с видео.",
    spec: {
      userInterface: 'Тъч дисплей 9"',
      heightMm: 1830,
      voltage: "230 V",
      dispensingSystem: "Спирали",
    },
    recommendation: {
      venueTypes: ["business-centre", "retail", "school", "hospital"],
      minHeadcount: 100,
      maxHeadcount: 350,
      dailyCapacity: 250,
      shifts: [2, 3],
      products: ["snack"],
    },
  },
];
