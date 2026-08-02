import type { MetadataRoute } from "next";
import { absolute, isIndexable } from "@/lib/seo";

/**
 * Indexing stays off until `NEXT_PUBLIC_SITE_INDEXABLE=true`.
 *
 * A catalogue indexed while every price is a €100 placeholder would teach search
 * engines the wrong figures, and those are slow to correct once cached.
 */
export default function robots(): MetadataRoute.Robots {
  if (!isIndexable()) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  /**
   * `/zapitvane` is deliberately NOT disallowed here.
   *
   * It must stay out of the index, but it is linked from all 62 model pages,
   * and blocking the crawl would strand that internal linking rather than let
   * it flow. The page carries `noindex, follow` in its own metadata instead,
   * which is the directive that actually expresses the intent.
   *
   * AI crawlers are not blocked either. In a niche where AI Overviews already
   * appear on four of six sampled queries, and where we are the only site
   * publishing machine-readable rental prices, being citable is the point.
   */
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/"],
      },
    ],
    sitemap: absolute("/sitemap.xml"),
  };
}
