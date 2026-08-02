import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "./db";
import {
  MAIL_DIRECTIONS,
  MAIL_THREAD_STATUSES,
  mailMessages,
  mailThreads,
  type MailAttachment,
  type MailDirection,
  type MailThreadStatus,
} from "./db/schema";

/**
 * The info@ mailbox.
 *
 * Same two-implementations-one-interface arrangement as `enquiry-store.ts`, and
 * for the same reason: the whole flow has to run on a laptop with no
 * credentials. The difference is that a lost enquiry is a lost sale, while a
 * lost mail row is only a lost copy - Resend holds the original either way, and
 * the Gmail forward has already been sent by the time we get here.
 *
 * Threads are matched, not created blindly. See `matchThread`.
 */

export { MAIL_DIRECTIONS, MAIL_THREAD_STATUSES };
export type { MailAttachment, MailDirection, MailThreadStatus };

export const THREAD_STATUS_LABEL_BG: Record<MailThreadStatus, string> = {
  open: "Отворена",
  done: "Приключена",
};

const attachmentSchema = z.object({
  filename: z.string(),
  size: z.number(),
  contentType: z.string(),
});

export const mailMessageSchema = z.object({
  id: z.string(),
  threadId: z.string(),
  createdAt: z.string(),
  direction: z.enum(MAIL_DIRECTIONS),

  fromAddress: z.string(),
  /** Stored as one header-shaped string, because that is what it is. */
  toAddresses: z.string(),
  subject: z.string(),

  bodyText: z.string().nullable(),
  bodyHtml: z.string().nullable(),

  messageId: z.string().nullable(),
  inReplyTo: z.string().nullable(),

  attachments: z.array(attachmentSchema).nullable(),
});

export const mailThreadSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  lastMessageAt: z.string(),
  subject: z.string(),
  correspondent: z.string(),
  correspondentName: z.string().nullable(),
  status: z.enum(MAIL_THREAD_STATUSES),
});

export type MailMessage = z.infer<typeof mailMessageSchema>;
export type MailThread = z.infer<typeof mailThreadSchema>;

/** A thread as the list page needs it: enough to decide what to open next,
 *  without dragging every message body across the wire to draw a list. */
export interface MailThreadSummary extends MailThread {
  messageCount: number;
  /** "in" means the last word was theirs - the ones that still owe an answer. */
  lastDirection: MailDirection;
  snippet: string;
}

export interface MailThreadDetail extends MailThread {
  messages: MailMessage[];
}

export interface NewThread {
  id: string;
  createdAt: string;
  subject: string;
  correspondent: string;
  correspondentName: string | null;
}

export interface MailboxStore {
  readonly kind: "postgres" | "file";
  listThreads(): Promise<MailThreadSummary[]>;
  getThread(id: string): Promise<MailThreadDetail | null>;
  getMessage(id: string): Promise<MailMessage | null>;
  createThread(thread: NewThread): Promise<void>;
  addMessage(message: MailMessage): Promise<void>;
  setThreadStatus(id: string, status: MailThreadStatus): Promise<void>;
  /** Threads whose stored Message-IDs appear in an incoming References chain. */
  findThreadByMessageIds(messageIds: string[]): Promise<string | null>;
  findThreadByCorrespondent(
    correspondent: string,
    normalizedSubject: string,
  ): Promise<string | null>;
}

/* -- thread matching ------------------------------------------------------- */

/**
 * "Re: Re: Отн: оферта" and "оферта" are the same conversation.
 *
 * Bulgarian clients send both the English and the Bulgarian prefixes, often
 * mixed, because the reply prefix comes from whatever client the sender uses
 * and not from the language they write in.
 */
const REPLY_PREFIX = /^\s*(re|fwd|fw|отн|относно|пр)\s*:\s*/i;

export function normalizeSubject(subject: string): string {
  let value = subject.trim();
  /* Loop: each Reply adds another prefix, and long threads accumulate them. */
  while (REPLY_PREFIX.test(value)) value = value.replace(REPLY_PREFIX, "");
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

/** The `<...>` ids out of a References or In-Reply-To header. */
export function parseMessageIds(header: string | undefined | null): string[] {
  if (!header) return [];
  return [...header.matchAll(/<[^<>\s]+>/g)].map((m) => m[0]);
}

/** Header lookup that does not care about case, because senders do not. */
export function headerValue(
  headers: Record<string, string> | null | undefined,
  name: string,
): string | undefined {
  if (!headers) return undefined;
  const wanted = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === wanted) return value;
  }
  return undefined;
}

