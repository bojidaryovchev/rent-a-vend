import {
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
    unitRef: text("unit_ref"),
    term: integer("term"),
    source: text("source", { enum: ENQUIRY_SOURCES }).notNull(),
    recommenderSummary: text("recommender_summary"),

    status: text("status", { enum: ENQUIRY_STATUSES }).notNull().default("new"),
    notes: text("notes"),
  },
  (table) => [index("enquiries_created_at_idx").on(table.createdAt)],
);

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
