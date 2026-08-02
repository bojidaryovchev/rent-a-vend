import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Machine buttons.
 *
 * The accent variant carries a hard 3px offset shadow in graphite and, on
 * press, travels down into it. That is the whole idea: a physical control being
 * depressed, not a rectangle changing colour. A soft blurred shadow would read
 * as a floating web card and undo the material the rest of the system is built
 * from.
 *
 * Square corners, no radius. Industrial controls have edges.
 */

type Variant = "accent" | "outline" | "ghostLight" | "solidDark";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-all duration-200 ease-[--ease-out] disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<Variant, string> = {
  accent: cn(
    "border border-graphite bg-accent text-graphite",
    "shadow-[inset_0_1px_0_oklch(1_0_0/0.45),0_3px_0_var(--color-graphite)]",
    "hover-fine:translate-y-[2px] hover-fine:shadow-[inset_0_1px_0_oklch(1_0_0/0.45),0_1px_0_var(--color-graphite)]",
    "active:translate-y-[3px] active:shadow-[inset_0_1px_0_oklch(1_0_0/0.45),0_0_0_var(--color-graphite)]",
  ),
  outline: cn(
    "border border-graphite bg-transparent text-graphite",
    "hover-fine:bg-graphite hover-fine:text-paper",
  ),
  /* On a steel ground: an outline that warms to the accent rather than filling. */
  ghostLight: cn(
    "border border-paper/35 text-paper",
    "hover-fine:border-accent hover-fine:text-accent",
  ),
  solidDark: cn(
    "border border-graphite bg-graphite text-paper",
    "hover-fine:bg-graphite-soft",
  ),
};

const sizes: Record<Size, string> = {
  sm: "min-h-9 px-3 text-[12px]",
  md: "min-h-11 px-5 text-[13px]",
  lg: "min-h-12 px-6 text-[14px]",
};

/**
 * The class recipe on its own.
 *
 * Exported so plain anchors - `tel:`, `https://wa.me/...`, `viber://` - can
 * carry identical geometry without being forced through next/link, which is
 * built for in-app routes and not for protocol handlers.
 */
export function buttonClasses(
  variant: Variant = "accent",
  size: Size = "md",
  className?: string,
) {
  return cn(base, variants[variant], sizes[size], className);
}

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}

export function Button({
  variant = "accent",
  size = "md",
  className,
  children,
  ...props
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "accent",
  size = "md",
  className,
  children,
  ...props
}: CommonProps &
  Omit<React.ComponentProps<typeof Link>, "className" | "children">) {
  return (
    <Link
      href={href}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </Link>
  );
}
