/**
 * Environment manifest. Read by scripts/env-check, env-push and env-example,
 * so .env.example and the deployed configuration cannot drift apart.
 *
 *   kind: config   not secret; may carry a committed `value`, pushed as plain
 *         secret   never committed; value comes from .env, pushed encrypted
 *         system   set by the platform; documented only, never pushed
 *
 *   targets   which Vercel environments receive it
 *   required  "always" | "production" | false
 *   fromEnv   a config var whose local value is also the production one
 */

export const project = {
  vercelName: "rent-a-vend",
  gitRepository: { type: "github", repo: "bojidaryovchev/rent-a-vend" },
  framework: "nextjs",
  rootDirectory: null,
};

const PROD = ["production"];
const PROD_PREVIEW = ["production", "preview"];

export const vars = [
  {
    name: "NEXT_PUBLIC_SITE_URL",
    kind: "config",
    value: "https://rent-a-vend.com",
    targets: PROD_PREVIEW,
    required: "always",
    section: "Site",
    summary:
      "Canonical origin. Canonicals, sitemap.xml, robots.txt, llms.txt and the structured data all derive from it.",
    validate: (v) =>
      !/^https?:\/\//.test(v)
        ? { level: "error", message: "Must be absolute - it is passed to new URL()." }
        : v.endsWith("/")
          ? { level: "note", message: "Trailing slash is harmless but reads better without." }
          : null,
    missing: { level: "error", message: "Everything absolute falls back to https://example.invalid." },
  },
  {
    name: "NEXT_PUBLIC_SITE_INDEXABLE",
    kind: "config",
    // Uncomment at launch. A manifest that already said "true" would let the
    // next `env:push --apply` open the site to Google on your behalf.
    // value: "true",
    targets: PROD,
    required: false,
    section: "Site",
    summary: 'Exactly "true" to allow indexing. Production-only, so a preview build cannot inherit it.',
    detail: ["Stays off until the placeholder prices and photos are gone."],
    validate: (v) =>
      v !== "true"
        ? { level: "warning", message: `Is "${v}", not "true" - the comparison is exact, so this means noindex.` }
        : null,
    missing: { level: "note", message: "Site serves noindex and a disallow-all robots.txt." },
  },

  {
    name: "DATABASE_URL",
    kind: "secret",
    targets: PROD_PREVIEW,
    required: "always",
    section: "Enquiry storage",
    example: "postgresql://user:pass@ep-xxx-pooler.eu-central-1.aws.neon.tech/db?sslmode=require",
    summary: "Neon Postgres. Use the POOLED host - the one with -pooler - and keep ?sslmode=require.",
    detail: ["Nothing creates tables at runtime: run `npm run db:migrate` after setting this."],
    validate: (v) => {
      if (!/^postgres(ql)?:\/\//i.test(v)) return { level: "error", message: "Not a PostgreSQL URL." };
      if (/neon\.tech/i.test(v) && !/-pooler\./i.test(v))
        return { level: "warning", message: "Direct Neon host, not the pooled one - serverless will exhaust it." };
      if (/neon\.tech/i.test(v) && !/sslmode=require/i.test(v))
        return { level: "warning", message: "Neon expects ?sslmode=require." };
      return null;
    },
    missing: {
      level: "error",
      message: "Enquiries go to an ephemeral .data/enquiries.json and WILL be lost.",
      levelWhenLocal: "warning",
      messageWhenLocal: "Enquiries go to .data/enquiries.json. Fine locally, data loss on a serverless host.",
    },
  },

  {
    name: "ADMIN_PASSWORD",
    kind: "secret",
    targets: PROD,
    required: "production",
    section: "Admin",
    summary: "Enables the admin panel. Unset means the panel is disabled, not defaulted.",
    validate: (v) =>
      v.length < 12
        ? {
            level: "warning",
            message: `Only ${v.length} characters, on a public URL with no login rate limit. Use a passphrase.`,
          }
        : null,
    missing: { level: "note", message: "Admin panel disabled - the safe default." },
  },
  {
    name: "ADMIN_SESSION_SECRET",
    kind: "secret",
    targets: PROD,
    required: false,
    section: "Admin",
    example: "openssl rand -hex 32",
    summary: "Signs the admin session cookie. Falls back to ADMIN_PASSWORD, coupling rotation to sign-out.",
    missing: null,
  },

  {
    name: "RESEND_API_KEY",
    kind: "secret",
    targets: PROD_PREVIEW,
    required: "always",
    section: "Email",
    example: "re_xxxxxxxxxxxxxxxxxxxx",
    summary: "Sends enquiry notifications, the auto-reply, admin mailbox replies and inbound forwards.",
    missing: {
      level: "warning",
      message: "Mail is logged to the console instead of sent. The database row is still written.",
    },
  },
  {
    name: "MAIL_FROM",
    kind: "config",
    targets: [],
    required: false,
    section: "Email",
    example: "Rent-a-Vend <info@rent-a-vend.com>",
    summary:
      "Sender override. Defaults to the published address; set it on staging so previews do not send as the live brand.",
    missing: null,
  },
  {
    name: "MAIL_TO",
    // Not a credential, but a person's inbox, and this repository is public.
    kind: "secret",
    targets: PROD_PREVIEW,
    required: "always",
    section: "Email",
    example: "someone@gmail.com",
    summary: "The human inbox for notifications and forwarded info@ mail. Never shown to a customer.",
    missing: { level: "warning", message: "Falls back to the published company address." },
  },
  {
    name: "RESEND_WEBHOOK_SECRET",
    kind: "secret",
    targets: PROD,
    required: false,
    section: "Email",
    example: "whsec_xxxxxxxxxxxx",
    summary: "Verifies the email.received webhook at /api/inbound, which forwards info@ mail to MAIL_TO.",
    detail: [
      "Resend dashboard -> Webhooks -> add https://<domain>/api/inbound, subscribe to email.received only.",
    ],
    missing: null,
  },

  {
    name: "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
    kind: "config",
    fromEnv: true,
    // Production only: Turnstile validates hostnames and supports no wildcards,
    // so a *.vercel.app preview fails the check and refuses every enquiry.
    targets: PROD,
    required: false,
    section: "Spam",
    example: "0x4AAAAAAA...",
    summary: "Renders the Turnstile widget. Both keys or neither - either alone means no bot protection.",
    missing: null,
  },
  {
    name: "TURNSTILE_SECRET_KEY",
    kind: "secret",
    targets: PROD,
    required: false,
    section: "Spam",
    example: "0x4AAAAAAA...",
    summary: "Verifies the widget's token. Ignored without a site key, so it cannot refuse every enquiry alone.",
    detail: ["Local testing: 1x00000000000000000000AA / 1x0000000000000000000000000000000AA always pass."],
    missing: null,
  },

  {
    name: "NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY",
    kind: "config",
    fromEnv: true,
    targets: PROD_PREVIEW,
    required: false,
    section: "Map",
    example: "AIzaSy...",
    summary: "Maps Embed key. Ships to the browser, so restrict it by HTTP referrer.",
    missing: { level: "note", message: "Map degrades to the address plus a link into Google Maps." },
  },

  {
    name: "NEXT_PUBLIC_HIDE_PLACEHOLDER_BANNER",
    kind: "config",
    // Uncomment at launch, with the indexing flag: hiding the banner asserts
    // that the data is real.
    // value: "true",
    targets: PROD,
    required: false,
    section: "Presentation",
    summary: 'Set "true" to hide the demo banner, once real prices and photos are in.',
    missing: null,
  },
  {
    name: "NEXT_PUBLIC_PLAUSIBLE_DOMAIN",
    kind: "config",
    value: "rent-a-vend.com",
    targets: PROD,
    required: false,
    section: "Presentation",
    summary: "Bare domain. Renders the cookieless Plausible script; unset renders nothing.",
    missing: null,
  },

  { name: "VERCEL_ENV", kind: "system", section: "Platform", summary: 'Gates indexing - isIndexable() requires "production".' },
  { name: "VERCEL", kind: "system", section: "Platform", summary: "Set on every Vercel runtime; triggers the ephemeral-storage error." },
  { name: "VERCEL_DEPLOYMENT_ID", kind: "system", section: "Platform", summary: "Feeds deploymentId for version-skew protection." },
  { name: "VERCEL_GIT_COMMIT_SHA", kind: "system", section: "Platform", summary: "Fallback for the deployment id." },
  { name: "NODE_ENV", kind: "system", section: "Platform", summary: "Sets `secure` on the admin session cookie." },
];

/** Rules about the relationship between two variables, which no single one can express. */
export const crossChecks = [
  ({ has }) => {
    const site = has("NEXT_PUBLIC_TURNSTILE_SITE_KEY");
    const secret = has("TURNSTILE_SECRET_KEY");
    if (site && secret) return { level: "ok", title: "Turnstile", message: "both keys present" };
    if (site !== secret)
      return {
        level: "error",
        title: "Turnstile is half-configured",
        message: site
          ? "Site key without secret: the widget renders and its token is never checked."
          : "Secret without site key: no widget, so no token. Verification is skipped rather than refusing every enquiry.",
      };
    return { level: "note", title: "Turnstile", message: "not configured - honeypot and validation carry the load." };
  },

  ({ has }) =>
    has("ADMIN_PASSWORD") && !has("ADMIN_SESSION_SECRET")
      ? {
          level: "note",
          title: "ADMIN_SESSION_SECRET is not set",
          message: "Falls back to ADMIN_PASSWORD, so rotating the password signs everyone out.",
        }
      : null,

  ({ has }) =>
    has("RESEND_API_KEY") && !has("RESEND_WEBHOOK_SECRET")
      ? {
          level: "note",
          title: "RESEND_WEBHOOK_SECRET is not set",
          message: "info@ mail arrives in the Resend dashboard but is not forwarded.",
        }
      : null,

  ({ value, hostEnv }) => {
    const on = value("NEXT_PUBLIC_SITE_INDEXABLE") === "true";
    if (!on) return { level: "note", title: "Indexing", message: "disabled" };
    if (hostEnv && hostEnv !== "production")
      return {
        level: "ok",
        title: "Indexing",
        message: `flag set but VERCEL_ENV=${hostEnv}, so still noindex. The guard working.`,
      };
    return { level: "ok", title: "Indexing", message: "enabled" };
  },

  ({ value }) =>
    value("NEXT_PUBLIC_SITE_INDEXABLE") === "true" &&
    value("NEXT_PUBLIC_HIDE_PLACEHOLDER_BANNER") !== "true"
      ? {
          level: "warning",
          title: "Placeholder banner visible on an indexable deployment",
          message: "Set NEXT_PUBLIC_HIDE_PLACEHOLDER_BANNER=true.",
        }
      : null,
];
