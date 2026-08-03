import { Section, Text } from "@react-email/components";
import { MailShell, palette } from "./theme";

/**
 * A reply written in the admin panel.
 *
 * Deliberately the plainest of the three templates. The other two are
 * generated notices and can afford structure; this one carries a sentence a
 * person typed, and wrapping that in cards and labelled rows would make a
 * human answer look like an automated one - which is the opposite of what a
 * one-man company selling on personal service wants.
 *
 * So the branding is entirely in the frame: letterhead above, contact details
 * below, and the message itself set as a letter. The plain-text twin carries
 * the same details as a signature block, because a text part has no frame.
 */
export function Reply({ body }: { body: string }) {
  return (
    <MailShell preview={body.slice(0, 120)}>
      <Section style={{ padding: "28px 24px" }}>
        <Text
          style={{
            margin: 0,
            fontSize: "15px",
            lineHeight: "24px",
            color: palette.ink,
            /* The reply is typed in a textarea, so its line breaks are the
               author's and have to survive into the message. */
            whiteSpace: "pre-wrap",
          }}
        >
          {body}
        </Text>
      </Section>
    </MailShell>
  );
}

export default Reply;