/**
 * Which thread an incoming message belongs to.
 *
 * Two signals, in order of trust. The References chain is authoritative when it
 * matches: mail clients accumulate every ancestor id, so a customer replying to
 * OUR reply still carries the id of their own first message, which we stored.
 * That is why this works without ever learning the Message-ID Resend gave our
 * outgoing mail.
 *
 * Subject matching is the fallback for the client that sends a fresh message
 * about the same thing, and it is deliberately scoped to one correspondent -
 * two different people writing "оферта" are two conversations.
 */
export async function matchThread(
  store: MailboxStore,
  references: string[],
  correspondent: string,
  subject: string,
): Promise<string | null> {
  const byReference = await store.findThreadByMessageIds(references);
  if (byReference) return byReference;

  return store.findThreadByCorrespondent(correspondent, normalizeSubject(subject));
}

/* -- file store (development) --------------------------------------------- */

const FILE = join(process.cwd(), ".data", "mailbox.json");

const fileShapeSchema = z.object({
  threads: z.array(mailThreadSchema),
  messages: z.array(mailMessageSchema),
});

class FileMailboxStore implements MailboxStore {
  readonly kind = "file" as const;

  private async readAll(): Promise<z.infer<typeof fileShapeSchema>> {
    try {
      return fileShapeSchema.parse(JSON.parse(await readFile(FILE, "utf8")));
    } catch {
      return { threads: [], messages: [] };
    }
  }

  private async writeAll(data: z.infer<typeof fileShapeSchema>): Promise<void> {
    await mkdir(dirname(FILE), { recursive: true });
    await writeFile(FILE, JSON.stringify(data, null, 2), "utf8");
  }

  async listThreads(): Promise<MailThreadSummary[]> {
    const { threads, messages } = await this.readAll();
    return threads
      .map((thread) => summarize(thread, byThread(messages, thread.id)))
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
  }

  async getThread(id: string): Promise<MailThreadDetail | null> {
    const { threads, messages } = await this.readAll();
    const thread = threads.find((t) => t.id === id);
    if (!thread) return null;
    return { ...thread, messages: byThread(messages, id) };
  }

  async getMessage(id: string): Promise<MailMessage | null> {
    const { messages } = await this.readAll();
    return messages.find((m) => m.id === id) ?? null;
  }

  async createThread(thread: NewThread): Promise<void> {
    const data = await this.readAll();
    data.threads.push({
      ...thread,
      lastMessageAt: thread.createdAt,
      status: "open",
    });
    await this.writeAll(data);
  }

  async addMessage(message: MailMessage): Promise<void> {
    const data = await this.readAll();
    data.messages = [...data.messages.filter((m) => m.id !== message.id), message];
    data.threads = data.threads.map((t) =>
      t.id === message.threadId ? { ...t, lastMessageAt: message.createdAt } : t,
    );
    await this.writeAll(data);
  }

  async setThreadStatus(id: string, status: MailThreadStatus): Promise<void> {
    const data = await this.readAll();
    data.threads = data.threads.map((t) => (t.id === id ? { ...t, status } : t));
    await this.writeAll(data);
  }

  async findThreadByMessageIds(messageIds: string[]): Promise<string | null> {
    if (messageIds.length === 0) return null;
    const { messages } = await this.readAll();
    const hit = messages.find((m) => m.messageId && messageIds.includes(m.messageId));
    return hit?.threadId ?? null;
  }

  async findThreadByCorrespondent(
    correspondent: string,
    normalizedSubject: string,
  ): Promise<string | null> {
    const { threads } = await this.readAll();
    const hit = threads.find(
      (t) =>
        t.correspondent === correspondent &&
        normalizeSubject(t.subject) === normalizedSubject,
    );
    return hit?.id ?? null;
  }
}

/* -- postgres store (production) ------------------------------------------ */

class PostgresMailboxStore implements MailboxStore {
  readonly kind = "postgres" as const;

  async listThreads(): Promise<MailThreadSummary[]> {
    const threads = await getDb()
      .select()
      .from(mailThreads)
      .orderBy(desc(mailThreads.lastMessageAt))
      .limit(200);

    if (threads.length === 0) return [];

    /* One extra query rather than a denormalized snippet column on the thread:
       a copy of the last message kept in two places is a copy that eventually
       disagrees with itself. Bodies are excluded here - the list needs a line,
       not a message, and the HTML part of a mail is by far the biggest column
       in this schema. */
    const rows = await getDb()
      .select({
        threadId: mailMessages.threadId,
        createdAt: mailMessages.createdAt,
        direction: mailMessages.direction,
        bodyText: mailMessages.bodyText,
      })
      .from(mailMessages)
      .where(
        inArray(
          mailMessages.threadId,
          threads.map((t) => t.id),
        ),
      );

    return threads.map((thread) =>
      summarize(
        toThread(thread),
        rows
          .filter((r) => r.threadId === thread.id)
          .map((r) => ({
            createdAt: r.createdAt.toISOString(),
            direction: r.direction,
            bodyText: r.bodyText,
          })),
      ),
    );
  }

