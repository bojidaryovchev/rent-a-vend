import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * The Neon connection.
 *
 * Over HTTP, not the WebSocket pool: every query here is a single statement
 * behind a server action or a server component, and the HTTP driver is one
 * fetch with no connection to keep alive - which is the only shape that behaves
 * on a serverless host, where pooled connections outlive the function that
 * opened them and exhaust the database instead.
 *
 * The trade is that HTTP has no interactive transactions. Nothing in this app
 * needs one; if that changes, `drizzle-orm/neon-serverless` and a `Pool` are
 * the upgrade, not a workaround here.
 *
 * Built lazily so that importing this module - which the file-store path does,
 * transitively - never demands credentials.
 */

let db: NeonHttpDatabase<typeof schema> | null = null;

export function getDb(): NeonHttpDatabase<typeof schema> {
  if (!db) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL липсва. Postgres хранилището не може да се използва без него.",
      );
    }
    db = drizzle(neon(url), { schema });
  }
  return db;
}

export { schema };
