import { MODELS, catalogueStats, specCompleteness } from "../src/content/models";
import { fromMonthly } from "../src/engine/quote";

const stats = catalogueStats();
console.log("\nКаталог");
console.log("  общо модела:", stats.total);
console.log("  по категории:", stats.byCategory);
console.log("  средна пълнота на спецификациите:", stats.averageSpecCompleteness + "%");

const weak = MODELS.filter((m) => specCompleteness(m) < 30);
console.log("\nМодели с под 30% данни:", weak.length);

console.log("\nФотография (D25: реални снимки, не фабрични рендери)");
console.log(
  `  заснети модела: ${stats.photos.withAny} от ${stats.photos.total} (${stats.photos.percent}%)`,
);
console.log("  с пълен комплект от 4 изгледа:", stats.photos.withCompleteSet);

const prices = MODELS.map((m) => fromMonthly(m.id));
console.log("\nЦени (заместващи, изведени от каталожните факти)");
console.log("  различни стойности:", new Set(prices).size, "от", prices.length);
console.log("  диапазон:", Math.min(...prices), "-", Math.max(...prices), "EUR");
