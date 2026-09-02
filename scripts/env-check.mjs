#!/usr/bin/env node
/**
 * Environment report.
 *
 * Answers one question: what will this deployment actually do with the
 * configuration it has?
 *
 * Separate from `readiness.mjs` on purpose - that one asks what content is
 * still fake, this one asks what the environment is missing or has wrong. Both
 * exist because the failure they catch is the same shape: something that looks
 * fine and is not.
 *
 * The checks worth having are the ones a list of variable names cannot express:
 * a Turnstile secret with no site key, an indexable flag on a preview build, a
 * database URL that is the direct Neon host rather than the pooled one. Those
 * are the cross-field rules below.
 *
 *   node scripts/env-check.mjs            report
 *   node scripts/env-check.mjs --strict   exit 1 on any error
 */

import { existsSync } from "node:fs";

/* Next loads these for us at runtime; a plain Node script does not. Same
   precedence Next uses - .env.local first, then .env filling the gaps - and
   anything already in the real environment beats both, so
   `VERCEL_ENV=production node scripts/env-check.mjs` works. */
for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}

const STRICT = process.argv.includes("--strict");

const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const OFF = "\x1b[0m";

const set = (name) => {
  const value = process.env[name];
  return typeof value === "string" && value.trim() !== "";
};
const val = (name) => (process.env[name] ?? "").trim();

const errors = [];
const warnings = [];
const notes = [];
const ok = [];

const error = (title, detail) => errors.push({ title, detail });
const warn = (title, detail) => warnings.push({ title, detail });
const note = (title, detail) => notes.push({ title, detail });
const good = (title, detail) => ok.push({ title, detail });

/* -- Site ---------------------------------------------------------------- */

if (!set("NEXT_PUBLIC_SITE_URL")) {
  error(
    "NEXT_PUBLIC_SITE_URL is not set",
    "Canonicals, hreflang, sitemap.xml, robots.txt, llms.txt and every absolute URL in the structured data will point at https://example.invalid.",
  );
} else if (!/^https?:\/\//.test(val("NEXT_PUBLIC_SITE_URL"))) {
  error(
    "NEXT_PUBLIC_SITE_URL has no scheme",
    `Got "${val("NEXT_PUBLIC_SITE_URL")}". It is passed to new URL() and must be absolute.`,
  );
} else if (val("NEXT_PUBLIC_SITE_URL").endsWith("/")) {
  note(
    "NEXT_PUBLIC_SITE_URL ends with a slash",
    "Harmless - new URL() normalises it - but the value is echoed in a few places, so it reads better without.",
  );
} else {
  good("NEXT_PUBLIC_SITE_URL", val("NEXT_PUBLIC_SITE_URL"));
}

const indexable = val("NEXT_PUBLIC_SITE_INDEXABLE") === "true";
const hostEnv = val("VERCEL_ENV");

if (set("NEXT_PUBLIC_SITE_INDEXABLE") && !indexable) {
  warn(
    `NEXT_PUBLIC_SITE_INDEXABLE is "${val("NEXT_PUBLIC_SITE_INDEXABLE")}", not "true"`,
    "The comparison is exact. Anything else means noindex everywhere and a disallow-all robots.txt, which may not be what was intended.",
  );
} else if (indexable && hostEnv && hostEnv !== "production") {
  good(
    "NEXT_PUBLIC_SITE_INDEXABLE is set but this is not production",
    `VERCEL_ENV=${hostEnv}, so isIndexable() returns false and this deployment stays out of the index. This is the guard working.`,
  );
} else if (indexable) {
  good("Indexing", "enabled");
} else {
  note("Indexing", "disabled - the site serves noindex and a disallow-all robots.txt.");
}

/* -- Enquiry storage ------------------------------------------------------ */

if (!set("DATABASE_URL")) {
  const onServerless = set("VERCEL");
  (onServerless ? error : warn)(
    "DATABASE_URL is not set",
    onServerless
      ? "This is a serverless host. Enquiries go to .data/enquiries.json on an ephemeral filesystem and WILL be lost."
      : "Enquiries go to .data/enquiries.json. Fine locally; on any host without a persistent disk it is silent data loss.",
  );
} else {
  const url = val("DATABASE_URL");
  if (!/^postgres(ql)?:\/\//i.test(url)) {
    error("DATABASE_URL does not look like a PostgreSQL URL", "Expected it to start with postgres:// or postgresql://.");
  } else {
    if (/neon\.tech/i.test(url) && !/-pooler\./i.test(url)) {
      warn(
        "DATABASE_URL is a direct Neon host, not the pooled one",
        "A serverless deployment opens a connection per instance and will exhaust a direct endpoint. Use the host with -pooler in it.",
      );
    }
    if (/neon\.tech/i.test(url) && !/sslmode=require/i.test(url)) {
      warn("DATABASE_URL has no ?sslmode=require", "Neon expects it; without it the connection can be refused.");
    }
    good("DATABASE_URL", "set - remember that nothing creates tables at runtime, so run `npm run db:migrate` once.");
  }
}

