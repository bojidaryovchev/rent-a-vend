import type { Model, PhotoInput } from "../schema";

/**
 * Combination machines.
 *
 * A combo is a pair of catalogued machines standing side by side, not a third
 * product. So the pairing is declared here and the dimensions, weight, power
 * and capacity are COMPUTED from the two constituents in `index.ts`.
 *
 * Two reasons. The 15 combos need no separate spec research, and the figures
 * can never drift out of step with the machines they are made of.
 */

type ComboDraft = Omit<Model, "spec" | "recommendation" | "photos" | "cabinetOf"> & {
  /** Set only where a variant differs from its base model behind the panel. */
  cabinetOf?: string | null;
} & {
  recommendation?: Partial<Model["recommendation"]>;
  /** Combos borrow their constituents' frames until shot in their own right. */
  photos?: PhotoInput[];
};

interface Pairing {
  left: string;
  right: string;
  slug: string;
  name: string;
  venueTypes: Model["recommendation"]["venueTypes"];
  minHeadcount: number;
  maxHeadcount: number;
  shifts: Model["recommendation"]["shifts"];
}

const PAIRINGS: Pairing[] = [
  {
    left: "brio-3", right: "snakky",
    slug: "necta-brio-3-snakky", name: "Necta Brio 3 + Snakky",
    venueTypes: ["office", "car-service", "car-wash", "gym"],
    minHeadcount: 20, maxHeadcount: 70, shifts: [1, 2],
  },
  {
    left: "brio-up", right: "snakky",
    slug: "necta-brio-up-snakky", name: "Necta Brio Up + Snakky",
    venueTypes: ["office", "car-service", "car-wash", "gym"],
    minHeadcount: 20, maxHeadcount: 70, shifts: [1, 2],
  },
  {
    left: "brio-up", right: "snakky-max",
    slug: "necta-brio-up-snakky-max", name: "Necta Brio Up + Snakky Max",
    venueTypes: ["office", "manufacturing", "warehouse"],
    minHeadcount: 40, maxHeadcount: 120, shifts: [1, 2],
  },
  {
    left: "brio-3", right: "sfera",
    slug: "necta-brio-sfera", name: "Necta Brio + Sfera",
    venueTypes: ["manufacturing", "school", "retail", "logistics"],
    minHeadcount: 80, maxHeadcount: 250, shifts: [2, 3],
  },
  {
    left: "kikko", right: "snakky",
    slug: "necta-kikko-snakky", name: "Necta Kikko + Snakky",
    venueTypes: ["office", "manufacturing", "car-service"],
    minHeadcount: 30, maxHeadcount: 90, shifts: [1, 2],
  },
  {
    left: "kikko-max", right: "snakky-max",
    slug: "necta-kikko-max-snakky-max", name: "Necta Kikko Max + Snakky Max",
    venueTypes: ["manufacturing", "warehouse", "logistics", "school"],
    minHeadcount: 70, maxHeadcount: 200, shifts: [2, 3],
  },
  {
    left: "solista", right: "melodia",
    slug: "necta-solista-melodia", name: "Necta Solista + Melodia",
    venueTypes: ["office", "retail", "gym"],
    minHeadcount: 20, maxHeadcount: 70, shifts: [1],
  },
  {
    left: "concerto", right: "melodia",
    slug: "necta-concerto-melodia", name: "Necta Concerto + Melodia",
    venueTypes: ["office", "business-centre", "hotel"],
    minHeadcount: 50, maxHeadcount: 150, shifts: [1, 2],
  },
  {
    left: "concerto-touch", right: "melodia",
    slug: "necta-concerto-touch-melodia", name: "Necta Concerto Touch + Melodia",
    venueTypes: ["office", "business-centre", "hotel"],
    minHeadcount: 50, maxHeadcount: 150, shifts: [1, 2],
  },
  {
    left: "concerto", right: "samba",
    slug: "necta-concerto-samba", name: "Necta Concerto + Samba",
    venueTypes: ["manufacturing", "warehouse", "hospital"],
    minHeadcount: 90, maxHeadcount: 260, shifts: [2, 3],
  },
  {
    left: "canto", right: "samba",
    slug: "necta-canto-samba", name: "Necta Canto + Samba",
    venueTypes: ["manufacturing", "warehouse", "logistics", "hospital"],
    minHeadcount: 120, maxHeadcount: 350, shifts: [2, 3],
  },
  {
    left: "canto", right: "tango",
    slug: "necta-canto-tango", name: "Necta Canto + Tango",
    venueTypes: ["manufacturing", "warehouse", "logistics", "school"],
    minHeadcount: 120, maxHeadcount: 350, shifts: [2, 3],
  },
  {
    left: "opera", right: "tango",
    slug: "necta-opera-tango", name: "Necta Opera + Tango",
    venueTypes: ["business-centre", "manufacturing", "hospital", "hotel"],
    minHeadcount: 120, maxHeadcount: 350, shifts: [2, 3],
  },
  {
    left: "opera-touch", right: "tango",
    slug: "necta-opera-touch-tango", name: "Necta Opera Touch + Tango",
    venueTypes: ["business-centre", "hospital", "hotel"],
    minHeadcount: 120, maxHeadcount: 350, shifts: [2, 3],
  },
  {
    left: "maestro-touch", right: "tango",
    slug: "necta-maestro-touch-tango", name: "Necta Maestro Touch + Tango",
    venueTypes: ["business-centre", "hotel", "hospital"],
    minHeadcount: 150, maxHeadcount: 400, shifts: [2, 3],
  },
];

export const combos: ComboDraft[] = PAIRINGS.map((p) => ({
  id: p.slug,
  slug: p.slug,
  name: p.name,
  manufacturer: "necta" as const,
  category: "combo" as const,
  currentName: null,
  comboOf: [p.left, p.right] as [string, string],
  specSource: "Изчислено от двете машини в комплекта",
  intro:
    "Комплект от две машини - топли напитки и снаксове - на едно място. Размерите и капацитетът по-долу са сборът на двете.",
  recommendation: {
    venueTypes: p.venueTypes,
    minHeadcount: p.minHeadcount,
    maxHeadcount: p.maxHeadcount,
    shifts: p.shifts,
    products: ["coffee", "snack", "cold"],
  },
}));
