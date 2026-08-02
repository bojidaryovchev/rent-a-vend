"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Phone, X } from "lucide-react";
import { Wordmark } from "@/components/brand/wordmark";
import {
  CATEGORY_SLUGS,
  routes,
  type CategoryKey,
} from "@/lib/routes";
import { company } from "@/lib/company";
import { isUnresolved } from "@/components/ui/placeholder-value";
import { cn } from "@/lib/cn";

/**
 * Two bands.
 *
 * The steel utility strip carries the response promise on every page - five of
 * six Bulgarian competitors offer no contact form at all and none publishes a
 * response time, so one working hour in permanent view is the cheapest
 * differentiator available.
 *
 * Beneath it, a paper bar: wordmark, categories, a divider, pages, and exactly
 * one accent control.
 */

const CATEGORY_NAV: { key: CategoryKey; label: string }[] = [
  { key: "coffee", label: "Кафе" },
  { key: "snack", label: "Снакс" },
  { key: "combo", label: "Комбинирани" },
  { key: "cold", label: "Студени напитки" },
];

const PAGE_NAV = [
  { href: routes.howItWorks, label: "Как работи" },
  { href: routes.buyVsRent, label: "Наем или покупка" },
  { href: routes.about, label: "За нас" },
  { href: routes.contact, label: "Контакти" },
];

const navLink =
  "plate px-2.5 py-2 text-[11px] text-ink-muted transition-colors duration-200 hover-fine:text-graphite";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === routes.home ? pathname === href : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40">
      {/* -- utility strip ------------------------------------------------- */}
      <div className="steel border-b border-graphite-edge">
        <div className="mx-auto flex max-w-310 items-center justify-between gap-3 px-4 py-1.5 md:px-6">
          <div className="flex items-center gap-2 text-[11px] leading-4 text-paper/75">
            {/* A live indicator, in the stock tone rather than the accent: the
                accent never carries state meaning. */}
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-status-available ring-2 ring-status-available/25"
            />
            <span>{company.responsePromise}</span>
            <span aria-hidden className="hidden text-paper/35 sm:inline">
              ·
            </span>
            <span className="hidden sm:inline">{company.workingHours}</span>
          </div>

          {isUnresolved(company.phone) ? (
            /* A dashed stamp reads as "to be filled in" without leaking
               developer syntax into the element this market converts on. */
            <span className="serial flex items-center gap-1.5 border border-dashed border-paper/30 px-2 py-0.75 text-paper/70">
              <Phone className="h-3 w-3" aria-hidden />
              телефон
            </span>
          ) : (
            <a
              href={company.phoneHref}
              className="serial flex items-center gap-1.5 border border-paper/30 px-2 py-0.75 text-paper transition-colors duration-200 hover-fine:border-accent hover-fine:text-accent"
            >
              <Phone className="h-3 w-3" aria-hidden />
              {company.phone}
            </a>
          )}
        </div>
      </div>

      {/* -- main bar ------------------------------------------------------ */}
      <div className="border-b border-line bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/80">
        <div className="mx-auto flex max-w-310 items-center justify-between gap-4 px-4 py-3 md:px-6">
          <Link href={routes.home} aria-label="Начало">
            <Wordmark priority />
          </Link>

          <nav
            aria-label="Основна навигация"
            className="hidden items-center gap-1 lg:flex"
          >
            {CATEGORY_NAV.map((c) => (
              <Link
                key={c.key}
                href={routes.category(c.key)}
                aria-current={isActive(`/${CATEGORY_SLUGS[c.key]}`) ? "page" : undefined}
                className={cn(
                  navLink,
                  isActive(`/${CATEGORY_SLUGS[c.key]}`) && "text-graphite",
                )}
              >
                {c.label}
              </Link>
            ))}

            <span aria-hidden className="mx-1.5 h-4 w-px bg-line" />

            {PAGE_NAV.map((p) => (
              <Link
                key={p.href}
                href={p.href}
                aria-current={isActive(p.href) ? "page" : undefined}
                className={cn(navLink, isActive(p.href) && "text-graphite")}
              >
                {p.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href={routes.recommender}
              className="hidden min-h-11 items-center border border-graphite bg-accent px-4 text-[12px] font-semibold text-graphite shadow-[inset_0_1px_0_oklch(1_0_0/0.45),0_2px_0_var(--color-graphite)] transition-transform duration-200 hover-fine:translate-y-[1px] hover-fine:shadow-[inset_0_1px_0_oklch(1_0_0/0.45),0_1px_0_var(--color-graphite)] sm:inline-flex"
            >
              Коя машина ми трябва?
            </Link>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              className="inline-flex h-11 w-11 items-center justify-center border border-line-strong bg-paper-raised text-graphite lg:hidden"
            >
              {open ? (
                <X className="h-5 w-5" aria-hidden />
              ) : (
                <Menu className="h-5 w-5" aria-hidden />
              )}
              <span className="sr-only">
                {open ? "Затвори менюто" : "Отвори менюто"}
              </span>
            </button>
          </div>
        </div>

        {/* -- mobile drawer ---------------------------------------------- */}
        <div id="mobile-nav" className={cn("lg:hidden", open ? "block" : "hidden")}>
          <div className="border-t border-line bg-paper-sunken px-4 pt-2 pb-4">
            <ul className="grid grid-cols-2 gap-x-4">
              {[
                ...CATEGORY_NAV.map((c) => ({
                  href: routes.category(c.key),
                  label: c.label,
                })),
                ...PAGE_NAV,
              ].map((item) => (
                <li key={item.label} className="border-b border-line">
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="plate flex min-h-11 items-center text-[11px] text-graphite"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link
                href={routes.recommender}
                onClick={() => setOpen(false)}
                className="inline-flex min-h-11 items-center justify-center border border-graphite bg-accent px-3 text-center text-[12px] font-semibold text-graphite"
              >
                Коя машина ми трябва?
              </Link>
              <Link
                href={routes.enquiry}
                onClick={() => setOpen(false)}
                className="inline-flex min-h-11 items-center justify-center border border-graphite px-3 text-[12px] font-semibold text-graphite"
              >
                Запитване
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
