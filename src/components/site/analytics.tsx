import Script from "next/script";

/**
 * Cookieless analytics.
 *
 * Plausible rather than GA4, so the site needs no consent banner at all. A
 * consent dialog on a B2B landing page costs conversions, and avoiding one is
 * free if we simply do not set tracking cookies.
 *
 * Renders nothing until a domain is configured, so development and preview
 * builds send no traffic anywhere.
 */
export function Analytics() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) return null;

  return (
    <Script
      defer
      data-domain={domain}
      src="https://plausible.io/js/script.outbound-links.js"
      strategy="afterInteractive"
    />
  );
}

/**
 * Custom events.
 *
 * The client needs to know which of his ideas actually earns - the calculator,
 * the recommender, or the plain catalogue. Without events that question can
 * only be guessed at.
 */
export function trackEvent(name: string, props?: Record<string, string | number>) {
  if (typeof window === "undefined") return;
  const plausible = (
    window as unknown as {
      plausible?: (n: string, o?: { props: Record<string, string | number> }) => void;
    }
  ).plausible;
  plausible?.(name, props ? { props } : undefined);
}
