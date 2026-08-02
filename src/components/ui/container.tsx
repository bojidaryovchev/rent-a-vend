import { cn } from "@/lib/cn";

/**
 * One column, one width.
 *
 * 1240px with 16/24px gutters. Narrower than a typical marketing shell on
 * purpose: the catalogue is dense and the reading measure has to stay honest.
 */
export function Container({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-310 px-4 md:px-6", className)}>
      {children}
    </div>
  );
}
