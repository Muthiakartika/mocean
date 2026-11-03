/**
 * Link checker for the Next.js site (run against `npm run dev` or `npm start`):
 * loads every page from src/data/routes.ts and checks
 *   - internal links (relative or https://moceanbeachresort.com/...) answer 200 after redirects
 *   - in-page anchors (#id) have a matching id on the target page
 *   - images (<img src>, also through /_next/image) load
 * External links (WhatsApp, Cloudbeds, social media) are listed but not requested.
 *
 *   npx tsx scripts/check-links.ts
 */
import { allPaths } from "../src/data/routes";
import { TARGETS } from "./shared";

const SITE = "https://moceanbeachresort.com";

/** Turns an href/src into a local path ("/pricing/"), or null for external / non-http links. */
function localPath(raw: string): string | null {
  const href = raw.replace(/&amp;/g, "&").trim();
  if (href.startsWith(SITE)) return href.slice(SITE.length) || "/";
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  return null;
}

const ids = (html: string) => new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));

async function main() {
  const pages = new Map<string, string>();
  for (const path of allPaths) {
    const res = await fetch(TARGETS.local + path);
    if (res.status !== 200) console.log(`PAGE ${res.status} ${path}`);
    pages.set(path, await res.text());
  }

  const problems: string[] = [];
  const checked = new Map<string, number>(); // url -> status
  const external = new Set<string>();
  const status = async (url: string) => {
    if (!checked.has(url)) checked.set(url, (await fetch(TARGETS.local + url)).status);
    return checked.get(url)!;
  };

  for (const [page, html] of pages) {
    const pageIds = ids(html);
    for (const [, attr, raw] of html.matchAll(/\s(href|src)="([^"]*)"/g)) {
      if (raw.startsWith("#")) {
        if (raw.length > 1 && !pageIds.has(decodeURIComponent(raw.slice(1)))) problems.push(`${page}: anchor ${raw} has no target`);
        continue;
      }
      const local = localPath(raw);
      if (local === null) {
        if (/^https?:/.test(raw)) external.add(new URL(raw).host);
        continue;
      }
      if (local.startsWith("/_next/static/")) continue;
      const [target, hash] = local.split("#");
      const code = await status(target);
      if (code !== 200) problems.push(`${page}: ${attr} ${raw} -> ${code}`);
      else if (hash && pages.has(target) && !ids(pages.get(target)!).has(hash)) problems.push(`${page}: ${raw} -> no #${hash} on ${target}`);
    }
  }

  console.log(problems.length ? problems.join("\n") : "No broken internal links, anchors or images.");
  console.log(`\n${pages.size} pages, ${checked.size} internal URLs checked, external hosts: ${[...external].sort().join(", ")}`);
  process.exitCode = problems.length ? 1 : 0;
}

main();
