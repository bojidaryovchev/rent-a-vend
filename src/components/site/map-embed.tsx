"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Google Maps, loaded on click and not before.
 *
 * The whole site is built so that it needs no consent dialog: Plausible instead
 * of GA4, no advertising pixels, nothing that profiles anyone. An embedded map
 * would end that on its own - the iframe contacts Google and sets cookies the
 * moment the page renders, and it is not strictly necessary, so under the EU
 * rules it needs consent. One map on one page would buy the whole site a banner
 * that every visitor must dismiss before they can see a price.
 *
 * So the map is a two-step: a sunken bay with the address already legible in
 * the panel around it, and a control that says plainly what pressing it does.
 * Nothing reaches Google until it is pressed. This is also exactly what the
 * cookie policy already promises - "if we add something that needs consent, we
 * will ask before loading it, not after" - which made it the only
 * implementation consistent with a page that is already published.
 *
 * The consent is per visit and deliberately not remembered. Storing it would
 * itself be the kind of state this page is avoiding, and the cost of asking
 * again is one click on the rare second visit to an about page.
 */
export function MapEmbed({
  src,
  title,
}: {
  src: string;
  /** Announced in place of the map, since an iframe has no other label. */
  title: string;
}) {
  const [loaded, setLoaded] = useState(false);

  if (loaded) {
    return (
      <iframe
        src={src}
        title={title}
        loading="lazy"
        // Google needs the origin to enforce the key restriction, nothing more.
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        className="block h-full w-full border-0"
      />
    );
  }

  // A tonal step, not a panel inside a panel: the well is sunken paper and the
  // copy sits directly on it.
  return (
    <div className="grid h-full place-items-center bg-paper-sunken px-6 py-10 text-center">
      <div className="max-w-sm">
        <p className="plate text-[11px] text-ink-muted">Картата не е заредена</p>
        <p className="mt-3 text-[14px] leading-6 text-graphite">
          Картата идва от Google и при зареждането ѝ Google поставя свои
          бисквитки. Затова я зареждаме само ако я поискате.
        </p>
        <p className="mt-2 text-[13px] leading-5 text-ink-muted">
          Адресът е изписан отдолу - за да го прочетете, картата не ви трябва.
        </p>
        {/* Outline, not accent. Safety yellow is spent on the enquiry - the
            action that earns - and a map that shouts as loudly as it is a
            hierarchy the page cannot afford. */}
        <div className="mt-5 flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setLoaded(true)}
          >
            Зареди картата
          </Button>
        </div>
      </div>
    </div>
  );
}
