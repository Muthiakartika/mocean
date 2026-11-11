import { SITE_URL } from "@/data/contact";

/**
 * Internal links without rel="nofollow". On WordPress many Elementor buttons to the site's own pages were set to
 * nofollow (22 links to /contact/, 19 to the homepage, every link to the deep, drift and buoyancy courses). A nofollow
 * link tells search engines not to pass anything through it, so those pages looked unlinked: the Ahrefs site audit
 * (2026-10-23) listed 7 pages reached only through nofollow links, and Search Console had several of them as
 * "discovered, not indexed" (2026-11-11). Links to other sites (Cloudbeds, WhatsApp) keep their rel.
 */
export function followInternalLinks(html: string): string {
  return html.replace(/<a\b[^>]*>/g, (tag) => {
    const href = tag.match(/\shref="([^"]*)"/)?.[1];
    const internal = !!href && ((href.startsWith("/") && !href.startsWith("//")) || href.startsWith(SITE_URL));
    if (!internal || !/\srel="[^"]*nofollow/i.test(tag)) return tag;
    return tag.replace(/\srel="([^"]*)"/, (_, rel: string) => {
      const kept = rel.split(/\s+/).filter((r) => r && r.toLowerCase() !== "nofollow");
      return kept.length ? ` rel="${kept.join(" ")}"` : "";
    });
  });
}
