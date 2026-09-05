/**
 * The environment manifest. One declaration, three consumers.
 *
 *   scripts/env-check.mjs    what this configuration will actually do
 *   scripts/env-push.mjs     apply it to Vercel
 *   scripts/env-example.mjs  regenerate .env.example
 *
 * The point of the single file is that `.env.example`, the readiness check and
 * the deployed configuration cannot drift apart, because they are the same
 * declaration rendered three ways. They had drifted: a variable documented in
 * `.env.example` and read by no code, a launch checklist instructing a setting
 * that refused every enquiry, an example file naming a port that did not exist.
 *
 * ---------------------------------------------------------------------------
 * `kind` decides where a value may live. This is the load-bearing field.
 * ---------------------------------------------------------------------------
 *
 *   config  Not secret. May carry a committed `value` below, which is then the
 *           source of truth and is pushed to Vercel as a `plain` variable.
 *           Every NEXT_PUBLIC_* value qualifies by definition: it is inlined
 *           into a JavaScript bundle that any visitor can read, so committing
 *           it discloses nothing that is not already public.
 *
 *   secret  MUST NOT carry a `value`. env-push refuses to run if one appears
 *           here, so the manifest structurally cannot hold a credential.
 *           Values come from your local `.env` and are pushed `encrypted`.
 *
 *   system  Supplied by the platform. Documented, never pushed.
 *   local   Development only. Documented, never pushed.
 *
 * `targets` is the other half of the safety story. `NEXT_PUBLIC_SITE_INDEXABLE`
 * is declared production-only, so the mistake of scoping it to every
 * environment - which bakes it into preview builds - is not one this tool can
 * make on your behalf.
 */

/** Where this deploys. Used by env-push to find, or optionally create, the project. */
export const project = {
  vercelName: "rent-a-vend",
  gitRepository: { type: "github", repo: "bojidaryovchev/rent-a-vend" },
  framework: "nextjs",
  /** Repo root is the app root here; buy-a-coffee is the one that differs. */
  rootDirectory: null,
};

const PROD = ["production"];
const PROD_PREVIEW = ["production", "preview"];

