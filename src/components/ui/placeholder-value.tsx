import { UNRESOLVED } from "@/lib/company";
import { cn } from "@/lib/cn";

/**
 * Renders a company field, or an honest stand-in when it is not filled in yet.
 *
 * The site has a house idiom for missing content - Bulgarian, styled, and
 * explicit about what it is ("заместващо изображение", "тук ще стои реална
 * снимка"). Leaking a raw phone marker into the header broke that idiom in the single
 * highest-trust element on a site whose competitors convert almost entirely by
 * telephone, and it reached every demo link and screenshot.
 *
 * The readiness gate still blocks launch on the same markers; this only governs
 * how they look in the meantime.
 */
export function PlaceholderValue({
  value,
  label,
  className,
}: {
  value: string;
  /** What will eventually go here, in the visitor's language. */
  label: string;
  className?: string;
}) {
  if (!UNRESOLVED.test(value)) return <>{value}</>;

  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-1.5 rounded-xs bg-ink/8 px-1.5 py-0.5 text-[0.9em] font-medium text-ink-muted",
        className,
      )}
      title="Данните на фирмата още не са попълнени"
    >
      {label}
    </span>
  );
}

/** True when a value is still an unresolved marker. */
export const isUnresolved = (value: string): boolean => UNRESOLVED.test(value);
