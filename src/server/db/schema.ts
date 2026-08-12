import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * The database schema, and the single source of truth for it.
 *
 * Drizzle reads this file twice over: at runtime to build queries, and at
 * `db:generate` time to diff against the last migration. Nothing else may issue
 * DDL - a `create table if not exists` on the request path is a round trip per
 * cold start and, worse, quietly disagrees with the migrations the moment a
 * column is added.
 *
 * The two closed sets below are declared as `text ... { enum }` rather than a
 * Postgres enum type. The TypeScript narrowing is identical; the difference is
 * that adding a status later is a code change instead of an `alter type`, which
 * cannot run inside a transaction on older servers and is not reversible.
 */

export const ENQUIRY_STATUSES = [
  "new",
  "in-progress",
  "quoted",
  "won",
  "lost",
] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export const ENQUIRY_SOURCES = [
  "model",
  "calculator",
  "recommender",
  "contact",
  "direct",
] as const;
export type EnquirySource = (typeof ENQUIRY_SOURCES)[number];

export const enquiries = pgTable(
  "enquiries",
  {
    /** Short, human-quotable reference. Minted by the action, not the database:
        it is read aloud on the phone, so it has to exist before the insert. */
    id: text("id").primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),

    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    company: text("company").notNull(),
    vatNumber: text("vat_number"),
    message: text("message"),

    /** What the visitor was looking at. Carried, never re-asked. */
    modelSlug: text("model_slug"),
    term: integer("term"),
    source: text("source", { enum: ENQUIRY_SOURCES }).notNull(),
    recommenderSummary: text("recommender_summary"),

    status: text("status", { enum: ENQUIRY_STATUSES }).notNull().default("new"),
    notes: text("notes"),
  },
  (table) => [index("enquiries_created_at_idx").on(table.createdAt)],
);

/* -- what the admin controls about a catalogued machine -------------------- */

/**
 * The one row per machine that the client owns.
 *
 * D50 removed the unit records and left the published price as the site's last
 * remaining differentiator - which made it the one number that must be editable
 * without a deploy. This table is that edit surface, and nothing else about a
 * model lives here: specs, photos and copy stay in `src/content/models/`, where
 * they are validated at import, reviewed in a diff and covered by tests. A form
 * that can produce a half-filled machine page is the failure D50 recorded, so
 * the admin decides what a machine COSTS and whether it is SHOWN, never what it
 * is.
 *
 * FIVE COLUMNS, NOT FIVE ROWS. A `(model_id, term)` table would be the
 * normalised shape, and it would let a write land three terms from today beside
 * two from last month. The admin edits a whole machine at once, so a whole
 * machine is one row and a save is one statement. It also gives `published` and
 * `sort_order` somewhere sensible to live, which a per-term table does not.
 *
 * Every price column is NULLABLE and that is the mechanism, not an oversight: a
 * null term falls through to the derived placeholder in `engine/rates.ts` and
 * the machine keeps saying so on the page. Pricing the catalogue is therefore
 * incremental - ten real machines are ten real prices, not a launch blocker.
 *
 * Whole euros, deliberately. The rent formula already rounds to the nearest 5
 * because a catalogue should read like a price list, the client's own example
 * figures are whole, and integers keep every existing display path - JSON-LD
 * `price` included - working unchanged. Sub-euro rents would be a column
 * widening plus a formatter, not a redesign.
 */
