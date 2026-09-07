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
  /**
   * ⚠ NOTHING IS DISALLOWED, AND `/admin` LEAST OF ALL.
   *
   * It used to carry `disallow: ["/admin", "/admin/"]`, on the reasoning that
   * blocking the crawl was worth having on a path that answers with a password
   * form. That reasoning was wrong, and buy-a-vend proved it: Search Console
   * reported two pages under "Indexed, though blocked by robots.txt" on
   * 7 September 2026, from the identical rule. This site has the same shape and
   * the same fix, applied before it earns the same report.
   *
   * The mechanism is the opposite of what the directive looks like it does.
   * `(admin)/layout.tsx` sets `robots: { index: false, follow: false }`, which
   * is what actually removes a page from the index — but Google has to FETCH a
   * page to read a meta tag, and `Disallow` forbids exactly that fetch. So the
   * crawler never saw the `noindex`, discovered the URL anyway, and indexed it
   * bare. Google's guidance is explicit: a page must be crawlable for `noindex`
   * to work.
   *
   * Two smaller reasons the line was never earning its place. robots.txt is a
   * public file, so listing `/admin` in it advertised the path to every scanner
   * on the internet. And it protected nothing: the panel is password-gated, and
   * a crawl instruction has never been an access control.
   */
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: absolute("/sitemap.xml"),
  };
}
