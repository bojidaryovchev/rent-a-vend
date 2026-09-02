import "server-only";

/**
 * Cloudflare Turnstile verification.
 *
 * Chosen over reCAPTCHA for EU data optics: this is a B2B site whose visitors
 * include public-sector buyers, and shipping their traffic to Google's ad
 * infrastructure to prove they are human is a poor look on a page that also
 * carries a GDPR notice.
 *
 * Verification is gated on BOTH halves - the secret here and
 * `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, which decides whether the browser renders a
 * widget at all (src/components/forms/turnstile.tsx).
 *
 * That pairing is deliberate and load-bearing. With a secret but no site key
 * there is no widget, so no token, so a check gated on the secret alone would
 * refuse EVERY submission with "not human" - a total outage of the enquiry
 * funnel that looks, in the logs, exactly like a quiet week. Requiring both
 * makes a half-configured deployment fall back to no bot protection rather than
 * no enquiries.
 *
 * With neither set, verification passes and the honeypot plus server-side
 * validation carry the load. That keeps the whole flow runnable in development.
 */

const VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export const isTurnstileConfigured = (): boolean =>
  Boolean(
    process.env.TURNSTILE_SECRET_KEY &&
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  );

export async function verifyTurnstile(token: string | undefined): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  // Half-configured is treated as unconfigured. See the note above: the
  // alternative is refusing every enquiry on a site that looks fine.
  if (!secret || !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) return true;
  if (!token) return false;

  try {
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ secret, response: token }),
    });
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch (err) {
    // A verification outage must not block genuine enquiries. Log and let it
    // through: losing a real lead costs more than admitting one bot.
    console.error("Turnstile недостъпен, пропускаме проверката:", err);
    return true;
  }
}
