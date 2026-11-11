import { getPageSeo } from "@/lib/metadata";
import { improveJsonLd } from "@/lib/structuredData";

/** Outputs the page's structured data (JSON-LD): the original blocks, with the SEO fixes in structuredData.ts. */
export default function JsonLd({ path }: { path: string }) {
  const { jsonLd, og } = getPageSeo(path);
  const blocks = improveJsonLd(jsonLd, path, getPageSeo("/").og.image);
  return (
    <>
      {/* Yoast also writes article:modified_time on "website" pages (the homepage); Next.js metadata only does on
          articles. React hoists this tag into <head>. */}
      {og.type !== "article" && og.modifiedTime && <meta property="article:modified_time" content={og.modifiedTime} />}
      {blocks.map((block, i) => (
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
