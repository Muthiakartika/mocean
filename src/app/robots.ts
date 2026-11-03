import type { MetadataRoute } from "next";
import { SITE_URL } from "@/data/contact";
import { isProduction } from "@/lib/metadata";

/** /robots.txt — crawling is allowed only on the production deployment (preview and local are blocked). */
export default function robots(): MetadataRoute.Robots {
  if (!isProduction) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
