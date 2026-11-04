import { getPageSeo } from "@/lib/metadata";

/** Outputs the page's structured data (JSON-LD), same blocks as the original site. */
export default function JsonLd({ path }: { path: string }) {
  const { jsonLd, og } = getPageSeo(path);
  return (
    <>
      {/* Yoast also writes article:modified_time on "website" pages (the homepage); Next.js metadata only does on
          articles. React hoists this tag into <head>. */}
      {og.type !== "article" && og.modifiedTime && <meta property="article:modified_time" content={og.modifiedTime} />}
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
