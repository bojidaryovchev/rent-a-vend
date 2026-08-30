import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { company } from "@/lib/company";

/**
 * The share card - what Facebook, Viber, WhatsApp and X draw when someone
 * pastes a link. In this market that is not a detail: the enquiry that matters
 * usually arrives after an office manager has forwarded the link to whoever
 * signs, and until now that forward rendered as a grey box.
 *
 * ⚠ THE MARK ALONE, DELIBERATELY, AND IT IS A NARROWING.
 *
 * This card used to carry a headline, a sub-line and two live facts read from
 * `company` - the coverage line and the response promise. It was asked to
 * become the logo instead, and the trade is worth writing down rather than
 * discovering later: a share card is the only piece of this site that gets
 * seen by people who never visit it, and it now says nothing except who we
 * are. What it buys is that it cannot go stale, cannot contradict the page it
 * is attached to, and needs no copy review in any language.
 *
 * WHY IT IS STILL GENERATED rather than pointing `og:image` at the PNG in
 * `public/`. Every logo asset here is square - the mark is 692x692, the full
 * lockup 1254x1254 - and networks centre-crop a square to 1.91:1, which eats
 * roughly a third of the height. `docs/launch.md` already records that
 * as owed work: *"A real 1200x630 OG image once the brand exists. logo.png is
 * square and will be centre-cropped by every network."* Rendering the mark
 * onto a correctly-proportioned ground is what stops that, and it costs one
 * build-time rasterisation.
 *
 * No fonts are loaded any more. The previous card needed Oswald and
 * Commissioner as real ttf files because next/og rasterises without a browser;
 * with no text there is nothing to typeset, and two font reads leave the build.
 *
 * Statically rendered at build time - no request-time APIs here - so it costs
 * nothing per share.
 */

export const alt = `${company.brandName} - вендинг машини под наем в цяла България`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/* Straight out of globals.css, converted from oklch. Values, not tokens: this
   renders outside the browser, so there is no CSS to read them from. */
const GRAPHITE_DEEP = "#1a1917";
const ACCENT = "#ffd400";

export default async function Image() {
  /* The light variant, because the ground is graphite - the mark is cream
     linework and would disappear into paper. 692px down to 340 is a downscale,
     so the linework stays crisp; `assets/og-mark.png` is the same artwork at
     256px and would have had to be enlarged. */
  const mark = await readFile(
    join(process.cwd(), "public/logo-icon-only-light.png"),
    "base64",
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: GRAPHITE_DEEP,
        }}
      >
        {/* The accent rule that closes the footer, opening the card instead.
            The one piece of the old card worth keeping: it is what makes this
            read as ours at thumbnail size rather than as a stock logo. */}
        <div style={{ display: "flex", height: 10, backgroundColor: ACCENT }} />

        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* next/image does not exist inside ImageResponse - this renders
              through satori, not the browser, and a data-URI <img> is the
              documented approach. The LCP warning does not apply to an image
              that is itself the output. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/png;base64,${mark}`}
            width={340}
            height={340}
            alt=""
          />
        </div>
      </div>
    ),
    size,
  );
}
