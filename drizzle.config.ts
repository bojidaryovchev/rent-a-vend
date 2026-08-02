import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit configuration.
 *
 * Only the CLI reads this file - `db:generate` diffs `src/server/db/schema.ts`
 * against `drizzle/` and writes the SQL, `db:migrate` applies it. The app never
 * imports it.
 *
 * Next loads the env files for us; drizzle-kit is a plain Node process and does
 * not, so we load them here in Next's own precedence - `.env.local` first, then
 * `.env` filling the gaps. A value already in the environment beats both, which
 * is what makes `DATABASE_URL=... npm run db:migrate` work against a different
 * branch without editing a file first.
 */
for (const file of [".env.local", ".env"]) {
  if (!process.env.DATABASE_URL && existsSync(file)) {
    process.loadEnvFile(file);
  }
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
