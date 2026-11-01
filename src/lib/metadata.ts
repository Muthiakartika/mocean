import type { Metadata } from "next";
import seoData from "@/data/seo.json";

/**
 * SEO for every page, copied from the original Yoast SEO output
 * (title, description, canonical, robots, Open Graph, Twitter, JSON-LD).
 * Source data: src/data/seo.json (generated from docs/audit/seo.json).
 */
type PageSeo = {
  title: string;
  description: string | null;
  canonical: string | null;
  robots: string;
  og: {
    type: string;
    title: string;
    description: string | null;
    url: string;
    siteName: string;
    locale: string;
    image: string | null;
    imageWidth: string | null;
    imageHeight: string | null;
    imageType: string | null;
    publishedTime: string | null;
    modifiedTime: string | null;
  };
  twitterCard: string;
  jsonLd: unknown[];
};

const pages = seoData as Record<string, PageSeo>;

export function getPageSeo(path: string): PageSeo {
  const seo = pages[path];
  if (!seo) throw new Error(`No SEO data for ${path} — add it to src/data/seo.json`);
  return seo;
}

/** Only the real production deployment may be indexed (PRD §10.4). */
export const isProduction = process.env.VERCEL_ENV === "production" || process.env.SITE_ENV === "production";

/** Next.js Metadata for a page path such as "/" or "/pricing/". */
export function pageMetadata(path: string): Metadata {
  const seo = getPageSeo(path);
  const robots = !isProduction
    ? { index: false, follow: false }
    : seo.robots.includes("noindex")
    ? { index: false, follow: true }
    : {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, "max-image-preview": "large" as const, "max-snippet": -1, "max-video-preview": -1 },
        "max-image-preview": "large" as const,
        "max-snippet": -1,
        "max-video-preview": -1,
      };

  return {
    // `absolute` keeps the exact Yoast title (no template added).
    title: { absolute: seo.title },
    description: seo.description ?? undefined,
    alternates: seo.canonical ? { canonical: seo.canonical } : undefined,
    robots,
    openGraph: {
      type: seo.og.type === "article" ? "article" : "website",
      locale: seo.og.locale,
      title: seo.og.title,
      description: seo.og.description ?? undefined,
      url: seo.og.url,
      siteName: seo.og.siteName,
      ...(seo.og.modifiedTime ? { modifiedTime: seo.og.modifiedTime } : {}),
      ...(seo.og.publishedTime ? { publishedTime: seo.og.publishedTime } : {}),
      images: seo.og.image
        ? [
            {
              url: seo.og.image,
              width: seo.og.imageWidth ? Number(seo.og.imageWidth) : undefined,
              height: seo.og.imageHeight ? Number(seo.og.imageHeight) : undefined,
              type: seo.og.imageType ?? undefined,
            },
          ]
        : undefined,
    },
    twitter: { card: "summary_large_image" },
  };
}
