import { getPageSeo } from "@/lib/metadata";

/** Outputs the page's structured data (JSON-LD), same blocks as the original site. */
export default function JsonLd({ path }: { path: string }) {
  const { jsonLd } = getPageSeo(path);
  return (
    <>
      {jsonLd.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          // JSON.stringify output is safe here; "<" is escaped so the script tag can't be closed early.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block).replace(/</g, "\\u003c") }}
        />
      ))}
    </>
  );
}