  async getThread(id: string): Promise<MailThreadDetail | null> {
    const [thread] = await getDb()
      .select()
      .from(mailThreads)
      .where(eq(mailThreads.id, id))
      .limit(1);
    if (!thread) return null;

    const rows = await getDb()
      .select()
      .from(mailMessages)
      .where(eq(mailMessages.threadId, id))
      .orderBy(mailMessages.createdAt);

    return { ...toThread(thread), messages: rows.map(toMessage) };
  }

  async getMessage(id: string): Promise<MailMessage | null> {
    const [row] = await getDb()
      .select()
      .from(mailMessages)
      .where(eq(mailMessages.id, id))
      .limit(1);
    return row ? toMessage(row) : null;
  }

  async createThread(thread: NewThread): Promise<void> {
    await getDb()
      .insert(mailThreads)
      .values({
        ...thread,
        createdAt: new Date(thread.createdAt),
        lastMessageAt: new Date(thread.createdAt),
        status: "open",
      })
      .onConflictDoNothing();
  }

  async addMessage(message: MailMessage): Promise<void> {
    /* Resend retries a webhook it did not get a 2xx for, and a retry must not
       double the conversation. The id is Resend's, so the conflict is exact. */
    await getDb()
      .insert(mailMessages)
      .values({ ...message, createdAt: new Date(message.createdAt) })
      .onConflictDoNothing();

    await getDb()
      .update(mailThreads)
      .set({ lastMessageAt: new Date(message.createdAt) })
      .where(eq(mailThreads.id, message.threadId));
  }

  async setThreadStatus(id: string, status: MailThreadStatus): Promise<void> {
    await getDb()
      .update(mailThreads)
      .set({ status })
      .where(eq(mailThreads.id, id));
  }

  async findThreadByMessageIds(messageIds: string[]): Promise<string | null> {
    if (messageIds.length === 0) return null;
    const [row] = await getDb()
      .select({ threadId: mailMessages.threadId })
      .from(mailMessages)
      .where(inArray(mailMessages.messageId, messageIds))
      .limit(1);
    return row?.threadId ?? null;
  }

  async findThreadByCorrespondent(
    correspondent: string,
    normalizedSubject: string,
  ): Promise<string | null> {
    /* Normalizing in SQL would mean teaching Postgres the Bulgarian reply
       prefixes. The correspondent index narrows this to a handful of rows, so
       the comparison happens here instead. */
    const rows = await getDb()
      .select({ id: mailThreads.id, subject: mailThreads.subject })
      .from(mailThreads)
      .where(
        and(
          eq(mailThreads.correspondent, correspondent),
          eq(mailThreads.status, "open"),
        ),
      )
      .orderBy(desc(mailThreads.lastMessageAt))
      .limit(50);

    return (
      rows.find((r) => normalizeSubject(r.subject) === normalizedSubject)?.id ??
      null
    );
  }
}

/* -- shared shaping -------------------------------------------------------- */

function byThread(messages: MailMessage[], threadId: string): MailMessage[] {
  return messages
    .filter((m) => m.threadId === threadId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function summarize(
  thread: MailThread,
  messages: { createdAt: string; direction: MailDirection; bodyText: string | null }[],
): MailThreadSummary {
  const ordered = [...messages].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
  const last = ordered.at(-1);

  return {
    ...thread,
    messageCount: ordered.length,
    lastDirection: last?.direction ?? "in",
    snippet: (last?.bodyText ?? "").replace(/\s+/g, " ").trim().slice(0, 160),
  };
}

function toThread(row: typeof mailThreads.$inferSelect): MailThread {
  return mailThreadSchema.parse({
    ...row,
    createdAt: row.createdAt.toISOString(),
    lastMessageAt: row.lastMessageAt.toISOString(),
  });
}

function toMessage(row: typeof mailMessages.$inferSelect): MailMessage {
  return mailMessageSchema.parse({
    ...row,
    createdAt: row.createdAt.toISOString(),
  });
}

let store: MailboxStore | null = null;

export function getMailboxStore(): MailboxStore {
  if (!store) {
    store = process.env.DATABASE_URL
      ? new PostgresMailboxStore()
      : new FileMailboxStore();
  }
  return store;
}
