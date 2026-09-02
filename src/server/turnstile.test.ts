import { afterEach, describe, expect, it, vi } from "vitest";
import { isTurnstileConfigured, verifyTurnstile } from "./turnstile";

/**
 * The rule this file guards: verification needs BOTH halves.
 *
 * For a long time it needed only the secret. Since no widget was ever rendered,
 * no token could exist, so setting `TURNSTILE_SECRET_KEY` in the hosting
 * dashboard - which the launch checklist told you to do - refused every enquiry
 * with "not human" on a site that otherwise looked perfectly healthy. The
 * second test below is the one that would have caught it.
 */

const SITE = "NEXT_PUBLIC_TURNSTILE_SITE_KEY";
const SECRET = "TURNSTILE_SECRET_KEY";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const respondWith = (success: boolean) =>
  vi.fn().mockResolvedValue({ json: async () => ({ success }) });

describe("verifyTurnstile", () => {
  it("passes when neither key is configured", async () => {
    vi.stubEnv(SITE, "");
    vi.stubEnv(SECRET, "");
    await expect(verifyTurnstile(undefined)).resolves.toBe(true);
  });

  it("passes when only the secret is set, because no widget can produce a token", async () => {
    vi.stubEnv(SITE, "");
    vi.stubEnv(SECRET, "0x-secret");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await expect(verifyTurnstile(undefined)).resolves.toBe(true);
    // Not merely allowed - not even asked about. There is nothing to ask.
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("passes when only the site key is set", async () => {
    vi.stubEnv(SITE, "1x-site");
    vi.stubEnv(SECRET, "");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await expect(verifyTurnstile("a-token")).resolves.toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("refuses a missing token once both keys are set", async () => {
    vi.stubEnv(SITE, "1x-site");
    vi.stubEnv(SECRET, "0x-secret");

    await expect(verifyTurnstile(undefined)).resolves.toBe(false);
    await expect(verifyTurnstile("")).resolves.toBe(false);
  });

  it("accepts a token Cloudflare confirms", async () => {
    vi.stubEnv(SITE, "1x-site");
    vi.stubEnv(SECRET, "0x-secret");
    vi.stubGlobal("fetch", respondWith(true));

    await expect(verifyTurnstile("good-token")).resolves.toBe(true);
  });

  it("rejects a token Cloudflare refuses", async () => {
    vi.stubEnv(SITE, "1x-site");
    vi.stubEnv(SECRET, "0x-secret");
    vi.stubGlobal("fetch", respondWith(false));

    await expect(verifyTurnstile("stale-token")).resolves.toBe(false);
  });

  it("lets the enquiry through when Cloudflare is unreachable", async () => {
    // Deliberate: losing a real lead costs more than admitting one bot.
    vi.stubEnv(SITE, "1x-site");
    vi.stubEnv(SECRET, "0x-secret");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(verifyTurnstile("good-token")).resolves.toBe(true);
  });
});

describe("isTurnstileConfigured", () => {
  it("is true only when both halves are present", () => {
    vi.stubEnv(SITE, "1x-site");
    vi.stubEnv(SECRET, "0x-secret");
    expect(isTurnstileConfigured()).toBe(true);

    vi.stubEnv(SECRET, "");
    expect(isTurnstileConfigured()).toBe(false);

    vi.stubEnv(SITE, "");
    vi.stubEnv(SECRET, "0x-secret");
    expect(isTurnstileConfigured()).toBe(false);
  });
});
