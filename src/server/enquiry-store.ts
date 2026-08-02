import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { z } from "zod";

/**
 * Enquiry storage.
 *
 * The database row is the source of truth and the email is a notification, not
 * the other way round. Losing a lead to a bounced SMTP is the worst failure
 * this site can have, and it is the one most likely to go unnoticed.
 *
 * Two implementations behind one interface: Postgres when DATABASE_URL is set,
 * and a local JSON file otherwise so the whole flow runs end to end without
 * credentials. The file store is for development only - serverless filesystems
 * are ephemeral and it will silently lose data in production, which is why
 * `storageHealth()` says so out loud.
 */

export const ENQUIRY_STATUSES = [
  "new",
  "in-progress",
  "quoted",
  "won",
  "lost",
] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

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
  unitRef: z.string().nullable(),
  term: z.number().nullable(),
  source: z.enum(["model", "calculator", "recommender", "contact", "direct"]),
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private sqlPromise: Promise<any> | null = null;

  private async sql() {
    if (!this.sqlPromise) {
      this.sqlPromise = import("postgres").then(({ default: postgres }) => {
        const client = postgres(process.env.DATABASE_URL!, { max: 3 });
        return client`
          create table if not exists enquiries (
            id text primary key,
            created_at timestamptz not null,
            name text not null,
            email text not null,
            phone text not null,
            company text not null,
            vat_number text,
            message text,
            model_slug text,
            unit_ref text,
            term integer,
            source text not null,
            recommender_summary text,
            status text not null default 'new',
            notes text
          )
        `.then(() => client);
      });
    }
    return this.sqlPromise;
  }

  async save(enquiry: NewEnquiry, id: string, createdAt: string) {
    const sql = await this.sql();
    await sql`
      insert into enquiries (
        id, created_at, name, email, phone, company, vat_number, message,
        model_slug, unit_ref, term, source, recommender_summary, status
      ) values (
        ${id}, ${createdAt}, ${enquiry.name}, ${enquiry.email}, ${enquiry.phone},
        ${enquiry.company}, ${enquiry.vatNumber}, ${enquiry.message},
        ${enquiry.modelSlug}, ${enquiry.unitRef}, ${enquiry.term},
        ${enquiry.source}, ${enquiry.recommenderSummary}, 'new'
      )
    `;
    return { ...enquiry, id, createdAt, status: "new" as const, notes: null };
  }

  async list(): Promise<EnquiryRecord[]> {
    const sql = await this.sql();
    const rows = await sql`select * from enquiries order by created_at desc`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return rows.map((r: any) =>
      enquiryRecordSchema.parse({
        id: r.id,
        createdAt: new Date(r.created_at).toISOString(),
        name: r.name,
        email: r.email,
        phone: r.phone,
        company: r.company,
        vatNumber: r.vat_number,
        message: r.message,
        modelSlug: r.model_slug,
        unitRef: r.unit_ref,
        term: r.term,
        source: r.source,
        recommenderSummary: r.recommender_summary,
        status: r.status,
        notes: r.notes,
      }),
    );
  }

  async setStatus(id: string, status: EnquiryStatus) {
    const sql = await this.sql();
    await sql`update enquiries set status = ${status} where id = ${id}`;
  }

  async setNotes(id: string, notes: string) {
    const sql = await this.sql();
    await sql`update enquiries set notes = ${notes} where id = ${id}`;
  }
}

let store: EnquiryStore | null = null;

export function getEnquiryStore(): EnquiryStore {
  if (!store) {
    store = process.env.DATABASE_URL
      ? new PostgresEnquiryStore()
      : new FileEnquiryStore();
  }
  return store;
}

/** Surfaced in the readiness report and the admin panel. */
export function storageHealth(): { ok: boolean; message: string } {
  if (process.env.DATABASE_URL) {
    return { ok: true, message: "Запитванията се записват в Postgres." };
  }
  return {
    ok: false,
    message:
      "Няма DATABASE_URL. Запитванията се пишат в локален файл - подходящо само за разработка. " +
      "На хостинг без постоянен диск данните ще се губят.",
  };
}
