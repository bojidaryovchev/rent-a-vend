import "server-only";

/**
 * Cloudflare Turnstile verification.
 *
 * Chosen over reCAPTCHA for EU data optics: this is a B2B site whose visitors
 * include public-sector buyers, and shipping their traffic to Google's ad
 * infrastructure to prove they are human is a poor look on a page that also
 * carries a GDPR notice.
 *
 * Without a secret key configured, verification passes and the honeypot plus
 * server-side validation carry the load. That keeps the whole flow runnable in
 * development, and the readiness report names the gap.
 */

const VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export const isTurnstileConfigured = (): boolean =>
  Boolean(process.env.TURNSTILE_SECRET_KEY);

export async function verifyTurnstile(token: string | undefined): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
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
