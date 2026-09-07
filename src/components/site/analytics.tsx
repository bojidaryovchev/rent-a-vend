import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { track } from "@vercel/analytics";

/**
 * Cookieless analytics.
 *
 * ⚠ WAS PLAUSIBLE, AND THE REASONING FOR IT STILL HOLDS — it just points at a
 * different product now. The original note said: "Plausible rather than GA4, so
 * the site needs no consent banner at all. A consent dialog on a B2B landing
 * page costs conversions, and avoiding one is free if we simply do not set
 * tracking cookies." Every word of that is still the argument. Vercel Web
 * Analytics is also cookieless and also fingerprint-free, so the cookie policy
 * continues to say truthfully that there is nothing to consent to.
 *
 * What changed is the price of holding that position. Plausible is ~$9/month
 * and needed `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` set correctly on every deployment —
 * a variable that was, in fact, never set in production, so nothing was
 * measured on any of the three sites for the whole of their first fortnight
 * live. Vercel Web Analytics is included in the Pro plan these sites already
 * run on and has no configuration at all: it reads the deployment it is running
 * in. One less variable to forget is worth more here than any feature
 * difference between the two products.
 *
 * ⚠ IT MUST BE ENABLED PER PROJECT in the Vercel dashboard (Analytics tab).
 * Without that the script loads and silently reports nothing, which is the same
 * failure mode the Plausible variable had. The difference is that it is a
 * one-time toggle rather than a value that can drift.
 *
 * Renders nothing outside production: `@vercel/analytics` no-ops in development
 * and on preview deployments, so local work does not pollute the figures.
 */
export function Analytics() {
  return <VercelAnalytics />;
}

/**
 * Custom events.
 *
 * The client needs to know which of his ideas actually earns - the calculator,
 * the recommender, or the plain catalogue. Without events that question can
 * only be guessed at.
 *
 * The signature is unchanged from the Plausible version on purpose, so call
 * sites neither know nor care which product is behind it. Vercel accepts
 * string, number, boolean and null property values; anything else is dropped,
 * which is why the type is narrowed here rather than left as `unknown`.
 */
export function trackEvent(
  name: string,
  props?: Record<string, string | number | boolean | null>,
) {
  if (typeof window === "undefined") return;
  track(name, props);
}
