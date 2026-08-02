import type { MetadataRoute } from "next";
import { sitemapEntries } from "@/lib/seo";

/**
 * No `lastModified`, and no `changeFrequency`.
 *
 * Google ignores `changefreq` and `priority` outright, and treats `lastmod` as
 * a hint it will stop trusting if it proves inaccurate. We do not track a real
 * per-page content date, so the only `lastmod` available is build time - which
 * would claim all 78 pages changed every deploy. A fabricated signal that gets
 * the whole sitemap distrusted is worse than an absent one.
 *
 * `priority` is kept because it costs nothing and records our own view of the
 * hierarchy in one readable place; it is not expected to do any work.
 *
 * Revisit if per-model content dates ever become real data.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapEntries().map(({ url, priority }) => ({ url, priority }));
}
