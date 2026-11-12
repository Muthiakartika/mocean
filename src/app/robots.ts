import type { MetadataRoute } from "next";
import { SITE_URL } from "@/data/contact";
import { isProduction } from "@/lib/metadata";

/**
 * AI search and answer crawlers, named so it is plain that they are welcome (AEO, 2026-11-11): being read by them is
 * how the resort gets cited in ChatGPT, Perplexity, Gemini and AI Overviews answers. "*" already allows them; the
 * explicit group survives if someone later adds a stricter "*" rule. Note: Cloudflare's "Block AI bots" setting
 * would still block them before this file is read.
 */
const AI_CRAWLERS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  "PerplexityBot",
  "Perplexity-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "Google-Extended",
  "Applebot-Extended",
];

/** /robots.txt — crawling is allowed only on the production deployment (preview and local are blocked). */
export default function robots(): MetadataRoute.Robots {
  if (!isProduction) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: [
      // The contact form endpoint answers POST only; /admin/ is the resort's staff login.
      { userAgent: "*", allow: "/", disallow: ["/api/", "/admin/"] },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: ["/api/", "/admin/"] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
