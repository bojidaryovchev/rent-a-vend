import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { JsonLd } from "@/components/seo/json-ld";
import { GUIDES } from "@/content/guides";
import { routes } from "@/lib/routes";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  path: routes.guides,
  title: "Ръководства за вендинг машини",
  description:
    "Разрешителни, изисквания за поставяне и регистрация в БАБХ - какво реално се иска от вас, преди и след като машината влезе в обекта.",
});

export default function GuidesPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          ["Начало", routes.home],
          ["Ръководства", routes.guides],
        ])}
      />

      <PageHeader
        eyebrow="Ръководства"
        title="Какво се иска от вас"
        lead="Разрешителни, изисквания и регистрации около вендинг машините, обяснени преди договора, а не след него. Ориентировъчно, с посочени източници и без да се преструваме, че всеки случай е еднакъв."
      />

      <section className="paper-grain">
        <Container className="py-12 md:py-16">
          <ul className="grid gap-px border border-line-strong bg-line-strong">
            {GUIDES.map((guide) => (
              <li key={guide.slug} className="bg-paper-raised">
                <Link
                  href={routes.guide(guide.slug)}
                  className="block p-6 md:p-8 hover-fine:bg-paper-sunken"
                >
                  <h2 className="max-w-2xl text-lead md:text-heading-sm">
                    {guide.title}
                  </h2>
                  <p className="mt-3 max-w-2xl text-ui leading-relaxed text-ink-muted">
                    {guide.answer}
                  </p>
                  <p className="serial mt-4 text-ink-muted">
                    Обновено {guide.updated}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
