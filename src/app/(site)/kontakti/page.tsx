import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";
import { company } from "@/lib/company";
import { PlaceholderValue, isUnresolved } from "@/components/ui/placeholder-value";
import { ContactChannels } from "@/components/site/contact-channels";

export const metadata: Metadata = pageMetadata({
  path: routes.contact,
  title: "Контакти",
  description:
    "Телефон, имейл и форма за запитване. Отговаряме до един работен час, понеделник до петък, 09:00 - 18:00.",
});

export default function ContactPage() {
  /* `href` marks a row that is an affordance rather than a fact. The phone
     channels live in ContactChannels above; email is the one reachable address
     left in the table, and printing it as plain text asked the visitor to
     select and copy it by hand. */
  const rows: { label: string; value: string; href?: string }[] = [
    { label: "Лице за контакт", value: company.contactPerson },
    { label: "Имейл", value: company.email, href: company.emailHref },
    { label: "Работно време", value: company.workingHours },
    { label: "Покритие", value: company.coverage },
    { label: "Фирма", value: company.legalName },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Контакти"
        title="Контакти"
        lead="Обадете се или пишете. Запитванията се обработват лично, не от кол център."
      />

      <section className="paper-grain">
        <Container className="grid gap-8 py-14 md:py-20 lg:grid-cols-2 lg:items-start">
          <div>
            {/* Above the details table on purpose: the fastest way to reach a
                supplier in this market is to press the number, not to read a
                row labelled "телефон". */}
            <h2 className="plate text-[11px] text-ink-subtle">Обадете се или пишете</h2>
            <ContactChannels className="mt-3" />
            <p className="mt-3 text-[13px] leading-6 text-ink-subtle">
              WhatsApp и Viber водят до същия телефон. {company.outOfHoursNote}
            </p>

            <dl className="bay-panel riveted mt-8 divide-y divide-line pt-3">
              {rows.map(({ label, value, href }) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-4 px-5 py-2"
                >
                  <dt className="plate text-[10px] text-ink-muted">{label}</dt>
                  {/* Padding plus a 44px minimum, not a fixed height: the
                      linked row has to be thumb-sized on a phone, and the rest
                      match it so the table does not step. */}
                  <dd className="flex min-h-11 items-center justify-end text-right text-[14px] text-graphite">
                    {href && !isUnresolved(value) ? (
                      <a
                        href={href}
                        className="inline-flex items-center gap-2 underline decoration-line-strong underline-offset-4 transition-colors duration-200 hover-fine:decoration-graphite"
                      >
                        <Mail
                          className="h-3.5 w-3.5 shrink-0 text-ink-muted"
                          aria-hidden
                        />
                        {value}
                      </a>
                    ) : (
                      <PlaceholderValue value={value} label={label.toLowerCase()} />
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="bay-panel-dark riveted p-7 pt-9">
            <h2 className="text-[26px] text-paper">Изпратете запитване</h2>
            <p className="mt-3 text-[14px] leading-7 text-paper/70">
              Четири полета. Ще се свържем с конкретна машина и цена.
            </p>
            <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-paper/70">
              <span className="serial border border-accent/50 px-2 py-1 text-accent">
                {company.responsePromise}
              </span>
              <span>{company.outOfHoursNote}</span>
            </p>
            <div className="mt-7">
              <ButtonLink href={routes.enquiry}>Изпрати запитване</ButtonLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
