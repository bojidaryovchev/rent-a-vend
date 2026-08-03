import type { NextConfig } from "next";

/**
 * Security headers.
 *
 * The site takes company names, phone numbers and email addresses through a
 * public form, so the baseline browser protections are worth having before it
 * is reachable. All five below constrain how the browser treats our own
 * responses and do not touch what the page is allowed to load, so none of them
 * can break Plausible, Turnstile or the Maps embed.
 *
 * DELIBERATELY NOT SET: Content-Security-Policy.
 *
 * A useful CSP here has to allow Plausible (plausible.io), Cloudflare
 * Turnstile (challenges.cloudflare.com) and the Google Maps embed
 * (www.google.com, maps.googleapis.com, *.gstatic.com), plus the inline
 * JSON-LD blocks and Next's inline bootstrap. Getting one clause wrong fails
 * silently and takes the enquiry form with it - and the enquiry form is the
 * entire product. It belongs behind a real browser test on a deployed preview,
 * not a blind guess in a config file. Tracked in the launch list.
 */
const securityHeaders = [
  /* Stops the browser second-guessing our Content-Type - the classic route to
     turning a user-influenced response into executable script. */
  { key: "X-Content-Type-Options", value: "nosniff" },

  /* Full URL within our own origin, only the origin to others. Keeps machine
     and term parameters out of third-party referer logs. */
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  /* No framing by other sites. Clickjacking a form whose submit button sends a
     real enquiry is a cheap attack, and nothing here needs to be embedded. */
  { key: "X-Frame-Options", value: "SAMEORIGIN" },

  /* We ask for none of these. Denying them explicitly means a future dependency
     cannot quietly start asking on our behalf. */
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },

  /* HTTPS only, two years, including subdomains. Safe because the site has
     never been served over HTTP at a real domain, so there is no legacy
     plain-HTTP traffic to strand. Revisit before pointing any subdomain at a
     non-TLS host. */
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },

  /**
   * Version skew protection.
   *
   * Every build gives its chunks and its server-function ids new names. A tab
   * opened before a deploy still holds the old ones, so the next click inside
   * it asks for files that no longer exist - and the browser shows "This page
   * couldn't load" while the server logs stay perfectly clean, because nothing
   * ever reached a route.
   *
   * With a deployment id set, Next stamps it on navigation responses, notices
   * the mismatch, and does a full page load instead of failing. The admin panel
   * is where this bites: it is the one surface someone leaves open in a tab for
   * hours across several deploys.
   *
   * Undefined outside Vercel, which is what disables the mechanism locally.
   */
  deploymentId:
    process.env.VERCEL_DEPLOYMENT_ID ?? process.env.VERCEL_GIT_COMMIT_SHA,

  experimental: {
    /**
     * Raised from the 1 MB default for one form: the reply box in the admin
     * mailbox, which can carry a quote as a PDF.
     *
     * Not raised further, because above this the limit stops being ours. A
     * Vercel function refuses a request body over roughly 4.5 MB before any of
     * our code runs, so a larger number here would only move the failure from a
     * message we write to one the platform writes. `REPLY_ATTACHMENT_LIMIT` in
     * src/server/mailbox-reply.ts is the figure the user is actually told, and
     * it sits below this on purpose.
     */
    serverActions: { bodySizeLimit: "5mb" },
  },
};

export default nextConfig;
