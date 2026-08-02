import { modelBySlug } from "./models";

/**
 * Real projects, or nothing.
 *
 * PRODUCT.md is explicit: a case study may describe a genuine delivery, sale or
 * service job as exactly what it was, with the customer's consent, anonymised
 * as far as that consent requires. Invented customers are not an option, and
 * neither are numbers we cannot stand behind - no "saved 40%", no revenue
 * figures, no headcounts nobody counted.
 *
 * So an entry carries only what the project actually produced: the problem in
 * the customer's words, the machine that was installed, and what changed. Any
 * detail the customer has not agreed to publish stays `null` and simply does
 * not render.
 */

export interface CaseStudy {
  /** Stable id. Also the anchor, so a case can be linked to directly. */
  slug: string;
  /** What a reader recognises themselves in - never a customer name. */
  title: string;
  /**
   * Anonymised description of the site, as specific as consent allows:
   * "производствено предприятие в Пловдив" and no more. `null` until the
   * customer agrees to one - an invented venue is an invented customer.
   */
  venue: string | null;
  /**
   * The machine as delivered, including variants outside the catalogue. `null`
   * where the project was not about one machine - the ten-machine site is about
   * who operates them, and naming a single model there would misdescribe it.
   */
  machine: string | null;
  /** Catalogue model the delivered machine belongs to, when there is one. */
  modelSlug: string | null;
  /** Shown after the machine line when the delivered unit differs from it. */
  machineNote: string | null;
  problem: string;
  solution: string;
  result: string;
}

/** Order is editorial and set by the client: strongest project first. */
export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: "zavod-sobstveno-upravlenie",
    title: "Десет машини под собствено управление",
    venue: "Завод с 10 вендинг машини на обекта",
    machine: null,
    modelSlug: null,
    machineNote: null,
    problem:
      "Заводът разполагаше с 10 вендинг машини, обслужвани от външен оператор. Честите проблеми със зареждането и обслужването водеха до недоволство сред служителите, а предприятието не получаваше директна полза от продажбите.",
    solution:
      "Предложихме модел със собствено управление на вендинг услугата. Клиентът назначи един служител, който отговаря за зареждането и ежедневното обслужване на всички машини. Ние осигурихме вендинг оборудването, резервните части и техническата поддръжка при необходимост.",
    result:
      "Предприятието започна да задържа цялата печалба от продажбите, качеството на обслужване значително се подобри, а проблемите с незаредени или неработещи машини бяха сведени до минимум. Един служител успешно управлява всички 10 машини, превръщайки вендинг услугата в допълнителен източник на приходи за компанията.",
  },
  {
    slug: "zurna-i-kapsuli-v-edna-mashina",
    title: "Две предпочитания в екипа, една машина",
    venue: null,
    machine: "Necta Canto ES + Lavazza Blue",
    modelSlug: "necta-canto",
    machineNote:
      "Доставеният вариант е ES с модул за капсули Lavazza Blue. В каталога Canto стои в основния си вид.",
    problem:
      "Персоналът е разделен в предпочитанията си - едни предпочитат прясно смляно кафе на зърна, а други искат кафе с капсули Lavazza Blue. Това налага поставянето на две отделни машини, което увеличава разходите и заема повече място.",
    solution:
      "Инсталирахме Necta Canto ES + Lavazza Blue - комбинирана кафе машина, която предлага както еспресо от кафе на зърна, така и оригинални капсули Lavazza Blue в една система.",
    result:
      "Всички служители получиха предпочитаното от тях кафе, без компромис с качеството. Клиентът спести място и разходите за втора машина, а едно решение удовлетвори всички потребители.",
  },
  {
    slug: "kafe-i-snaksove-na-myastoto-na-edna-mashina",
    title: "Кафе и снаксове на мястото на една машина",
    venue: null,
    machine: "Necta Brio 3 + Mini Snakky",
    modelSlug: "necta-brio-3-snakky",
    machineNote:
      "Доставената двойка е с Mini Snakky - по-малкият снакс шкаф. В каталога Brio 3 стои до стандартната Snakky.",
    problem:
      "Обектът разполагаше с ограничено пространство и нямаше възможност за поставяне на отделна кафе машина и отделна машина за закуски и напитки.",
    solution:
      "Инсталирахме Necta Brio 3 + Mini Snakky - компактно комбинирано решение, което обединява кафе, студени напитки и снаксове в една система.",
    result:
      "Клиентът получи 2-в-1 вендинг решение, което заема място колкото една стандартна машина, но предлага пълно вендинг обслужване с кафе и снаксове, без компромис с разнообразието.",
  },
];

/* -- integrity ------------------------------------------------------------ */

/* A case study that points at a machine we no longer catalogue would render a
 * dead link on the one page whose whole argument is that it does not make
 * things up. Caught at module load, like the catalogue's own references. */
for (const study of CASE_STUDIES) {
  if (study.modelSlug && !modelBySlug(study.modelSlug)) {
    throw new Error(
      `Казусът "${study.slug}" сочи към несъществуващ модел: ${study.modelSlug}`,
    );
  }
}

const duplicateSlug = CASE_STUDIES.map((c) => c.slug).find(
  (slug, i, all) => all.indexOf(slug) !== i,
);
if (duplicateSlug) {
  throw new Error(`Дублиран slug в казусите: ${duplicateSlug}`);
}
