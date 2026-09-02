"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

/**
 * Cloudflare Turnstile, the browser half.
 *
 * Chosen over reCAPTCHA for EU data optics - see `src/server/turnstile.ts`,
 * which is the half that decides whether a submission is accepted.
 *
 * The two halves are gated on the SAME pair of variables, and that is the point
 * of this file existing. A secret key with no site key means no widget, so no
 * token, so - if the server gated on the secret alone - every enquiry would be
 * refused with "not human" and nobody would find out until the leads stopped.
 * Both variables, or neither.
 */

/**
 * Read as a literal `process.env.NAME` expression because that is the only form
 * Next inlines into the browser bundle. Behind a helper it resolves to
 * `undefined` at runtime and the widget silently never renders.
 */
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/** Whether a widget will be rendered at all. */
export const turnstileEnabled = Boolean(SITE_KEY);

interface TurnstileApi {
  render(
    element: HTMLElement,
    options: {
      sitekey: string;
      language?: string;
      callback?: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
    },
  ): string;
  reset(widgetId?: string): void;
  remove(widgetId?: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/**
 * Throw away the spent token and ask for a fresh one.
 *
 * Turnstile tokens are single-use. Without this, a submission rejected for any
 * reason - a validation error, a database hiccup - fails a second time on a
 * token Cloudflare has already redeemed, and the visitor is told they are a bot
 * for retrying.
 */
export function resetTurnstile(): void {
  if (typeof window !== "undefined") window.turnstile?.reset();
}

export function Turnstile({
  onToken,
  language,
}: {
  onToken: (token: string) => void;
  /** Passed to Cloudflare so the challenge speaks the page's language. */
  language?: string;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [ready, setReady] = useState(false);

  /* The callback is held in a ref rather than a dependency: the form re-renders
     on every keystroke, and a dependency would tear the widget down and rebuild
     it each time, discarding a token the visitor has already earned.

     Kept current in an effect rather than assigned during render, which is a
     write to a value React is allowed to reuse across attempts. */
  const latest = useRef(onToken);
  useEffect(() => {
    latest.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!SITE_KEY || !ready) return;
    const api = window.turnstile;
    const element = holder.current;
    if (!api || !element || widgetId.current) return;

    widgetId.current = api.render(element, {
      sitekey: SITE_KEY,
      language,
      callback: (token) => latest.current(token),
      /* A token expires after five minutes on a form somebody left open.
         Clearing it is the honest move: the server refuses the submission and
         says so, rather than sending a token Cloudflare will not accept. */
      "expired-callback": () => latest.current(""),
      "error-callback": () => latest.current(""),
    });

    return () => {
      if (widgetId.current) {
        api.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [ready, language]);

  // No site key: render nothing at all, so a form with no bot protection looks
  // like a form with no bot protection rather than a broken widget.
  if (!SITE_KEY) return null;

  return (
    <div>
      <Script
        id="cf-turnstile"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        /* `onReady` rather than `onLoad`: it also fires when the script is
           already in the document, which is what happens on every client-side
           navigation back to a page carrying the form. */
        onReady={() => setReady(true)}
      />
      <div ref={holder} />
    </div>
  );
}
