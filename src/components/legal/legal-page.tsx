import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { Prose } from "@/components/ui/prose";
import { company, hasUnresolvedCompanyFields } from "@/lib/company";

/**
 * Shared shell for the legal pages.
 *
 * Warns in place while the company details are still unresolved placeholder
 * markers, so a half-filled privacy notice cannot quietly go live.
 * `npm run readiness` fails on the same markers.
 */
export function LegalPage({
  title,
  lead,
  updated,
  children,
}: {
  title: string;
  lead?: string;
  updated: string;
  children: React.ReactNode;
}) {
  const unresolved = hasUnresolvedCompanyFields();

  return (
    <>
      <PageHeader title={title} lead={lead} />

      <section className="py-14">
        <Container>
          {unresolved && (
            <p
              role="status"
              className="mb-8 max-w-[60ch] rounded-md border border-danger bg-danger-bg px-4 py-3 text-ui text-danger"
            >
              <strong className="font-bold">Незавършен документ.</strong> Данните
              на фирмата още не са попълнени. Този текст е образец и трябва да
              бъде прегледан от юрист, преди сайтът да бъде публикуван.
            </p>
          )}

          <Prose>{children}</Prose>

          <p className="mt-10 max-w-[60ch] text-sm text-ink-subtle">
            Последна актуализация: {updated}. Документът се отнася за{" "}
            {company.legalName}, ЕИК {company.eik}, {company.registeredOffice}.
          </p>
        </Container>
      </section>
    </>
  );
}
