import fs from "node:fs";
import path from "node:path";
import { SITE_URL } from "@/data/contact";
import { getPageSeo } from "@/lib/metadata";
import type { CarouselCard } from "./CardCarousel";

/**
 * Related pages under the course, dive-site and surf-spot pages (ElementorPage.tsx). SEO (owner, 2026-11-06): these pages had
 * almost no links from other pages' content (1 to 3), and several were still "discovered, not indexed" in Search
 * Console. Each page of a group links to all the others, in order after itself, so the first cards differ from page to
 * page. Titles are the pages' own h1, photos their own share image (og:image). Server only.
 */
const GROUPS = [
  {
    title: "More Dive Courses",
    paths: [
      "/discover-scuba-diving/",
      "/scuba-diving/padi-open-water/",
      "/scuba-diving/padi-advanced-open-water/",
      "/scuba-diving/rescue-diver/",
      "/scuba-diving/deep-diving/",
      "/scuba-diving/drift-diving/",
      "/scuba-diving/night-diving/",
      "/scuba-diving/peak-performance-buoyancy/",
    ],
  },
  {
    title: "More Dive Site Guides",
    paths: [
      "/dive-sites/diving-amed/",
      "/dive-sites/diving-bali/",
      "/dive-sites/diving-komodo-island/",
      "/dive-sites/diving-lombok/",
      "/dive-sites/diving-nusa-lembongan/",
      "/dive-sites/diving-nusa-penida/",
      "/dive-sites/diving-raja-ampat/",
      "/dive-sites/diving-tulamben/",
    ],
  },
  {
    title: "More Surf Spot Guides",
    paths: [
      "/surf-spots/sumbawa/",
      "/surf-spots/lombok/",
      "/surf-spots/bali/",
      "/surf-spots/canggu/",
      "/surf-spots/uluwatu/",
      "/surf-spots/nusa-lembongan/",
    ],
  },
];

const decode = (text: string) =>
  text
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;|&rsquo;/g, "’")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** The page's h1, from its migrated content (src/content/pages). */
function pageTitle(pagePath: string): string {
  const file = path.join(process.cwd(), "src/content/pages", `${pagePath.replace(/^\/|\/$/g, "").replace(/\//g, "__")}.json`);
  const heading = fs.readFileSync(file, "utf8").match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  return heading ? decode(JSON.parse(`"${heading[1]}"`)) : getPageSeo(pagePath).og.title;
}

/** Width and height from a JPEG's frame header, for share images whose size Yoast did not record. */
function jpegSize(file: string): { width: number; height: number } | null {
  const data = fs.readFileSync(file);
  if (data[0] !== 0xff || data[1] !== 0xd8) return null;
  let at = 2;
  while (at + 9 < data.length && data[at] === 0xff) {
    const marker = data[at + 1];
    // SOF0–SOF15, except DHT (c4), JPG (c8) and DAC (cc).
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: data.readUInt16BE(at + 5), width: data.readUInt16BE(at + 7) };
    }
    at += 2 + data.readUInt16BE(at + 2);
  }
  return null;
}

/** The page's share image as a local upload, with its size. */
function pageImage(pagePath: string): CarouselCard["image"] {
  const { og } = getPageSeo(pagePath);
  if (!og.image) return null;
  const src = og.image.replace(SITE_URL, "");
  const file = path.join(process.cwd(), "public", src);
  if (!src.startsWith("/images/") || !fs.existsSync(file)) return null;
  const size =
    og.imageWidth && og.imageHeight ? { width: Number(og.imageWidth), height: Number(og.imageHeight) } : jpegSize(file);
  return size ? { src, ...size } : null;
}

/** The related pages for this page, or null when it is in no group. */
export function relatedPages(pagePath: string): { title: string; cards: CarouselCard[] } | null {
  const group = GROUPS.find((g) => g.paths.includes(pagePath));
  if (!group) return null;
  const index = group.paths.indexOf(pagePath);
  const others = group.paths.map((_, i) => group.paths[(index + 1 + i) % group.paths.length]).slice(0, -1);
  return {
    title: group.title,
    cards: others.map((p) => ({ path: p, title: pageTitle(p), image: pageImage(p) })),
  };
}
