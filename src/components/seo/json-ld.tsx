/**
 * Structured data.
 *
 * Rendered as a plain script tag rather than through a helper library: it is
 * static JSON, and one dependency fewer on a page that must stay fast.
 */
export function JsonLd({ data }: { data: object | null }) {
  if (!data) return null;

  return (
    <script
      type="application/ld+json"
      // Data is built from typed content, never from user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
