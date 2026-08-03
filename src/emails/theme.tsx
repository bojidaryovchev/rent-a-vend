import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { company } from "@/lib/company";

/**
 * The letterhead, and the one place the email palette is written down.
 *
 * Email is a hostile rendering target: no external stylesheet, no custom
 * properties, no webfonts worth relying on. So the design system cannot be
 * imported here the way a component imports a Tailwind class - it has to be
 * restated as literal hex and inline styles.
 *
 * Restated ONCE. Each template used to carry its own four colour constants,
 * and they had already drifted from `globals.css`: ink was #2a2825 against a
 * real #232220, the hairline was two steps too light. Nobody would ever catch
 * that by eye across three files, which is exactly why it belongs in one.
 *
 * The values below are the OKLCH tokens from src/app/globals.css converted to
 * sRGB. If a token moves there, it moves here, and the comment beside each
 * text colour carries its measured contrast per the design system's Measured
 * Contrast Rule.
 */

/* -- palette: globals.css, converted ---------------------------------------- */

export const palette = {
  /** --color-graphite. The structural bands: letterhead and rules. */
  graphite: "#232220",
  /** --color-ink. 15.9:1 on white, 14.2:1 on sunken. Body copy. */
  ink: "#232220",
  /** --color-ink-muted. 7.1:1 on white, 6.3:1 on sunken. Secondary text. */
  muted: "#5c5852",
  /**
   * --color-ink-subtle. 4.8:1 on white - but only 4.3:1 on sunken, which is
   * under AA. Meta on white only; the footer sits on sunken and uses `muted`.
   */
  subtle: "#7a7168",
  /** --color-line. Hairlines, card edges. */
  line: "#d6d2c9",
  /** --color-paper. The area around the sheet. */
  paper: "#faf9f7",
  /** --color-paper-raised. The sheet itself. */
  sheet: "#ffffff",
  /** --color-paper-sunken. The footer well. */
  sunken: "#f5f2ec",
  /** --color-accent. Safety yellow: signage only, never text on paper. */
  accent: "#ffd400",
  /** --color-accent-ink. 12.3:1 on accent. */
  accentInk: "#1a1917",
} as const;

/* -- type ------------------------------------------------------------------- */

/**
 * The body register. Commissioner is a webfont and will not arrive, so this is
 * the closest humanist stack a mail client actually has.
 */
export const bodyFont = "-apple-system, Segoe UI, Roboto, Arial, sans-serif";

/**
 * The `plate` register: condensed, letterspaced, uppercase - the stamped
 * lettering the site uses for wordmarks and section labels. Oswald will not
 * load either, so the fallback leads with the one condensed face that is
 * actually installed on most machines. Where even that is missing it degrades
 * to letterspaced Arial, which still reads as a plate rather than as a
 * sentence.
 */
export const plateFont = "Oswald, 'Arial Narrow', Arial Nova Condensed, Arial, sans-serif";

/** Uppercase eyebrow. Labels of a few words only - never a sentence. */
export const eyebrowStyle = {
  margin: 0,
  fontSize: "11px",
  lineHeight: "16px",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  fontWeight: 700,
} as const;

/* -- the shell -------------------------------------------------------------- */

/**
 * Graphite band, safety-yellow rule, sheet, footer well.
 *
 * The yellow rule is signage, not a call to action - it is the machine-label
 * stripe the site uses along its structural edges, and it is the reason a
 * message reads as ours from the preview pane before a word is read.
 */
export function MailShell({
  preview,
  children,
  /** Sits above the letterhead in the client's preview line. */
  lang = "bg",
}: {
  preview: string;
  children: React.ReactNode;
  lang?: string;
}) {
  return (
    <Html lang={lang}>
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: palette.paper,
          fontFamily: bodyFont,
          margin: 0,
          padding: "24px 0",
        }}
      >
        <Container
          style={{
            maxWidth: "560px",
            margin: "0 auto",
            backgroundColor: palette.sheet,
            border: `1px solid ${palette.line}`,
          }}
        >
          {/* The safety-yellow stripe is a BORDER on the letterhead, not a band
              of its own. A band would be an empty table cell holding itself
              open on padding, which Outlook is entitled to collapse to nothing;
              the alternative fix is a filler character at a font size that is
              not on the type ramp. A border cannot collapse and needs neither. */}
          <Section
            style={{
              backgroundColor: palette.graphite,
              borderBottom: `4px solid ${palette.accent}`,
              padding: "16px 24px",
            }}
          >
            <Text
              style={{
                ...eyebrowStyle,
                fontFamily: plateFont,
                fontSize: "16px",
                lineHeight: "22px",
                letterSpacing: "0.18em",
                color: palette.sheet,
              }}
            >
              {company.brandName}
            </Text>
          </Section>

          {children}

          <MailFooter />
        </Container>
      </Body>
    </Html>
  );
}

/** Who wrote, and every way to answer. The same three facts as the site footer. */
export function MailFooter() {
  return (
    <Section
      style={{
        borderTop: `1px solid ${palette.line}`,
        backgroundColor: palette.sunken,
        padding: "16px 24px",
      }}
    >
      <Text
        style={{
          ...eyebrowStyle,
          fontFamily: plateFont,
          fontSize: "13px",
          letterSpacing: "0.16em",
          color: palette.ink,
        }}
      >
        {company.brandName}
      </Text>
      <Text
        style={{
          margin: "6px 0 0",
          fontSize: "13px",
          lineHeight: "20px",
          color: palette.muted,
          /* Tabular, so the number reads as a figure rather than as words. */
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {company.phone} · {company.email}
        <br />
        {company.workingHours}
      </Text>
    </Section>
  );
}

/** Section label inside the sheet. */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <Text style={{ ...eyebrowStyle, color: palette.muted }}>{children}</Text>;
}