/* -- Email ---------------------------------------------------------------- */

if (!set("RESEND_API_KEY")) {
  warn(
    "RESEND_API_KEY is not set",
    "Enquiry notifications and the customer auto-reply are logged to the console instead of sent. The database row is still written.",
  );
} else {
  good("RESEND_API_KEY", "set");
}

if (!set("MAIL_TO")) {
  warn(
    "MAIL_TO is not set",
    "Notifications and forwarded info@ mail fall back to the published company address. Set it to the inbox a person actually reads.",
  );
} else {
  good("MAIL_TO", val("MAIL_TO"));
}

if (set("RESEND_API_KEY") && !set("RESEND_WEBHOOK_SECRET")) {
  note(
    "RESEND_WEBHOOK_SECRET is not set",
    "Mail to info@ still arrives and is readable in the Resend dashboard, but nothing is forwarded to MAIL_TO. Add the webhook in Resend, subscribe to email.received only, and paste the signing secret.",
  );
}

/* -- Admin ---------------------------------------------------------------- */

if (!set("ADMIN_PASSWORD")) {
  note("ADMIN_PASSWORD is not set", "The admin panel is disabled entirely, which is the safe default rather than a fallback password.");
} else {
  good("ADMIN_PASSWORD", "set - the admin panel is enabled");
  if (!set("ADMIN_SESSION_SECRET")) {
    note(
      "ADMIN_SESSION_SECRET is not set",
      "It falls back to ADMIN_PASSWORD, so rotating the password signs everyone out. Set it separately to decouple the two.",
    );
  }
}

/* -- Spam ----------------------------------------------------------------- */

const siteKey = set("NEXT_PUBLIC_TURNSTILE_SITE_KEY");
const secretKey = set("TURNSTILE_SECRET_KEY");

if (siteKey && secretKey) {
  good("Cloudflare Turnstile", "both keys present - the widget renders and tokens are verified");
} else if (siteKey !== secretKey) {
  error(
    "Cloudflare Turnstile is half-configured",
    siteKey
      ? "NEXT_PUBLIC_TURNSTILE_SITE_KEY is set but TURNSTILE_SECRET_KEY is not. The widget renders and its token is never checked, so bot protection is off."
      : "TURNSTILE_SECRET_KEY is set but NEXT_PUBLIC_TURNSTILE_SITE_KEY is not. No widget renders, so no token exists. Verification is skipped rather than refusing every enquiry - but bot protection is off.",
  );
} else {
  note("Cloudflare Turnstile", "not configured - the honeypot and server-side validation carry the load.");
}

/* -- Cosmetic ------------------------------------------------------------- */

if (!set("NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY")) {
  note("NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY is not set", "The map section degrades to the address plus a link into Google Maps.");
}

if (indexable && !set("NEXT_PUBLIC_PLAUSIBLE_DOMAIN")) {
  note("NEXT_PUBLIC_PLAUSIBLE_DOMAIN is not set", "No analytics script is rendered, so an indexable site is collecting nothing.");
}

if (indexable && val("NEXT_PUBLIC_HIDE_PLACEHOLDER_BANNER") !== "true") {
  warn(
    "The placeholder banner is visible on an indexable deployment",
    "Set NEXT_PUBLIC_HIDE_PLACEHOLDER_BANNER=true once the real prices, photos and company details are in.",
  );
}

/* -- Report --------------------------------------------------------------- */

const block = (title, colour, items) => {
  if (!items.length) return;
  console.log(`${BOLD}${colour}${title}${OFF}`);
  for (const { title: t, detail } of items) {
    console.log(`  ${BOLD}${t}${OFF}`);
    if (detail) console.log(`    ${DIM}${detail}${OFF}`);
  }
  console.log("");
};

console.log(`\n${BOLD}Environment${OFF}  ${DIM}${hostEnv ? `VERCEL_ENV=${hostEnv}` : "local"}${OFF}\n`);

block("Errors", RED, errors);
block("Warnings", YELLOW, warnings);
block("Notes", DIM, notes);

if (ok.length) {
  console.log(`${BOLD}${GREEN}Configured${OFF}`);
  for (const { title, detail } of ok) {
    console.log(`  ${title}${detail ? `  ${DIM}${detail}${OFF}` : ""}`);
  }
  console.log("");
}

console.log(
  `${errors.length} errors, ${warnings.length} warnings, ${notes.length} notes.\n`,
);

if (STRICT && errors.length) {
  console.error(`${RED}${BOLD}Stopped.${OFF} Fix the errors above, or run without --strict for a report.\n`);
  process.exit(1);
}
