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
 * Generated rather than exported as a flat file, so it is built from the same
 * `company` values as the pages. A share card that still shows last quarter's
 * promise is worse than none, because it is the version that gets forwarded.
 *
 * Statically rendered at build time - no request-time APIs here - so it costs
 * nothing per share.
 *
 * The fonts are real files in `assets/fonts/` because next/og rasterises with
 * no browser and no system fonts: it reads ttf, otf or woff only, and the
 * woff2 that next/font serves the site is not one of them. Latin and Cyrillic
 * subsets both, since the card sets a Latin wordmark over Bulgarian copy.
 */

export const alt = `${company.brandName} - вендинг машини под наем в цяла България`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/* Straight out of globals.css, converted from oklch. Values, not tokens: this
   renders outside the browser, so there is no CSS to read them from. */
const PAPER = "#faf9f7";
const GRAPHITE_DEEP = "#1a1917";
const GRAPHITE_EDGE = "#3d3a36";
const ACCENT = "#ffd400";

export default async function Image() {
  const [oswald, commissioner, mark] = await Promise.all([
    readFile(join(process.cwd(), "assets/fonts/Oswald-Medium.ttf")),
    readFile(join(process.cwd(), "assets/fonts/Commissioner-Regular.ttf")),
    readFile(join(process.cwd(), "assets/og-mark.png"), "base64"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: GRAPHITE_DEEP,
          fontFamily: "Commissioner",
        }}
      >
        {/* The accent rule that closes the footer, opening the card instead. */}
        <div style={{ display: "flex", height: 10, backgroundColor: ACCENT }} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
            padding: "56px 64px 52px",
          }}
        >
          {/* -- the lockup, same order as the header ---------------------- */}
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <img
              src={`data:image/png;base64,${mark}`}
              width={92}
              height={92}
              alt=""
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  fontFamily: "Oswald",
                  fontSize: 40,
                  letterSpacing: "0.14em",
                  color: PAPER,
                  lineHeight: 1,
                }}
              >
                {company.brandName.toUpperCase()}
              </div>
              <div
                style={{
                  fontFamily: "Oswald",
                  fontSize: 18,
                  letterSpacing: "0.22em",
                  color: ACCENT,
                  marginTop: 10,
                  lineHeight: 1,
                }}
              >
                ВЕНДИНГ МАШИНИ ПОД НАЕМ
              </div>
            </div>
          </div>

          {/* -- the claim ------------------------------------------------- */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontFamily: "Oswald",
                fontSize: 62,
                letterSpacing: "0.01em",
                color: PAPER,
                lineHeight: 1.12,
                maxWidth: 940,
              }}
            >
              КАФЕ, СНАКС И КОМБИНИРАНИ МАШИНИ ПОД НАЕМ
            </div>
            <div
              style={{
                fontSize: 27,
                color: "rgba(250, 249, 247, 0.72)",
                marginTop: 22,
                maxWidth: 880,
                lineHeight: 1.4,
              }}
            >
              Реални машини от нашия склад, с ясна месечна цена и включен
              сервиз.
            </div>
          </div>

          {/* -- what the site actually promises, from the same source the
                 pages read ------------------------------------------------ */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              borderTop: `1px solid ${GRAPHITE_EDGE}`,
              paddingTop: 24,
            }}
          >
            {[company.coverage, company.responsePromise].map((line, i) => (
              <div key={line} style={{ display: "flex", alignItems: "center", gap: 20 }}>
                {i > 0 && (
                  <div
                    style={{
                      display: "flex",
                      width: 5,
                      height: 5,
                      backgroundColor: ACCENT,
                    }}
                  />
                )}
                <div style={{ fontSize: 23, color: "rgba(250, 249, 247, 0.78)" }}>
                  {line}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Oswald", data: oswald, style: "normal", weight: 500 },
        { name: "Commissioner", data: commissioner, style: "normal", weight: 400 },
      ],
    },
  );
}
