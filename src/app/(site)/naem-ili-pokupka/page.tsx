import type { Metadata } from "next";
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { BuyVsRentCalculator } from "@/components/tools/buy-vs-rent";

/**
 * The highest-leverage page on the site, and the reason is not obvious.
 *
 * `вендинг машини` is 2,900/mo - ten times the entire rental market - but it is
 * mostly *purchase* intent, and D11 puts sales on a separate site, so we cannot
 * serve it directly. This page is where that demand converts: it meets someone
 * costing up a purchase and shows them the rental arithmetic honestly. It is
 * also the cleanest gap found in either research pass - the vending
 * rent-versus-buy question has no specialist incumbent in Bulgarian at all.
 * `docs/seo.md` §7.
 */
export const metadata: Metadata = pageMetadata({
  path: routes.buyVsRent,
  title: "Вендинг машина: наем или покупка — честно сравнение",
  description:
    "Сравнете реалната цена на покупка и наем за 3, 5, 8 или 10 години - сервиз, ремонти, лихва и остатъчна стойност. Сметка, която понякога казва да купите.",
  brandSuffix: false,
});

export default function BuyVsRentPage() {
  return (
    <>
      <PageHeader
        eyebrow="Сравнение"
        title="Наем или покупка?"
        lead="Въведете вашите числа и вижте реалното сравнение. Калкулаторът не е нагласен да показва, че наемът винаги печели - при дълъг период често не е така, и ви го казваме."
      />

      <section className="py-12">
        <Container>
          <BuyVsRentCalculator />
        </Container>
      </section>
    </>
  );
}
