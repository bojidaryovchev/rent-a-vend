import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { Recommender } from "@/components/tools/recommender";
import { toCandidates } from "@/lib/candidates";
import { toCardData } from "@/lib/card-data";
import { MODELS } from "@/content/models";
import { pageMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";

export const metadata: Metadata = pageMetadata({
  path: routes.recommender,
  title: "Коя машина е подходяща за мен?",
  description:
    "Отговорете на няколко въпроса за обекта и ще предложим подходяща вендинг машина, с ориентировъчна месечна цена. Отнема по-малко от минута.",
});

export default async function RecommenderPage() {
  const candidates = toCandidates();
  /* The recommendation is computed in the browser, so the cards it may show
     have to travel with it - the same data the catalogue grid already ships. */
  const cards = MODELS.map((m) => toCardData(m));

  return (
    <>
      <PageHeader
        eyebrow="Препоръка"
        title="Коя машина е подходяща за мен?"
        lead="Няколко въпроса за обекта и ще предложим машина с ориентировъчна месечна цена. Не питаме колко кафета се пият на ден - това го изчисляваме сами и ви показваме как."
      />

      <section className="paper-grain">
        <Container className="py-12 md:py-16">
          <Recommender candidates={candidates} cards={cards} />
        </Container>
      </section>
    </>
  );
}