export const vars = [
  /* -- Site ------------------------------------------------------------- */
  {
    name: "NEXT_PUBLIC_SITE_URL",
    kind: "config",
    value: "https://rent-a-vend.com",
    targets: PROD_PREVIEW,
    required: "always",
    section: "Site",
    summary:
      "Canonical origin. Canonicals, sitemap.xml, robots.txt, llms.txt and every absolute URL in the structured data derive from it.",
    detail: [
      "Where the site lives. A wrong value here is wrong in the one place",
      "Google reads. Without it, everything points at https://example.invalid.",
    ],
    validate: (v) =>
      !/^https?:\/\//.test(v)
        ? { level: "error", message: "Must be absolute - it is passed to new URL()." }
        : v.endsWith("/")
          ? { level: "note", message: "Trailing slash is harmless but reads better without." }
          : null,
    missing: {
      level: "error",
      message:
        "Canonicals, hreflang, sitemap.xml, robots.txt, llms.txt and the structured data will all point at https://example.invalid.",
    },
  },
  {
    name: "NEXT_PUBLIC_SITE_INDEXABLE",
    kind: "config",
    /* Left uncommitted ON PURPOSE. Uncomment when the placeholder prices and
       photos are gone - that is a launch decision, and a manifest that already
       says "true" would make the next `env:push --apply` take it for you. */
    // value: "true",
    /* Production only, deliberately. Inlined at build time, so scoping it to
       every environment bakes it into preview builds. isIndexable() also checks
       VERCEL_ENV as a backstop, but the scoping is the actual fix. */
    targets: PROD,
    required: false,
    section: "Site",
    summary:
      'Must be exactly "true". Declared production-only so a preview build cannot inherit it and index itself.',
    detail: [
      "Indexing is a separate switch from the site URL, and stays off until the",
      "placeholder prices and photos are gone. A catalogue indexed at stub prices",
      "teaches Google figures that are slow to correct.",
    ],
    validate: (v) =>
      v !== "true"
        ? {
            level: "warning",
            message: `Is "${v}", not "true". The comparison is exact, so this means noindex everywhere and a disallow-all robots.txt.`,
          }
        : null,
    missing: { level: "note", message: "The site serves noindex and a disallow-all robots.txt." },
  },

  /* -- Enquiry storage --------------------------------------------------- */
  {
    name: "DATABASE_URL",
    kind: "secret",
    targets: PROD_PREVIEW,
    required: "always",
    section: "Enquiry storage",
    example:
      "postgresql://user:password@ep-xxx-pooler.eu-central-1.aws.neon.tech/dbname?sslmode=require",
    summary:
      "Neon Postgres via Drizzle. Use the POOLED host - the one with -pooler - and keep ?sslmode=require.",
    detail: [
      "Without this, enquiries are written to .data/enquiries.json, which is fine",
      "locally and loses data on any host with an ephemeral filesystem.",
      "",
      "Creating the database does NOT create the table. After setting this, run:",
      "  npm run db:migrate",
      "and again after any change to src/server/db/schema.ts that has been",
      "through npm run db:generate. Nothing creates tables at runtime.",
    ],
    validate: (v) => {
      if (!/^postgres(ql)?:\/\//i.test(v))
        return { level: "error", message: "Does not look like a PostgreSQL URL." };
      if (/neon\.tech/i.test(v) && !/-pooler\./i.test(v))
        return {
          level: "warning",
          message:
            "This is a direct Neon host, not the pooled one. A serverless deployment opens a connection per instance and will exhaust it.",
        };
      if (/neon\.tech/i.test(v) && !/sslmode=require/i.test(v))
        return { level: "warning", message: "Neon expects ?sslmode=require; without it the connection can be refused." };
      return null;
    },
    missing: {
      level: "error",
      message:
        "Enquiries go to .data/enquiries.json. Fine locally; on a serverless host it is silent data loss.",
      /* Downgraded off a serverless host - see env-check. */
      levelWhenLocal: "warning",
    },
  },

  /* -- Admin -------------------------------------------------------------- */
  {
    name: "ADMIN_PASSWORD",
    kind: "secret",
    targets: PROD,
    required: "production",
    section: "Admin",
    summary: "Enables the admin panel. With none set the panel is DISABLED rather than defaulted.",
    detail: ["A shipped default password is worse than no admin at all."],
    validate: (v) =>
      v.length < 12
        ? {
            level: "warning",
            message: `Only ${v.length} characters. This is the single credential protecting every enquiry, every stored message and the price list, on a public URL with no rate limit on the login. Use a passphrase.`,
          }
        : null,
    missing: { level: "note", message: "The admin panel is disabled entirely, which is the safe default." },
  },
  {
    name: "ADMIN_SESSION_SECRET",
    kind: "secret",
    targets: PROD,
    required: false,
    section: "Admin",
    example: "openssl rand -hex 32",
    summary:
      "Signs the admin session cookie. Falls back to ADMIN_PASSWORD, which couples password rotation to signing everyone out.",
    detail: [
      "Optional, but set it separately so changing the password does not have to",
      "invalidate every session.",
    ],
    missing: null, // handled as a cross-check, since it depends on ADMIN_PASSWORD
  },

  /* -- Email -------------------------------------------------------------- */
  {
    name: "RESEND_API_KEY",
    kind: "secret",
    targets: PROD_PREVIEW,
    required: "always",
    section: "Email",
    example: "re_xxxxxxxxxxxxxxxxxxxx",
    summary:
      "Sends the enquiry notification and customer auto-reply; also powers admin mailbox replies and inbound forwarding.",
    detail: [
      "Without a key, both messages are logged to the console instead of sent.",
      "The enquiry is still stored: the database row is the source of truth and",
      "email is only a notification.",
    ],
    missing: {
      level: "warning",
      message: "Notifications and the auto-reply are logged to the console instead of sent. The database row is still written.",
    },
  },
  {
    name: "MAIL_FROM",
    kind: "config",
    /* No committed value: the default in code is already correct for
       production, and the only real use is overriding it on a preview. */
    targets: [],
    required: false,
    section: "Email",
    example: "Rent-a-Vend <info@rent-a-vend.com>",
    summary:
      "Sender override. Defaults to the published address, which rent-a-vend.com is verified to send as (SPF + DKIM).",
    detail: [
      "Set it on a staging deploy, which has no business sending as the live",
      "brand. Accepts a display name.",
    ],
    missing: null,
  },
  {
    name: "MAIL_TO",
    /* Secret-side deliberately, though it is not a credential: it is a private
       individual's inbox and these repositories are public. Move it to `config`
       with a committed value once they are private, if you want it versioned. */
    kind: "secret",
    targets: PROD_PREVIEW,
    required: "always",
    section: "Email",
    example: "someone@gmail.com",
    summary:
      "The human inbox. Enquiry notifications and mail forwarded from info@ both land here, so there is one place to read rather than two.",
    detail: [
      "A plain Gmail address is right: it is never shown to a customer, and",
      "replies reach the customer because both messages carry his address as",
      "Reply-To.",
      "",
      "Kept out of this repository rather than committed to the manifest,",
      "because it is a person's inbox and the repository is public.",
    ],
    missing: {
      level: "warning",
      message:
        "Notifications and forwarded info@ mail fall back to the published company address. Set it to the inbox a person actually reads.",
    },
  },
  {
    name: "RESEND_WEBHOOK_SECRET",
    kind: "secret",
    targets: PROD,
    required: false,
    section: "Email",
    example: "whsec_xxxxxxxxxxxx",
    summary:
      "Verifies the email.received webhook at /api/inbound, which forwards info@ mail to MAIL_TO.",
    detail: [
      "Sending and receiving are independent: sending needs SPF/DKIM, receiving",
      "needs MX, and whoever holds the MX record owns the inbox.",
      "",
      "Resend does not forward mail on its own - it stores the message and posts",
      "an email.received webhook. src/app/api/inbound/route.ts is that endpoint",
      "and src/server/inbound.ts re-sends the message to MAIL_TO with the",
      "original sender as Reply-To.",
      "",
      "To finish the wiring: Resend dashboard -> Webhooks -> add",
      "https://<domain>/api/inbound, subscribe to email.received ONLY, and paste",
      "the signing secret here. Without it nothing is forwarded; mail still",
      "arrives and sits readable in the Resend dashboard.",
    ],
    missing: null, // cross-check: only interesting once RESEND_API_KEY is set
  },

  /* -- Spam --------------------------------------------------------------- */
  {
    name: "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
    kind: "config",
    /* Public by design - it ships to every browser - and the value on your
       machine is the real one, so pushing it from .env is safe and saves
       committing a key to a public repository. */
    fromEnv: true,
    /* No committed value until there are real keys. Falls back to .env, and can
       be promoted into the manifest at any time - it ships to the browser
       anyway, so committing it discloses nothing. */
    targets: PROD_PREVIEW,
    required: false,
    section: "Spam",
    example: "0x4AAAAAAA...",
    summary: "Renders the Turnstile widget in the browser. Both keys or neither.",
    detail: [
      "Cloudflare Turnstile, chosen over reCAPTCHA for EU data optics.",
      "",
      "BOTH or NEITHER. This key renders the widget",
      "(src/components/forms/turnstile.tsx); TURNSTILE_SECRET_KEY verifies the",
      "token it produces (src/server/turnstile.ts). Either half alone means no",
      "bot protection - env:check says so. With neither, the honeypot and",
      "server-side validation carry the load.",
    ],
    missing: null, // cross-check with the secret half
  },
  {
    name: "TURNSTILE_SECRET_KEY",
    kind: "secret",
    targets: PROD_PREVIEW,
    required: false,
    section: "Spam",
    example: "0x4AAAAAAA...",
    summary:
      "Verifies the token the widget produces. Ignored without a site key, so setting it alone can no longer refuse every enquiry.",
    detail: ["Both come from the same Cloudflare dashboard widget."],
    missing: null,
  },

  /* -- Map ---------------------------------------------------------------- */
  {
    name: "NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY",
    kind: "config",
    /* Public by design - it ships to every browser - and the value on your
       machine is the real one, so pushing it from .env is safe and saves
       committing a key to a public repository. */
    fromEnv: true,
    targets: PROD_PREVIEW,
    required: false,
    section: "Map",
    example: "AIzaSy...",
    summary:
      'Google Maps Embed API key for the map on "Кои сме ние". Restrict it by HTTP referrer.',
    detail: [
      "Free and unmetered, but it must be restricted by HTTP referrer in the",
      "Google Cloud console: the key ships to the browser, and an unrestricted",
      "one is someone else's quota.",
      "",
      "Without it the section falls back to the address and a link into Google",
      "Maps, which is a worse map and a perfectly good set of directions.",
    ],
    missing: {
      level: "note",
      message: "The map section degrades to the address plus a link into Google Maps.",
    },
  },

  /* -- Presentation ------------------------------------------------------- */
  {
    name: "NEXT_PUBLIC_HIDE_PLACEHOLDER_BANNER",
    kind: "config",
    /* Same reasoning as the indexing flag: hiding the demo banner is a claim
       that the data is real, and not one to make by default. */
    // value: "true",
    targets: PROD,
    required: false,
    section: "Placeholder guard",
    summary: 'Set to "true" to hide the yellow demo banner.',
    detail: [
      "Only set this once the real prices, photos and company details are in, or",
      "screenshots will circulate looking authoritative.",
    ],
    missing: null,
  },
  {
    name: "NEXT_PUBLIC_PLAUSIBLE_DOMAIN",
    kind: "config",
    value: "rent-a-vend.com",
    targets: PROD,
    required: false,
    section: "Analytics",
    summary: "Bare domain. Renders the cookieless Plausible script; unset renders nothing.",
    detail: [
      "Plausible, cookieless, so the site needs no consent banner at all. With",
      "this unset the script is not rendered, so development and preview builds",
      "send no traffic anywhere.",
    ],
    missing: null,
  },

  /* -- Supplied by the platform ------------------------------------------- */
  {
    name: "VERCEL_ENV",
    kind: "system",
    section: "Platform",
    summary:
      'Gates indexing: isIndexable() requires "production" here, so a preview cannot open itself to crawlers.',
  },
  {
    name: "VERCEL",
    kind: "system",
    section: "Platform",
    summary:
      "Set on every Vercel runtime. Triggers the loud error when enquiries fall back to an ephemeral file.",
  },
  {
    name: "VERCEL_DEPLOYMENT_ID",
    kind: "system",
    section: "Platform",
    summary:
      "Feeds next.config.ts deploymentId for version-skew protection, so a tab left open across a deploy reloads instead of failing.",
  },
  {
    name: "VERCEL_GIT_COMMIT_SHA",
    kind: "system",
    section: "Platform",
    summary: "Fallback for the deployment id when VERCEL_DEPLOYMENT_ID is absent.",
  },
  {
    name: "NODE_ENV",
    kind: "system",
    section: "Platform",
    summary: "Sets `secure` on the admin session cookie.",
  },
];

/**
 * Rules that no single variable can express, because they are about the
 * relationship between two of them. These are the checks worth having: every
 * one of them corresponds to a way the site could look configured and be
 * broken.
 */
export const crossChecks = [
  /* The regression that refused every enquiry on three sites. */
  ({ has }) => {
    const site = has("NEXT_PUBLIC_TURNSTILE_SITE_KEY");
    const secret = has("TURNSTILE_SECRET_KEY");
    if (site && secret)
      return { level: "ok", title: "Cloudflare Turnstile", message: "both keys present - the widget renders and tokens are verified" };
    if (site !== secret)
      return {
        level: "error",
        title: "Cloudflare Turnstile is half-configured",
        message: site
          ? "NEXT_PUBLIC_TURNSTILE_SITE_KEY is set but TURNSTILE_SECRET_KEY is not. The widget renders and its token is never checked, so bot protection is off."
          : "TURNSTILE_SECRET_KEY is set but NEXT_PUBLIC_TURNSTILE_SITE_KEY is not. No widget renders, so no token exists. Verification is skipped rather than refusing every enquiry - but bot protection is off.",
      };
    return { level: "note", title: "Cloudflare Turnstile", message: "not configured - the honeypot and server-side validation carry the load." };
  },

  ({ has }) =>
    has("ADMIN_PASSWORD") && !has("ADMIN_SESSION_SECRET")
      ? {
          level: "note",
          title: "ADMIN_SESSION_SECRET is not set",
          message: "It falls back to ADMIN_PASSWORD, so rotating the password signs everyone out. Set it separately to decouple the two.",
        }
      : null,

  ({ has }) =>
    has("RESEND_API_KEY") && !has("RESEND_WEBHOOK_SECRET")
      ? {
          level: "note",
          title: "RESEND_WEBHOOK_SECRET is not set",
          message: "Mail to info@ still arrives and is readable in the Resend dashboard, but nothing is forwarded to MAIL_TO.",
        }
      : null,

  /* The highest-stakes flag on the site, so the report states the outcome
     rather than leaving it to be inferred from a list of values. */
  ({ value, hostEnv }) => {
    const flag = value("NEXT_PUBLIC_SITE_INDEXABLE") === "true";
    if (!flag)
      return { level: "note", title: "Indexing", message: "disabled - the site serves noindex and a disallow-all robots.txt." };
    if (hostEnv && hostEnv !== "production")
      return {
        level: "ok",
        title: "Indexing",
        message: `flag is set, but VERCEL_ENV=${hostEnv}, so isIndexable() returns false and this deployment stays out of the index. This is the guard working.`,
      };
    return { level: "ok", title: "Indexing", message: "enabled" };
  },

  ({ has, value }) =>
    value("NEXT_PUBLIC_SITE_INDEXABLE") === "true" && !has("NEXT_PUBLIC_PLAUSIBLE_DOMAIN")
      ? {
          level: "note",
          title: "NEXT_PUBLIC_PLAUSIBLE_DOMAIN is not set",
          message: "No analytics script is rendered, so an indexable site is collecting nothing.",
        }
      : null,

  ({ value }) =>
    value("NEXT_PUBLIC_SITE_INDEXABLE") === "true" &&
    value("NEXT_PUBLIC_HIDE_PLACEHOLDER_BANNER") !== "true"
      ? {
          level: "warning",
          title: "The placeholder banner is visible on an indexable deployment",
          message: "Set NEXT_PUBLIC_HIDE_PLACEHOLDER_BANNER=true once the real prices, photos and company details are in.",
        }
      : null,
];