export const modelSettings = pgTable("model_settings", {
  /** The catalogue model id, e.g. "canto-touch". Not a foreign key: the
      catalogue is a TypeScript module, so integrity is enforced on read by
      ignoring rows whose model no longer exists. */
  modelId: text("model_id").primaryKey(),

  monthly12: integer("monthly_12"),
  monthly24: integer("monthly_24"),
  monthly36: integer("monthly_36"),
  monthly48: integer("monthly_48"),
  monthly60: integer("monthly_60"),

  /** Whether the machine appears on its category page, the home grid, the
      recommender and the sitemap. Absent row means published - a catalogue
      that has never been touched still shows everything. */
  published: boolean("published").notNull().default(true),

  /** Position within its category. Lower first; ties fall back to catalogue
      order, so an untouched catalogue keeps the order it has today. */
  sortOrder: integer("sort_order").notNull().default(0),

  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

/* -- the info@ mailbox ----------------------------------------------------- */

/**
 * Mail to and from info@rent-a-vend.com, so it can be answered from the admin
 * panel and answered AS info@ - which a forward to Gmail can never do, because
 * a reply from Gmail leaves as the Gmail address.
 *
 * Two tables rather than one. A thread has state (has this been dealt with?)
 * and a message does not; hanging a status off every message and updating the
 * lot on each change is the shape you get when you refuse the second table.
 */
export const MAIL_DIRECTIONS = ["in", "out"] as const;
export type MailDirection = (typeof MAIL_DIRECTIONS)[number];

/** Two states, not five. Enquiries earn a pipeline because they are a sale in
 *  progress; a mailbox only needs to know what is still owed an answer. */
export const MAIL_THREAD_STATUSES = ["open", "done"] as const;
export type MailThreadStatus = (typeof MAIL_THREAD_STATUSES)[number];

/**
 * Attachment metadata. The bytes stay in Resend, which keeps them for sent and
 * received mail alike and hands out signed URLs on request - so storing them
 * again would be paying twice to be the second-freshest copy.
 *
 * No Resend id here on purpose. The download route asks Resend for the list
 * afresh and takes the nth entry, which works for a message we sent as well as
 * one we received, and cannot go stale the way a copied id can.
 */
export interface MailAttachment {
  filename: string;
  size: number;
  contentType: string;
}

export const mailThreads = pgTable(
  "mail_threads",
  {
    id: text("id").primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    /** Sorted on, so the list reads newest-activity-first without a subquery. */
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }).notNull(),

    subject: text("subject").notNull(),
    /** The other party. One thread is one correspondent: this inbox is a person
        answering suppliers and customers, not a shared mailing list. */
    correspondent: text("correspondent").notNull(),
    correspondentName: text("correspondent_name"),

    status: text("status", { enum: MAIL_THREAD_STATUSES })
      .notNull()
      .default("open"),
  },
  (table) => [
    index("mail_threads_last_message_at_idx").on(table.lastMessageAt),
    /* Matching an incoming message to an existing thread looks up exactly
       this pair when the References header gives us nothing to go on. */
    index("mail_threads_correspondent_idx").on(table.correspondent),
  ],
);

export const mailMessages = pgTable(
  "mail_messages",
  {
    /** Resend's id: the received-email id inbound, the sent-email id outbound.
        Also the handle the attachment endpoints are keyed by, which is why it
        is the primary key rather than an id of our own. */
    id: text("id").primaryKey(),
    threadId: text("thread_id")
      .notNull()
      .references(() => mailThreads.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    direction: text("direction", { enum: MAIL_DIRECTIONS }).notNull(),

    fromAddress: text("from_address").notNull(),
    toAddresses: text("to_addresses").notNull(),
    subject: text("subject").notNull(),

    bodyText: text("body_text"),
    bodyHtml: text("body_html"),

    /** RFC 5322 Message-ID of an incoming message, and the In-Reply-To of the
        one after it. Kept because they are what makes a reply land in the same
        thread in the customer's mail client rather than starting a new one. */
    messageId: text("message_id"),
    inReplyTo: text("in_reply_to"),

    attachments: jsonb("attachments").$type<MailAttachment[]>(),
  },
  (table) => [
    index("mail_messages_thread_idx").on(table.threadId, table.createdAt),
    /* Threading an incoming reply means asking "do we know this Message-ID?" */
    index("mail_messages_message_id_idx").on(table.messageId),
  ],
);
