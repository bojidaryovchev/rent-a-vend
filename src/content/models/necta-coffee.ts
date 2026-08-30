import type { Model, PhotoInput } from "../schema";

/**
 * Necta hot drinks machines.
 *
 * Held three Wittenborgs too, until the client confirmed he does not stock
 * them - they left alongside Kalea and Kometa.
 *
 * Every one of these is discontinued: Necta renamed its whole range to Barista
 * and withdrew the old product pages, so figures come from archived service
 * manuals and refurbished-dealer listings rather than the manufacturer. Fields
 * we could not verify stay null and render as "няма данни" - never guessed.
 *
 * Variants that differ only by user interface (Touch) or trim inherit the base
 * cabinet's dimensions, which is a physical fact about these machines rather
 * than an assumption. Where a variant changes the cabinet, it gets its own row.
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
  /** Empty until this model is photographed; see docs/catalogue.md. */
  photos?: PhotoInput[];
};

export const nectaCoffee: Draft[] = [
  /* -- table top ---------------------------------------------------------- */
  {
    id: "korinto",
    slug: "necta-korinto",
    photos: [
      {
        src: "/machines/necta-korinto/front.png",
        alt: "Кафе автомат Necta Korinto, изглед отпред",
        view: "front",
        credit: "Фабрично изображение на производителя",
      },
    ],
    name: "Necta Korinto",
    manufacturer: "necta",
    category: "coffee",
    currentName: null,
    specSource: "Дилърски спецификации (VendTrade, Vending Solutions)",
    intro:
      "Компактна настолна машина за малък офис. Заема минимално място и се зарежда бързо.",
    spec: {
      userInterface: "Бутони",
      numberOfSelections: 8,
      heightMm: 715,
      widthMm: 331,
      depthMm: 530,
      weightKg: 33,
      voltage: "230 V",
    },
    recommendation: {
      venueTypes: ["office", "car-service", "retail"],
      minHeadcount: 5,
      maxHeadcount: 25,
      dailyCapacity: 40,
      shifts: [1],
      products: ["coffee"],
    },
  },
  {
    id: "solista",
    slug: "necta-solista",
    photos: [
      {
        src: "/machines/necta-solista/front.png",
        alt: "Кафе автомат Necta Solista, изглед отпред",
        view: "front",
        credit: "Фабрично изображение на производителя",
      },
    ],
    name: "Necta Solista",
    manufacturer: "necta",
    category: "coffee",
    currentName: null,
    specSource: "Necta Solista overview (архив)",
    intro:
      "Настолна еспресо машина с малък отпечатък, подходяща за приемна или малък екип.",
    spec: {
      userInterface: "Бутони",
      widthMm: 410,
      depthMm: 564,
      weightKg: 42,
      voltage: "230 V",
    },
    recommendation: {
      venueTypes: ["office", "retail", "gym"],
      minHeadcount: 5,
      maxHeadcount: 30,
      dailyCapacity: 50,
      shifts: [1],
      products: ["coffee"],
    },
  },
  {
    id: "colibri",
    slug: "necta-colibri",
    photos: [
      {
        src: "/machines/necta-colibri/front.png",
        alt: "Кафе автомат Necta Colibrì, изглед отпред",
        view: "front",
        credit: "Фабрично изображение на производителя",
      },
    ],
    name: "Necta Colibrì",
    manufacturer: "necta",
    category: "coffee",
    currentName: null,
    specSource: "N&W Global Vending Colibrì Automatic (архивен каталог)",
    intro:
      "Автоматична машина с малък отпечатък и капацитет от 180 чаши. Работи и върху стойка.",
    spec: {
      userInterface: "Бутони",
      heightMm: 1560,
      widthMm: 410,
      depthMm: 490,
      depthOpenMm: 830,
      weightKg: 58,
      voltage: "230 V",
      productCapacity: 180,
    },
    recommendation: {
      venueTypes: ["office", "car-service", "car-wash", "retail"],
      minHeadcount: 10,
      maxHeadcount: 40,
      dailyCapacity: 60,
      shifts: [1, 2],
      products: ["coffee"],
    },
  },
  {
    id: "colibri-c3",
    slug: "necta-colibri-c3",
    cabinetOf: "colibri",
    name: "Necta Colibrì C3",
    manufacturer: "necta",
    category: "coffee",
    currentName: null,
    specSource: "Вариант на Colibrì - общ корпус",
    intro: "Вариант на Colibrì с три контейнера за разтворими продукти.",
    spec: {
      userInterface: "Бутони",
      heightMm: 1560,
      widthMm: 410,
      depthMm: 490,
      depthOpenMm: 830,
      weightKg: 58,
      voltage: "230 V",
      productCapacity: 180,
    },
    recommendation: {
      venueTypes: ["office", "car-service", "retail"],
      minHeadcount: 10,
      maxHeadcount: 40,
      dailyCapacity: 60,
      shifts: [1, 2],
      products: ["coffee"],
    },
  },

  /* -- compact floor standing --------------------------------------------- */
  {
    id: "brio-3",
    slug: "necta-brio-3",
    photos: [
      {
        src: "/machines/necta-brio-3/front.png",
        alt: "Кафе автомат Necta Brio 3, изглед отпред",
        view: "front",
        credit: "Фабрично изображение на производителя",
      },
    ],
    name: "Necta Brio 3",
    manufacturer: "necta",
    category: "coffee",
    currentName: null,
    specSource: "Necta Brio manual H075U03 (архив)",
    intro:
      "Работният кон на малкия офис. Компактна, надеждна и лесна за поддръжка." +
      " Настолна машина - върху стандартна стойка общата височина достига около 1660 мм.",
    spec: {
      userInterface: "Бутони",
      heightMm: 750,
      widthMm: 540,
      depthMm: 550,
      weightKg: 65,
      voltage: "230 V",
      maxPowerW: 1300,
    },
    recommendation: {
      venueTypes: ["office", "car-service", "car-wash", "gym", "retail"],
      minHeadcount: 15,
      maxHeadcount: 50,
      dailyCapacity: 80,
      shifts: [1, 2],
      products: ["coffee"],
    },
  },
  {
    id: "brio-up",
    slug: "necta-brio-up",
    photos: [
      {
        src: "/machines/necta-brio-up/front.png",
        alt: "Кафе автомат Necta Brio Up, изглед отпред",
        view: "front",
        credit: "Фабрично изображение на производителя",
      },
    ],
    name: "Necta Brio Up",
    manufacturer: "necta",
    category: "coffee",
    currentName: null,
    specSource: "Necta Brio manual H075U03 (архив), общ корпус",
    intro:
      "Обновената версия на Brio, със същия отпечатък и по-нов интерфейс." +
      " Настолна машина - върху стандартна стойка общата височина достига около 1660 мм.",
    spec: {
      userInterface: "Бутони",
      heightMm: 750,
      widthMm: 540,
      depthMm: 550,
      weightKg: 65,
      voltage: "230 V",
      maxPowerW: 1300,
    },
    recommendation: {
      venueTypes: ["office", "car-service", "car-wash", "gym", "retail"],
      minHeadcount: 15,
      maxHeadcount: 50,
      dailyCapacity: 80,
      shifts: [1, 2],
      products: ["coffee"],
    },
  },
  {
    id: "brio-touch",
    slug: "necta-brio-touch",
    photos: [
      {
        src: "/machines/necta-brio-touch/front.png",
        alt: "Кафе автомат Necta Brio Touch, изглед отпред",
        view: "front",
        credit: "Фабрично изображение на производителя",
      },
    ],
    name: "Necta Brio Touch",
    manufacturer: "necta",
    category: "coffee",
    currentName: null,
    specSource: "Necta Brio manual H075U03 (архив), общ корпус",
    intro:
      "Brio с тъч дисплей вместо бутони." +
      " Настолна машина - върху стандартна стойка общата височина достига около 1660 мм.",
    spec: {
      userInterface: "Тъч дисплей",
      heightMm: 750,
      widthMm: 540,
      depthMm: 550,
      weightKg: 65,
      voltage: "230 V",
      maxPowerW: 1300,
    },
    recommendation: {
      venueTypes: ["office", "business-centre", "hotel", "retail"],
      minHeadcount: 15,
      maxHeadcount: 50,
      dailyCapacity: 80,
      shifts: [1, 2],
      products: ["coffee"],
    },
  },
  {
    id: "kikko",
    slug: "necta-kikko",
    photos: [
      {
        src: "/machines/necta-kikko/front.png",
        alt: "Кафе автомат Necta Kikko, изглед отпред",
        view: "front",
        credit: "Фабрично изображение на производителя",
      },
    ],
    name: "Necta Kikko",
    manufacturer: "necta",
    category: "coffee",
    currentName: null,
    specSource: "Necta Kikko service manual (архив)",
    intro:
      "Класическа машина за средно натоварен обект. Сервизните ръководства са широко достъпни, а частите се намират лесно.",
    spec: {
      userInterface: "Бутони",
      voltage: "230 V",
    },
    recommendation: {
      venueTypes: ["office", "manufacturing", "car-service", "warehouse"],
      minHeadcount: 20,
      maxHeadcount: 70,
      dailyCapacity: 100,
      shifts: [1, 2],
      products: ["coffee"],
    },
  },
  {
    id: "kikko-max",
    slug: "necta-kikko-max",
    photos: [
      {
        src: "/machines/necta-kikko-max/front.png",
        alt: "Кафе автомат Necta Kikko Max, изглед отпред",
        view: "front",
        credit: "Фабрично изображение на производителя",
      },
    ],
    name: "Necta Kikko Max",
    manufacturer: "necta",
    category: "coffee",
    currentName: null,
    specSource: "Necta Kikko Max technical manual (архив), N&W каталог",
    intro:
      "По-голямата Kikko. Еднаква на височина със Snakky Max и Sfera, така че застава до тях без разлика в силуета.",
    spec: {
      userInterface: "Бутони",
      heightMm: 1830,
      voltage: "230 V",
    },
    recommendation: {
      venueTypes: ["office", "manufacturing", "warehouse", "logistics"],
      minHeadcount: 40,
      maxHeadcount: 120,
      dailyCapacity: 160,
      shifts: [1, 2, 3],
      products: ["coffee"],
    },
  },

  /* -- full size ---------------------------------------------------------- */
  {
    id: "concerto",
    slug: "necta-concerto",
    photos: [
      {
        src: "/machines/necta-concerto/front.png",
        alt: "Кафе автомат Necta Concerto, изглед отпред",
        view: "front",
        credit: "Фабрично изображение на производителя",
      },
    ],
    name: "Necta Concerto",
    manufacturer: "necta",
    category: "coffee",
    currentName: "Barista 500",
    specSource: "Дилърски спецификации (Vais Vending, Eurocoffee)",
    intro:
      "Една от най-разпространените машини в България. Части и сервиз се намират навсякъде.",
    spec: {
      userInterface: "Бутони",
      heightMm: 1700,
      widthMm: 600,
      depthMm: 740,
      weightKg: 125,
      voltage: "230 V",
      maxPowerW: 1850,
    },
    recommendation: {
      venueTypes: ["office", "business-centre", "manufacturing", "hotel"],
      minHeadcount: 40,
      maxHeadcount: 120,
      dailyCapacity: 160,
      shifts: [1, 2],
      products: ["coffee"],
    },
  },
  {
    id: "concerto-touch",
    slug: "necta-concerto-touch",
    photos: [
      {
        src: "/machines/necta-concerto-touch/front.png",
        alt: "Кафе автомат Necta Concerto Touch, изглед отпред",
        view: "front",
        credit: "Фабрично изображение на производителя",
      },
    ],
    name: "Necta Concerto Touch",
    manufacturer: "necta",
    category: "coffee",
    currentName: "Barista 500 Touch",
    specSource: "Вариант на Concerto - общ корпус, тъч интерфейс",
    intro: "Concerto с тъч дисплей. Същият корпус, по-съвременно управление.",
    spec: {
      userInterface: "Тъч дисплей",
      heightMm: 1700,
      widthMm: 600,
      depthMm: 740,
      weightKg: 125,
      voltage: "230 V",
      maxPowerW: 1850,
    },
    recommendation: {
      venueTypes: ["office", "business-centre", "hotel", "hospital"],
      minHeadcount: 40,
      maxHeadcount: 120,
      dailyCapacity: 160,
      shifts: [1, 2],
      products: ["coffee"],
    },
  },
  {
    id: "canto",
    slug: "necta-canto",
    photos: [
      {
        src: "/machines/necta-canto/front.png",
        alt: "Кафе автомат Necta Canto, изглед отпред",
        view: "front",
        credit: "Фабрично изображение на производителя",
      },
    ],
    name: "Necta Canto",
    manufacturer: "necta",
    category: "coffee",
    currentName: null,
    specSource: "Дилърски спецификации (Vais Vending), N&W каталог",
    intro:
      "Голяма машина за интензивно натоварени обекти, с висок капацитет на контейнерите.",
    spec: {
      userInterface: "Бутони",
      heightMm: 1830,
      widthMm: 650,
      depthMm: 760,
      weightKg: 170,
      voltage: "230 V",
      maxPowerW: 2500,
    },
    recommendation: {
      venueTypes: ["manufacturing", "warehouse", "logistics", "hospital", "school"],
      minHeadcount: 80,
      maxHeadcount: 250,
      dailyCapacity: 300,
      shifts: [2, 3],
      products: ["coffee"],
    },
  },
  {
    id: "canto-touch",
    slug: "necta-canto-touch",
    photos: [
      {
        src: "/machines/necta-canto-touch/front.png",
        alt: "Кафе автомат Necta Canto Touch, изглед отпред",
        view: "front",
        credit: "Фабрично изображение на производителя",
      },
    ],
    name: "Necta Canto Touch",
    manufacturer: "necta",
    category: "coffee",
    currentName: null,
    specSource: "Вариант на Canto - общ корпус, тъч интерфейс",
    intro: "Canto с тъч дисплей.",
    spec: {
      userInterface: "Тъч дисплей",
      heightMm: 1830,
      widthMm: 650,
      depthMm: 760,
      weightKg: 170,
      voltage: "230 V",
      maxPowerW: 2500,
    },
    recommendation: {
      venueTypes: ["business-centre", "manufacturing", "hospital", "hotel"],
      minHeadcount: 80,
      maxHeadcount: 250,
      dailyCapacity: 300,
      shifts: [2, 3],
      products: ["coffee"],
    },
  },
  {
    id: "astro",
    slug: "necta-astro",
    photos: [
      {
        src: "/machines/necta-astro/front.png",
        alt: "Кафе автомат Necta Astro, изглед отпред",
        view: "front",
        credit: "Фабрично изображение на производителя",
      },
    ],
    name: "Necta Astro",
    manufacturer: "necta",
    category: "coffee",
    currentName: null,
    specSource: "Дилърски спецификации (Baristo, Vais Vending)",
    intro:
      "Висок капацитет: седем контейнера и 650 чаши между зарежданията. За обекти с постоянен поток.",
    spec: {
      userInterface: "18 бутона",
      numberOfSelections: 18,
      heightMm: 1830,
      widthMm: 850,
      depthMm: 742,
      weightKg: 140,
      voltage: "230 V",
      maxPowerW: 1800,
      productCapacity: 650,
    },
    recommendation: {
      venueTypes: ["manufacturing", "warehouse", "logistics", "hospital"],
      minHeadcount: 100,
      maxHeadcount: 300,
      dailyCapacity: 350,
      shifts: [2, 3],
      products: ["coffee"],
    },
  },
  {
    id: "opera",
    slug: "necta-opera",
    photos: [
      {
        src: "/machines/necta-opera/front.png",
        alt: "Кафе автомат Necta Opera, изглед отпред",
        view: "front",
        credit: "Фабрично изображение на производителя",
      },
    ],
    name: "Necta Opera",
    manufacturer: "necta",
    category: "coffee",
    currentName: "Barista 600",
    specSource: "Дилърски спецификации (VendTrade)",
    intro:
      "Машина от висок клас с широка гама напитки. Днес се предлага като Barista 600.",
    spec: {
      userInterface: "Бутони",
      heightMm: 1830,
      voltage: "230 V",
    },
    recommendation: {
      venueTypes: ["business-centre", "hotel", "manufacturing", "hospital"],
      minHeadcount: 80,
      maxHeadcount: 250,
      dailyCapacity: 300,
      shifts: [2, 3],
      products: ["coffee"],
    },
  },
  {
    id: "opera-touch",
    slug: "necta-opera-touch",
    photos: [
      {
        src: "/machines/necta-opera-touch/front.png",
        alt: "Кафе автомат Necta Opera Touch, изглед отпред",
        view: "front",
        credit: "Фабрично изображение на производителя",
      },
      {
        src: "/machines/necta-opera-touch/side.png",
        alt: "Кафе автомат Necta Opera Touch, изглед отстрани",
        view: "side",
        credit: "Фабрично изображение на производителя",
      },
    ],
    name: "Necta Opera Touch",
    manufacturer: "necta",
    category: "coffee",
    currentName: "Barista 600 Touch",
    specSource: "Вариант на Opera - общ корпус, тъч интерфейс",
    intro: "Opera с тъч дисплей и възможност за показване на съдържание.",
    spec: {
      userInterface: "Тъч дисплей",
      heightMm: 1830,
      voltage: "230 V",
    },
    recommendation: {
      venueTypes: ["business-centre", "hotel", "hospital"],
      minHeadcount: 80,
      maxHeadcount: 250,
      dailyCapacity: 300,
      shifts: [2, 3],
      products: ["coffee"],
    },
  },
  {
    id: "maestro-touch",
    slug: "necta-maestro-touch",
    photos: [
      {
        src: "/machines/necta-maestro-touch/front.png",
        alt: "Кафе автомат Necta Maestro Touch, изглед отпред",
        view: "front",
        credit: "Фабрично изображение на производителя",
      },
    ],
    name: "Necta Maestro Touch",
    manufacturer: "necta",
    category: "coffee",
    currentName: null,
    specSource: null,
    intro:
      "Топ моделът в гамата, с тъч интерфейс и най-широка гама напитки.",
    spec: {
      userInterface: "Тъч дисплей",
      voltage: "230 V",
    },
    recommendation: {
      venueTypes: ["business-centre", "hotel", "hospital"],
      minHeadcount: 100,
      maxHeadcount: 300,
      dailyCapacity: 350,
      shifts: [2, 3],
      products: ["coffee"],
    },
  },
];
