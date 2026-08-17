import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { CATEGORY_LABELS, routes, type CategoryKey } from "@/lib/routes";
import { company, UNRESOLVED } from "@/lib/company";
import {
  FAMILY_LABELS,
  FAMILY_LANG,
  FAMILY_LONG,
  OTHER_SITES,
  SITE_LOCALE,
  familyHref,
} from "@/lib/family";
import { ContactChannels } from "@/components/site/contact-channels";

const CATEGORY_KEYS: CategoryKey[] = ["coffee", "snack", "combo", "cold"];

/** Unfilled company fields, shown as dashed stamps rather than raw markers. */
const PENDING_FIELDS: [string, string][] = [
  ["телефон", company.phone],
  ["имейл", company.email],
  ["наименование на фирмата", company.legalName],
  ["ЕИК", company.eik],
  ["ДДС номер", company.vatNumber],
  ["име на марката", company.brandName],
];

function FooterCol({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="stencil border-b border-paper/15 pb-2 text-[11px] text-accent">
        {title}
      </h2>
      <ul className="mt-3 space-y-1">{children}</ul>
    </div>
  );
}

function FooterLink({
  href,
  external = false,
  hrefLang,
  children,
}: {
  href: string;
  /** Cross-domain links get a plain anchor - there is no route to prefetch. */
  external?: boolean;
  /** Set only for a destination with one language. See `FAMILY_LANG`. */
  hrefLang?: string;
  children: string;
}) {
  const className =
    "flex min-h-9 items-center text-[13px] text-paper/75 transition-colors duration-200 hover-fine:text-accent";

  return (
    <li>
      {external ? (
        <a href={href} hrefLang={hrefLang} rel="noopener" className={className}>
          {children}
        </a>
      ) : (
        <Link href={href} className={className}>
          {children}
        </Link>
      )}
    </li>
  );
}

export function SiteFooter() {
  return (
    /* The accent rule along the top edge is the one place the brand colour is
       used structurally rather than as an action. It closes the page the way a
       painted line closes a workshop bay. */
    <footer className="steel mt-24 border-t-2 border-accent/80">
      <div className="mx-auto max-w-310 px-4 py-14 md:px-6">
        {/* Five columns since D51 put the other two sites here. The nav columns
            lose ~40px each at `lg`, which they can afford - the family column's
            lines wrap to two, which is what sell-a-vend's has always done. */}
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <div>
            <Wordmark tone="light" />
            <p className="mt-5 max-w-xs text-[13px] leading-6 text-paper/70">
              Вендинг машини под наем в цяла България. Реални машини от нашия
              склад, с ясна месечна цена и включен сервиз.
            </p>

            <ContactChannels ground="dark" size="sm" className="mt-6" />

            <div className="mt-5 flex flex-wrap gap-1.5">
              {PENDING_FIELDS.filter(([, value]) => UNRESOLVED.test(value)).map(
                ([label]) => (
                  <span
                    key={label}
                    className="serial border border-dashed border-paper/25 px-2 py-0.75 text-paper/75"
                  >
                    {label}
                  </span>
                ),
              )}
            </div>
          </div>

          <FooterCol title="Машини">
            {CATEGORY_KEYS.map((key) => (
              <FooterLink key={key} href={routes.category(key)}>
                {CATEGORY_LABELS[key]}
              </FooterLink>
            ))}
          </FooterCol>

          <FooterCol title="Наемът">
            <FooterLink href={routes.howItWorks}>Как протича наемът</FooterLink>
            <FooterLink href={routes.recommender}>
              Коя машина ми трябва
            </FooterLink>
            <FooterLink href={routes.pricing}>Цени</FooterLink>
            <FooterLink href={routes.guides}>Ръководства</FooterLink>
            <FooterLink href={routes.buyVsRent}>Наем или покупка</FooterLink>
            <FooterLink href={routes.caseStudies}>Казуси</FooterLink>
            <FooterLink href={routes.faq}>Често задавани въпроси</FooterLink>
          </FooterCol>

          <FooterCol title="Фирмата">
            <FooterLink href={routes.about}>За нас</FooterLink>
            <FooterLink href={routes.contact}>Контакти</FooterLink>
            <FooterLink href={routes.legal.rental}>Условия за наем</FooterLink>
            <FooterLink href={routes.legal.terms}>Общи условия</FooterLink>
            <FooterLink href={routes.legal.privacy}>Поверителност</FooterLink>
            <FooterLink href={routes.legal.cookies}>Бисквитки</FooterLink>
          </FooterCol>

          {/* D51: three domains, one company. A visitor weighing rental against
              ownership is on the wrong site half the time by definition, and an
              operator who has just been paid for a retiring fleet is the most
              plausible renter of a replacement there is. The header carries the
              same three as one-word verbs; here there is room to name the
              market, which is the part that says what language will answer. */}
          <FooterCol title={FAMILY_LABELS.heading}>
            {OTHER_SITES.map((site) => (
              <FooterLink
                key={site}
                href={familyHref(site, SITE_LOCALE)}
                hrefLang={FAMILY_LANG[site]}
                external
              >
                {FAMILY_LONG[site]}
              </FooterLink>
            ))}
          </FooterCol>
        </div>

        {/* Trader identification. The E-Commerce Act wants it easily, directly
            and permanently accessible, and a line in the footer is the cheapest
            way to mean that literally. */}
        <div className="mt-12 flex flex-col gap-2 border-t border-paper/12 pt-5 text-[12px] text-paper/75 sm:flex-row sm:items-center sm:justify-between">
          <span className="tabular">
            {company.legalName}, ЕИК {company.eik}, {company.registeredOffice}
          </span>
          <span className="tabular">Всички цени са в евро, без ДДС. © 2026</span>
        </div>
      </div>
    </footer>
  );
}
