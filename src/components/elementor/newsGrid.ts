import fs from "node:fs";
import path from "node:path";
import { getPageSeo } from "@/lib/metadata";

/**
 * The "Load More" button of the post grid on /news/ (Essential Addons Post Grid). On WordPress it fetched the next four
 * posts through admin-ajax.php, which the new site does not have, so the button did nothing (owner, 2026-11-11), and
 * the posts of page 2 (Scar Reef, Host a Retreat, Yoga and Surf Retreat) were linked from nowhere on /news/.
 * The remaining posts are now written into the grid at build time, in the widget's own markup, hidden; the button
 * (ElementorBehaviors.tsx) shows them and goes away, as on WordPress once the last page is loaded. Their links are in
 * the HTML, so search engines find them without clicking. Server only.
 */

type GridPost = { id: string; path: string; title: string; excerpt: string; image: string | null; published: string };

/** Excerpt as WordPress made it for this grid: the first 20 words of the post text, then "...". */
const EXCERPT_WORDS = 20;

function readPosts(): GridPost[] {
  const dir = path.join(process.cwd(), "src/content/posts");
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const post = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
      const heading = JSON.stringify(post.banner).match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
      const { og } = getPageSeo(post.path);
      // Entities (&#8217; …) stay as they are: the text goes back into HTML.
      const words = String(post.html)
        .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/g, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .split(/\s+/)
        .filter(Boolean);
      return {
        id: String(post.articleClasses).match(/\bpost-(\d+)/)?.[1] ?? "",
        path: post.path,
        title: heading ? JSON.parse(`"${heading[1]}"`).replace(/<[^>]+>/g, "").trim() : og.title,
        excerpt: words.slice(0, EXCERPT_WORDS).join(" ") + (words.length > EXCERPT_WORDS ? "..." : ""),
        image: post.featuredImage?.src ?? null,
        published: og.publishedTime ?? og.modifiedTime ?? "",
      };
    })
    .sort((a, b) => b.published.localeCompare(a.published));
}

const escapeAttr = (text: string) => text.replace(/&(?![#\w]+;)/g, "&amp;").replace(/"/g, "&quot;");

const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

/** Same widths/sizes rule as responsiveImages.ts, through the Next.js image optimiser. */
const srcset = (src: string) =>
  [640, 1024].map((w) => `/_next/image/?url=${encodeURIComponent(src)}&amp;w=${w}&amp;q=75 ${w}w`).join(", ");

/** One post card, in the widget's markup (style "two"), hidden until "Load More". */
function card(post: GridPost): string {
  const date = dateLabel(post.published);
  const title = escapeAttr(post.title);
  const image = post.image
    ? `<img alt="" class="attachment-large size-large" decoding="async" height="427" loading="lazy" src="${post.image}" srcset="${srcset(post.image)}" sizes="(max-width: 767px) 100vw, 640px" width="640"/>`
    : "";
  return (
    `<article class="eael-grid-post eael-post-grid-column eael-pg-post-${post.id} category-uncategorized" data-id="${post.id}" data-rd-more-post="" style="display:none">\n` +
    `<div class="eael-grid-post-holder">\n<div class="eael-grid-post-holder-inner"><div class="eael-entry-media"><div class="eael-entry-overlay fade-in"><i aria-hidden="true" class="fas fa-spinner"></i><a href="${post.path}" target="_blank" aria-label="${title}"></a></div><div class="eael-entry-thumbnail">\n${image}\n</div>\n</div>` +
    `<div class="eael-entry-wrapper"><header class="eael-entry-header"><h2 class="eael-entry-title"><a class="eael-grid-post-link" href="${post.path}" target="_blank" title="${title}">${post.title}</a></h2></header>` +
    `<div class="eael-entry-content">\n<div class="eael-grid-post-excerpt"><p>${post.excerpt}</p><a class="eael-post-elements-readmore-btn" href="${post.path}" target="_blank">Read More</a></div>\n</div>` +
    `<div class="eael-entry-header-after style-two"><div class="eael-entry-meta"><span class="eael-meta-posted-on"><i class="far fa-clock"></i><time datetime="${date}">${date}</time></span></div></div></div></div>\n</div>\n</article>`
  );
}

let cache: GridPost[] | null = null;

/** The post grid's HTML with the posts the button used to fetch added, hidden, after the ones it shows. */
export function completeNewsGrid(html: string): string {
  if (!html.includes("eael-load-more-button")) return html;
  const shown = new Set([...html.matchAll(/class="eael-grid-post-link" href="([^"]+)"/g)].map((m) => m[1]));
  const rest = (cache ??= readPosts()).filter((post) => !shown.has(post.path));
  const end = html.lastIndexOf("</article>");
  if (!rest.length || end < 0) return html;
  const at = end + "</article>".length;
  return html.slice(0, at) + rest.map(card).join("") + html.slice(at);
}
