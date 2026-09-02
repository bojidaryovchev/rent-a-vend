import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { desc, eq } from "drizzle-orm";
import { z } from "@/lib/zod";
import { getDb } from "./db";
import {
  ENQUIRY_SOURCES,
  ENQUIRY_STATUSES,
  enquiries,
  type EnquiryStatus,
} from "./db/schema";

/**
 * Enquiry storage.
 *
 * The database row is the source of truth and the email is a notification, not
 * the other way round. Losing a lead to a bounced SMTP is the worst failure
 * this site can have, and it is the one most likely to go unnoticed.
 *
 * Two implementations behind one interface: Neon Postgres through Drizzle when
 * DATABASE_URL is set, and a local JSON file otherwise so the whole flow runs
 * end to end without credentials. The file store is for development only -
 * serverless filesystems are ephemeral and it will silently lose data in
 * production, which is why `storageHealth()` says so out loud.
 *
 * The table shape lives in `db/schema.ts`, which is also what the migrations
 * are generated from. Re-exported here so nothing downstream has to know.
 */

export { ENQUIRY_STATUSES, ENQUIRY_SOURCES };
export type { EnquiryStatus, EnquirySource } from "./db/schema";

export const STATUS_LABEL_BG: Record<EnquiryStatus, string> = {
  new: "Ново",
  "in-progress": "В процес",
  quoted: "Изпратена оферта",
  won: "Спечелено",
  lost: "Загубено",
};

export const enquiryRecordSchema = z.object({
  id: z.string(),
  createdAt: z.string(),

  name: z.string(),
  email: z.string(),
  phone: z.string(),
  company: z.string(),
  vatNumber: z.string().nullable(),
  message: z.string().nullable(),

  /** What the visitor was looking at. Carried, never re-asked. */
  modelSlug: z.string().nullable(),
  term: z.number().nullable(),
  source: z.enum(ENQUIRY_SOURCES),
  recommenderSummary: z.string().nullable(),

  status: z.enum(ENQUIRY_STATUSES),
  notes: z.string().nullable(),
});

export type EnquiryRecord = z.infer<typeof enquiryRecordSchema>;
export type NewEnquiry = Omit<EnquiryRecord, "id" | "createdAt" | "status" | "notes">;

export interface EnquiryStore {
  readonly kind: "postgres" | "file";
  save(enquiry: NewEnquiry, id: string, createdAt: string): Promise<EnquiryRecord>;
  list(): Promise<EnquiryRecord[]>;
  setStatus(id: string, status: EnquiryStatus): Promise<void>;
  setNotes(id: string, notes: string): Promise<void>;
}

/* -- file store (development) -------------------------------------------- */

const FILE = join(process.cwd(), ".data", "enquiries.json");

class FileEnquiryStore implements EnquiryStore {
  readonly kind = "file" as const;

  private async readAll(): Promise<EnquiryRecord[]> {
    try {
      const raw = await readFile(FILE, "utf8");
      return z.array(enquiryRecordSchema).parse(JSON.parse(raw));
    } catch {
      return [];
    }
  }

  private async writeAll(records: EnquiryRecord[]): Promise<void> {
    await mkdir(dirname(FILE), { recursive: true });
    await writeFile(FILE, JSON.stringify(records, null, 2), "utf8");
  }

  async save(enquiry: NewEnquiry, id: string, createdAt: string) {
    const record: EnquiryRecord = {
      ...enquiry,
      id,
      createdAt,
      status: "new",
      notes: null,
    };
    const all = await this.readAll();
    await this.writeAll([record, ...all]);
    return record;
  }

  async list() {
    return this.readAll();
  }

  async setStatus(id: string, status: EnquiryStatus) {
    const all = await this.readAll();
    await this.writeAll(all.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  async setNotes(id: string, notes: string) {
    const all = await this.readAll();
    await this.writeAll(all.map((r) => (r.id === id ? { ...r, notes } : r)));
  }
}

/* -- postgres store (production) ------------------------------------------ */

class PostgresEnquiryStore implements EnquiryStore {
  readonly kind = "postgres" as const;

  async save(enquiry: NewEnquiry, id: string, createdAt: string) {
    const [row] = await getDb()
      .insert(enquiries)
      .values({ ...enquiry, id, createdAt: new Date(createdAt), status: "new" })
      .returning();
    return toRecord(row);
  }

  async list(): Promise<EnquiryRecord[]> {
    const rows = await getDb()
      .select()
      .from(enquiries)
      .orderBy(desc(enquiries.createdAt));
    return rows.map(toRecord);
  }

  async setStatus(id: string, status: EnquiryStatus) {
    await getDb().update(enquiries).set({ status }).where(eq(enquiries.id, id));
  }

  async setNotes(id: string, notes: string) {
    await getDb().update(enquiries).set({ notes }).where(eq(enquiries.id, id));
  }
}

/**
 * Row to record.
 *
 * The column names already match the record field for field, so the only real
 * work is the timestamp: Postgres hands back a `Date` and the rest of the app
 * passes ISO strings around. Still parsed rather than cast, because `status`
 * and `source` are plain text columns - the closed set is enforced in
 * TypeScript, and this is where a hand-edited row would otherwise slip through.
 */
function toRecord(row: typeof enquiries.$inferSelect): EnquiryRecord {
  return enquiryRecordSchema.parse({
    ...row,
    createdAt: row.createdAt.toISOString(),
  });
}

let store: EnquiryStore | null = null;

export function getEnquiryStore(): EnquiryStore {
  if (!store) {
    if (process.env.DATABASE_URL) {
      store = new PostgresEnquiryStore();
    } else {
      /* The file store is right on a laptop and catastrophic on a serverless
         host: the write succeeds, the visitor is thanked, and the filesystem is
         discarded when the instance goes. It looks like nothing is wrong, which
         is why this shouts. `VERCEL` is set on every Vercel runtime. */
      if (process.env.VERCEL) {
        console.error(
          "DATABASE_URL is not set on a serverless host. Enquiries are being " +
            "written to an ephemeral filesystem and WILL be lost. The " +
            "notification email is currently the only copy.",
        );
      }
      store = new FileEnquiryStore();
    }
  }
  return store;
}

/**
 * Surfaced in the readiness report and the admin panel.
 *
 * The Postgres path actually touches the table rather than trusting that a
 * connection string implies a database. Nothing issues DDL at runtime any more,
 * so a Neon branch on which `db:migrate` never ran looks perfectly configured
 * and fails on the first enquiry - which is the one failure this site cannot
 * afford to discover from a customer. One cheap query on an admin page that is
 * already dynamic is a fair price for turning that into a banner.
 */
export async function storageHealth(): Promise<{
  ok: boolean;
  message: string;
}> {
  if (!process.env.DATABASE_URL) {
    return {
      ok: false,
      message:
        "Няма DATABASE_URL. Запитванията се пишат в локален файл - подходящо само за разработка. " +
        "На хостинг без постоянен диск данните ще се губят.",
    };
  }

  try {
    await getDb().select({ id: enquiries.id }).from(enquiries).limit(1);
    return { ok: true, message: "Запитванията се записват в Postgres (Neon)." };
  } catch (err) {
    console.error("Проверката на хранилището се провали:", err);
    return {
      ok: false,
      message:
        "Базата не отговаря или таблицата enquiries липсва - изпълнете `npm run db:migrate`. " +
        "Докато това не е поправено, новите запитвания НЕ се записват.",
    };
  }
}
