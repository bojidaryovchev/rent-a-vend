import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { GUIDES, guideBySlug } from "@/content/guides";
import { routes } from "@/lib/routes";
import {
  articleJsonLd,
  breadcrumbJsonLd,
  guideFaqJsonLd,
  pageMetadata,
} from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata(
  props: PageProps<"/rakovodstva/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const guide = guideBySlug(slug);
  if (!guide) return {};

  return pageMetadata({
    path: routes.guide(guide.slug),
    title: guide.title,
    description: guide.description,
    /* The titles are the queries verbatim and already run long. */
    brandSuffix: false,
  });
}

export default async function GuidePage(props: PageProps<"/rakovodstva/[slug]">) {
  const { slug } = await props.params;
  const guide = guideBySlug(slug);
  if (!guide) notFound();

  return (
    <>
      <JsonLd data={articleJsonLd(guide)} />
      <JsonLd data={guideFaqJsonLd(guide)} />
      <JsonLd
        data={breadcrumbJsonLd([
          ["Начало", routes.home],
          ["Ръководства", routes.guides],
          [guide.title, routes.guide(guide.slug)],
        ])}
      />

      <Container className="py-4">
        <nav
          aria-label="Пътека"
          className="serial flex flex-wrap items-center gap-1.5 text-ink-muted"
        >
          <Link href={routes.home} className="hover-fine:text-graphite">
            Начало
          </Link>
          <ChevronRight className="h-3 w-3" aria-hidden />
          <Link href={routes.guides} className="hover-fine:text-graphite">
            Ръководства
          </Link>
        </nav>
      </Container>

      <article>
        <Container className="pt-6 pb-12">
          <h1 className="max-w-3xl text-heading md:text-display-sm">
            {guide.title}
          </h1>

          {/* The answer, standing alone and first. AI Overviews appear on four
              of the six queries sampled and this is the passage they cite. */}
          <p className="mt-6 max-w-3xl border-l-2 border-accent pl-4 text-body-lg leading-relaxed text-graphite">
            {guide.answer}
          </p>

          <p className="serial mt-6 text-ink-muted">
            Обновено {guide.updated}
          </p>
        </Container>

        <div className="paper-grain border-y border-line">
          <Container className="py-12 md:py-16">
            {guide.sections.map((section) => (
              <section key={section.heading} className="mt-10 first:mt-0">
                <h2 className="max-w-2xl text-heading-sm md:text-heading">
                  {section.heading}
                </h2>
                {section.body.map((p) => (
                  <p
                    key={p.slice(0, 40)}
                    className="mt-4 max-w-2xl text-ui leading-relaxed text-ink-muted"
                  >
                    {p}
                  </p>
                ))}
                {section.list && (
                  <ul className="mt-4 max-w-2xl space-y-2">
                    {section.list.map((item) => (
                      <li
                        key={item.slice(0, 40)}
                        className="border-b border-line pb-2 pl-4 text-ui leading-relaxed text-ink-muted last:border-0 -indent-4 before:mr-2 before:text-accent before:content-['—']"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </Container>
        </div>

        <Container className="py-12 md:py-16">
          <h2 className="text-heading-sm md:text-heading">
            Често задавани въпроси
          </h2>
          <dl className="mt-6 max-w-2xl">
            {guide.faq.map((item) => (
              <div key={item.question} className="border-b border-line py-5">
                <dt className="text-ui leading-relaxed text-graphite">
                  {item.question}
                </dt>
                <dd className="mt-2 text-ui leading-relaxed text-ink-muted">
                  {item.answer}
                </dd>
              </div>
            ))}
          </dl>

          {/* Exactly one route out, into the commercial layer. */}
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href={guide.cta.href}>{guide.cta.label}</ButtonLink>
            <ButtonLink href={routes.enquiry} variant="outline">
              Изпрати запитване
            </ButtonLink>
          </div>

          <p className="mt-8 max-w-2xl border-l-2 border-line-strong pl-4 text-ui-sm leading-relaxed text-ink-muted">
            Текстът е ориентировъчен и описва общия ред към датата на обновяване.
            Конкретният случай може да се различава - за обвързващ отговор се
            обърнете към съответната община или областна дирекция по безопасност
            на храните.
          </p>
        </Container>
      </article>
    </>
  );
}
