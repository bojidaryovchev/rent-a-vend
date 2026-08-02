import { PageHead } from "@/components/ui/bits";

/**
 * Every interior page opens on the same steel band.
 *
 * Kept as a thin wrapper so the routes that already import `PageHeader` did not
 * all have to change when the treatment did.
 */
export function PageHeader({
  eyebrow = "Вендинг под наем",
  title,
  lead,
  children,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  children?: React.ReactNode;
}) {
  return (
    <PageHead eyebrow={eyebrow} title={title} lead={lead}>
      {children}
    </PageHead>
  );
}
