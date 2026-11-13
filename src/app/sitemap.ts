import type { MetadataRoute } from "next";
import { SITE_URL } from "@/data/contact";
import { allPaths, notInSitemap } from "@/data/routes";
import { getPageSeo } from "@/lib/metadata";

/**
 * /sitemap.xml — the same 55 URLs as the original Yoast sitemap (page + post sitemaps).
 * Old Yoast/WordPress sitemap URLs redirect here (next.config.ts).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return allPaths
    .filter((path) => !notInSitemap.includes(path))
    .map((path) => {
      const { og } = getPageSeo(path);
      const modified = og.modifiedTime ?? og.publishedTime;
      return {
        url: SITE_URL + path,
        ...(modified ? { lastModified: modified } : {}),
        ...(og.image ? { images: [og.image] } : {}),
      };
    });
}
