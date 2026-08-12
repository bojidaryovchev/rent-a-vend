import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { eq } from "drizzle-orm";
import { z } from "@/lib/zod";
import { TERMS, type Term } from "@/engine/rates";
import {
  modelSettingsRecordSchema,
  type ModelSettingsRecord,
} from "@/engine/catalogue";
import { getDb } from "./db";
import { modelSettings } from "./db/schema";

/**
 * Per-machine settings storage.
 *
 * The same two-implementations-behind-one-interface shape as `enquiry-store.ts`,
 * and for the same reason: the whole flow has to run end to end without
 * credentials, so a missing DATABASE_URL falls back to a JSON file rather than
 * to an error. The file store is development only - a serverless filesystem is
 * ephemeral - which is what `settingsHealth()` says out loud in the panel.
 *
 * READ FAILURES ARE NOT FATAL, and that is the important difference from the
 * enquiry store. Enquiries are written on the request path and losing one is the
 * worst thing this site can do; settings are read during a BUILD, on ~60 pages,
 * and a database that blinks mid-deploy must not turn into a failed deploy. So
 * `list()` throws and every caller in `engine/rates.ts` catches, falling back to
 * the derived placeholder - the site renders, the banner stays up, nobody is
 * shown a wrong number.
 */

const TERM_COLUMN = {
  12: "monthly12",
  24: "monthly24",
  36: "monthly36",
  48: "monthly48",
  60: "monthly60",
} as const satisfies Record<Term, keyof typeof modelSettings.$inferSelect>;

/**
 * A price of 0 is rejected rather than stored.
 *
 * "Free" is not a rent, it is a data-entry accident, and it would render as
 * "от 0 €/месец" across the home page, the category grid and the JSON-LD offer.
 * The upper bound is equally arbitrary and equally load-bearing: it catches the
 * stray zero that turns €95 into €950 before it reaches a customer.
 */
const priceSchema = z.number().int().min(1).max(100_000).nullable();

/** What a save carries. Absent terms are cleared, not left alone: the admin
 *  form always submits all five, so a missing one means "emptied". */
export interface ModelSettingsInput {
  monthly: Partial<Record<Term, number | null>>;
  published: boolean;
  sortOrder: number;
}

export interface ModelSettingsStore {
  readonly kind: "postgres" | "file";
  list(): Promise<ModelSettingsRecord[]>;
  save(modelId: string, input: ModelSettingsInput): Promise<void>;
  /** Returns the machine to the derived placeholder. Deleting the row rather
   *  than blanking it keeps "never priced" and "priced then cleared"
   *  indistinguishable, which is what the readiness count wants to know. */
  remove(modelId: string): Promise<void>;
}

/* -- file store (development) --------------------------------------------- */

const FILE = join(process.cwd(), ".data", "model-settings.json");

class FileModelSettingsStore implements ModelSettingsStore {
  readonly kind = "file" as const;

  private async readAll(): Promise<ModelSettingsRecord[]> {
    try {
      const raw = await readFile(FILE, "utf8");
      return z.array(modelSettingsRecordSchema).parse(JSON.parse(raw));
    } catch {
      return [];
    }
  }

  async list() {
    return this.readAll();
  }

  async save(modelId: string, input: ModelSettingsInput) {
    const monthly: Record<string, number> = {};
    for (const term of TERMS) {
      const value = input.monthly[term];
      if (typeof value === "number") monthly[String(term)] = value;
    }

    const record: ModelSettingsRecord = {
      modelId,
      monthly,
      published: input.published,
      sortOrder: input.sortOrder,
      updatedAt: new Date().toISOString(),
    };

    const all = await this.readAll();
    const without = all.filter((r) => r.modelId !== modelId);
    await this.writeAll([...without, record]);
  }

  async remove(modelId: string) {
    const all = await this.readAll();
    await this.writeAll(all.filter((r) => r.modelId !== modelId));
  }

