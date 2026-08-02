import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Admin authentication.
 *
 * One person runs this business and answers every enquiry himself, so the admin
 * has exactly one account. A password in an environment variable plus a signed
 * cookie is the right weight - an identity provider here would be ceremony.
 *
 * With no ADMIN_PASSWORD configured the admin is DISABLED rather than falling
 * back to a default. A shipped default password is worse than no admin at all.
 */

const COOKIE = "vr_admin";
const MAX_AGE_SECONDS = 60 * 60 * 12;

const secret = (): string =>
  process.env.ADMIN_SESSION_SECRET ?? process.env.ADMIN_PASSWORD ?? "";

export const isAdminConfigured = (): boolean =>
  Boolean(process.env.ADMIN_PASSWORD);

function sign(expiresAt: number): string {
  const payload = String(expiresAt);
  const mac = createHmac("sha256", secret()).update(payload).digest("hex");
  return `${payload}.${mac}`;
}

function verify(token: string | undefined): boolean {
  if (!token || !secret()) return false;

  const [payload, mac] = token.split(".");
  if (!payload || !mac) return false;

  const expected = createHmac("sha256", secret()).update(payload).digest("hex");
  const a = Buffer.from(mac, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  return Number(payload) > Date.now();
}

/** Constant-time password comparison, so timing cannot leak the length. */
export function passwordMatches(candidate: string): boolean {
  const actual = process.env.ADMIN_PASSWORD;
  if (!actual) return false;

  const a = Buffer.from(candidate);
  const b = Buffer.from(actual);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function createSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, sign(Date.now() + MAX_AGE_SECONDS * 1000), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function isSignedIn(): Promise<boolean> {
  const store = await cookies();
  return verify(store.get(COOKIE)?.value);
}
