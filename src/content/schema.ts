import { z } from "@/lib/zod";
import { CATEGORIES, PHOTO_VIEWS, PRODUCT_KINDS, VENUE_TYPES } from "./taxonomy";

/**
 * Content schemas.
 *
 * Two record types, deliberately separate: a manufacturer describes a MODEL,
 * the business rents a UNIT. Conflating them is the standard failure in used
 * equipment, and it is what makes "this exact machine, this year, this price"
 * possible at all.
 *
 * Every spec field is nullable. These are mostly discontinued machines and the
 * manufacturers have withdrawn their pages; a genuine gap renders as
 * "няма данни" rather than being guessed at.
 */

export const specSchema = z.object({
  userInterface: z.string().nullable().default(null),
  numberOfSelections: z.number().int().positive().nullable().default(null),
  /** Payment protocol. Decides which card terminals physically fit. */
  protocol: z.string().nullable().default(null),

  heightMm: z.number().int().positive().nullable().default(null),
  widthMm: z.number().int().positive().nullable().default(null),
  depthMm: z.number().int().positive().nullable().default(null),
  /** Depth with the door open. Decides whether it fits a corridor. */
  depthOpenMm: z.number().int().positive().nullable().default(null),
  weightKg: z.number().positive().nullable().default(null),

  voltage: z.string().nullable().default(null),
  maxPowerW: z.number().int().positive().nullable().default(null),
  frequencyHz: z.number().int().positive().nullable().default(null),

  configuration: z.string().nullable().default(null),
  numTrays: z.number().int().positive().nullable().default(null),
  elevator: z.string().nullable().default(null),
  dispensingSystem: z.string().nullable().default(null),
  temperature: z.string().nullable().default(null),
  productCapacity: z.number().int().positive().nullable().default(null),
});

export type Spec = z.infer<typeof specSchema>;

/** Sanity checks. Manufacturer data is not always right - FAS publishes a
 *  door-open depth equal to the machine's height, which is impossible. */
export const validatedSpecSchema = specSchema.superRefine((spec, ctx) => {
  if (spec.depthOpenMm && spec.depthMm && spec.depthOpenMm <= spec.depthMm) {
    ctx.addIssue({
      code: "custom",
      path: ["depthOpenMm"],
      message: "Дълбочината при отворена врата трябва да е по-голяма от затворената.",
    });
  }
  if (spec.heightMm && spec.depthOpenMm && spec.depthOpenMm === spec.heightMm) {
    ctx.addIssue({
      code: "custom",
      path: ["depthOpenMm"],
      message: "Дълбочината при отворена врата съвпада с височината - вероятна грешка в източника.",
    });
  }
});

export const recommendationSchema = z.object({
  venueTypes: z.array(z.enum(VENUE_TYPES)).default([]),
  minHeadcount: z.number().int().nonnegative().nullable().default(null),
  maxHeadcount: z.number().int().positive().nullable().default(null),
  /** Drinks or items per working day the machine comfortably serves. */
  dailyCapacity: z.number().int().positive().nullable().default(null),
  shifts: z
    .array(z.union([z.literal(1), z.literal(2), z.literal(3)]))
    .default([]),
  products: z.array(z.enum(PRODUCT_KINDS)).default([]),
  /** True while these values are our defaults rather than the client's data. */
  isDefault: z.boolean().default(true),
});

/**
 * One photograph of a model.
 *
 * Deliberately thin: a path, an alt text and which view it is. No width or
 * height, because the gallery renders every frame with `fill` inside a sized
 * bed - so landing a real set is dropping files into `public/machines/<slug>/`
 * and adding one line each, with no measuring and no code change.
 *
 * `credit` exists to keep D25 enforceable. Our own warehouse photography leaves
 * it null; anything else has to say where it came from, which makes a factory
 * render impossible to slip in unnoticed.
 */
export const photoSchema = z.object({
  src: z
    .string()
    .regex(
      /^\/machines\/[a-z0-9-]+\/[a-z0-9-]+\.(jpg|jpeg|png|webp|avif)$/,
      "Пътят трябва да е /machines/<slug>/<изглед>.<jpg|jpeg|png|webp|avif>.",
    ),
  /** Required and non-empty: a decorative vending machine photo does not exist. */
  alt: z.string().min(1),
  view: z.enum(PHOTO_VIEWS),
  credit: z.string().nullable().default(null),
});

export type Photo = z.infer<typeof photoSchema>;

/** What an editor actually writes in a model file. `credit` is omitted for our
 *  own photography and defaults to null, so landing a set stays one line per
 *  frame rather than one line plus a field nobody needs. */
export type PhotoInput = z.input<typeof photoSchema>;

export const modelSchema = z.object({
  id: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Латиница, малки букви и тирета."),
  name: z.string().min(1),
  manufacturer: z.enum(["necta", "fas", "crane", "vendo"]),
  category: z.enum(CATEGORIES),

  /** Necta renamed its whole range. Buyers search the old names, and the stock
   *  is the old machines, so the legacy name leads and the current one clarifies. */
  currentName: z.string().nullable().default(null),

  /**
   * The catalogued coffee machine forming the top half of a combination
   * machine.
   *
   * A combo is ONE cabinet, not two machines side by side: a Brio sits on a
   * Mini Snakky snack base and is bought, delivered and installed as a single
   * unit. The coffee half is a machine we also catalogue on its own, so it is
   * named here and the combo's dimensions are stacked onto the base rather than
   * entered by hand. The base cabinet is not sold separately and has no record
   * of its own; its figures live beside the pairings in `models/combos.ts`.
   */
  coffeeUnit: z.string().nullable().default(null),

  /**
   * The model this one shares a cabinet with, where the difference is internal -
   * a lift, CO2 cooling, a food configuration. Such a variant may show the base
   * model's photograph, captioned as the shared cabinet, because it genuinely is
   * the same object from the outside.
   *
   * Not for variants whose front differs. A Touch model has a screen where the
   * base has buttons, so it gets its own frame or none.
   */
  cabinetOf: z.string().nullable().default(null),

  spec: specSchema.default(specSchema.parse({})),
  recommendation: recommendationSchema.default(recommendationSchema.parse({})),

  /** Empty until the warehouse shoot lands; the catalogue falls back to the
   *  dimensioned drawing rather than to a stock photograph. */
  photos: z.array(photoSchema).default([]),

  /** Where the spec figures came from, so a future editor can re-check them. */
  specSource: z.string().nullable().default(null),

  intro: z.string().nullable().default(null),
});

export type Model = z.infer<typeof modelSchema>;

/**
 * There is no UNIT record any more (D50).
 *
 * The separation of MODEL from UNIT was the point of this file: a manufacturer
 * describes a model, the business rents an individual machine. The client does
 * not track individual machines for the site and states that every catalogued
 * model can be supplied, so a unit record would have had one honest field left
 * on it - the model it is a copy of. The catalogue is models only.
 */
export const modelsSchema = z.array(modelSchema);
