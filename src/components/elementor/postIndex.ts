import fs from "node:fs";
import path from "node:path";
import { getPageSeo } from "@/lib/metadata";

/**
 * The blog posts (src/content/posts/*.json), read at build time: title, photo, date and reading time, for the meta
 * line above each post and the "More from Mocean" cards below it (PostPage.tsx). Server only.
 */
export type PostSummary = {
  path: string;
  title: string;
  image: { src: string; alt: string; width: number; height: number } | null;
  /** ISO date of the last update (Yoast modified time), or the publish date. */
  date: string | null;
  minutes: number;
};

const decode = (text: string) =>
  text
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;|&rsquo;/g, "’")
    .replace(/&#8211;|&ndash;/g, "–")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function readPosts(): PostSummary[] {
  const dir = path.join(process.cwd(), "src/content/posts");
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => {
      const post = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
      const heading = JSON.stringify(post.banner).match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
      const { og } = getPageSeo(post.path);
      const words = decode(post.html).split(" ").filter(Boolean).length;
      return {
        path: post.path,
        title: heading ? decode(JSON.parse(`"${heading[1]}"`)) : og.title,
        image: post.featuredImage,
        date: og.modifiedTime ?? og.publishedTime,
        minutes: Math.max(1, Math.ceil(words / 220)),
      };
    });
}

let cache: PostSummary[] | null = null;
export const allPosts = () => (cache ??= readPosts());

export const postSummary = (postPath: string) => allPosts().find((post) => post.path === postPath) ?? null;

/** The next three posts after this one, wrapping round, so every post is linked from three others. */
export function relatedPosts(postPath: string, count = 3): PostSummary[] {
  const posts = allPosts();
  const index = posts.findIndex((post) => post.path === postPath);
  return Array.from({ length: Math.min(count, posts.length - 1) }, (_, i) => posts[(index + 1 + i) % posts.length]);
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