  private async writeAll(records: ModelSettingsRecord[]): Promise<void> {
    await mkdir(dirname(FILE), { recursive: true });
    await writeFile(FILE, JSON.stringify(records, null, 2), "utf8");
  }
}

/* -- postgres store (production) ------------------------------------------ */

class PostgresModelSettingsStore implements ModelSettingsStore {
  readonly kind = "postgres" as const;

  async list(): Promise<ModelSettingsRecord[]> {
    const rows = await getDb().select().from(modelSettings);
    return rows.map(toRecord);
  }

  /**
   * Upsert, because the admin does not create rows - it edits machines, and a
   * machine that has never been priced has no row yet. `onConflictDoUpdate` on
   * the primary key makes "first save" and "tenth save" the same statement.
   */
  async save(modelId: string, input: ModelSettingsInput) {
    const values = {
      modelId,
      monthly12: input.monthly[12] ?? null,
      monthly24: input.monthly[24] ?? null,
      monthly36: input.monthly[36] ?? null,
      monthly48: input.monthly[48] ?? null,
      monthly60: input.monthly[60] ?? null,
      published: input.published,
      sortOrder: input.sortOrder,
      updatedAt: new Date(),
    };

    await getDb()
      .insert(modelSettings)
      .values(values)
      .onConflictDoUpdate({ target: modelSettings.modelId, set: values });
  }

  async remove(modelId: string) {
    await getDb().delete(modelSettings).where(eq(modelSettings.modelId, modelId));
  }
}

function toRecord(row: typeof modelSettings.$inferSelect): ModelSettingsRecord {
  const monthly: Record<string, number> = {};
  for (const term of TERMS) {
    const value = row[TERM_COLUMN[term]];
    if (typeof value === "number" && value > 0) monthly[String(term)] = value;
  }

  return modelSettingsRecordSchema.parse({
    modelId: row.modelId,
    monthly,
    published: row.published,
    sortOrder: row.sortOrder,
    updatedAt: row.updatedAt.toISOString(),
  });
}

let store: ModelSettingsStore | null = null;

export function getModelSettingsStore(): ModelSettingsStore {
  if (!store) {
    store = process.env.DATABASE_URL
      ? new PostgresModelSettingsStore()
      : new FileModelSettingsStore();
  }
  return store;
}

/** Validates one submitted price field. Returns `null` for an empty field,
 *  which is a deliberate "unprice this term", and throws on nonsense. */
export function parsePrice(raw: FormDataEntryValue | null): number | null {
  const text = String(raw ?? "").trim();
  if (!text) return null;

  /* Commas, because a Bulgarian keyboard and a Bulgarian locale both produce
     them, and "87,5" silently becoming NaN would clear a price the client
     believed they had just set. */
  const value = Number(text.replace(",", "."));
  if (!Number.isFinite(value)) {
    throw new Error("Цената не е число.");
  }

  const parsed = priceSchema.safeParse(Math.round(value));
  if (!parsed.success) {
    throw new Error("Цената трябва да е между 1 и 100 000 €.");
  }
  return parsed.data;
}

export async function settingsHealth(): Promise<{
  ok: boolean;
  message: string;
}> {
  if (!process.env.DATABASE_URL) {
    return {
      ok: false,
      message:
        "Няма DATABASE_URL. Цените се пишат в локален файл - подходящо само за разработка. " +
        "На хостинг без постоянен диск промените ще се губят.",
    };
  }

  try {
    await getDb().select({ id: modelSettings.modelId }).from(modelSettings).limit(1);
    return { ok: true, message: "Цените се записват в Postgres (Neon)." };
  } catch (err) {
    console.error("Проверката на таблицата с цени се провали:", err);
    return {
      ok: false,
      message:
        "Базата не отговаря или таблицата model_settings липсва - изпълнете `npm run db:migrate`. " +
        "Докато това не е поправено, сайтът показва временните ставки.",
    };
  }
}
