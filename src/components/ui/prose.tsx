import { cn } from "@/lib/cn";

/**
 * Long-form text.
 *
 * Read mode: structure for comprehension first. Measure is held near 70
 * characters, headings carry real weight, and lists are spaced enough to scan
 * without becoming airy.
 */
export function Prose({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-[60ch] text-body-lg leading-[1.65] text-ink-muted",
        "[&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-heading-sm [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-ink",
        "[&_h3]:mt-7 [&_h3]:mb-2 [&_h3]:text-body-lg [&_h3]:font-bold [&_h3]:text-ink",
        "[&_p]:mt-4 [&_p:first-child]:mt-0",
        "[&_ul]:mt-4 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2",
        "[&_ol]:mt-4 [&_ol]:flex [&_ol]:flex-col [&_ol]:gap-2 [&_ol]:list-decimal [&_ol]:pl-5",
        "[&_li]:marker:text-ink-subtle",
        "[&_strong]:font-semibold [&_strong]:text-ink",
        "[&_a]:font-semibold [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
