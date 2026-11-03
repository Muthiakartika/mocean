/**
 * Clears Cloudflare's cache of the site after a deployment, so visitors get the new pages at once.
 * Runs automatically from .github/workflows/purge-cloudflare.yml when Vercel reports a successful
 * production deployment; can also be run by hand:
 *
 *   npx tsx scripts/purge-cloudflare.ts               every page URL + /sitemap.xml + /robots.txt
 *   npx tsx scripts/purge-cloudflare.ts --everything  the whole zone (images too)
 *   npx tsx scripts/purge-cloudflare.ts --dry-run     only print what would be purged
 *
 * Needs CLOUDFLARE_API_TOKEN (an API token with the permission Zone > Cache Purge > Purge, for this zone)
 * and CLOUDFLARE_ZONE_ID (Cloudflare dashboard > the domain > Overview > API).
 * Files under /_next/static/ need no purge: their names change with every build.
 */
import { SITE_URL } from "../src/data/contact";
import { allPaths } from "../src/data/routes";

const API = "https://api.cloudflare.com/client/v4/zones";
// URLs per purge request accepted on every Cloudflare plan.
const BATCH = 30;

type CloudflareResult = { success?: boolean; errors?: { code: number; message: string }[] };

async function purge(zone: string, token: string, body: object) {
  const response = await fetch(`${API}/${zone}/purge_cache`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = (await response.json().catch(() => null)) as CloudflareResult | null;
  if (!response.ok || !result?.success) {
    throw new Error(`Cloudflare answered ${response.status}: ${JSON.stringify(result?.errors ?? result)}`);
  }
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const everything = args.has("--everything");
  const urls = [...allPaths, "/sitemap.xml", "/robots.txt"].map((path) => SITE_URL + path);

  if (args.has("--dry-run")) {
    console.log(everything ? "Would purge everything in the zone" : `Would purge ${urls.length} URLs:\n${urls.join("\n")}`);
    return;
  }

  const token = process.env.CLOUDFLARE_API_TOKEN;
  const zone = process.env.CLOUDFLARE_ZONE_ID;
  if (!token || !zone) throw new Error("CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID must be set");

  if (everything) {
    await purge(zone, token, { purge_everything: true });
    console.log("Purged everything in the zone");
    return;
  }
  for (let i = 0; i < urls.length; i += BATCH) await purge(zone, token, { files: urls.slice(i, i + BATCH) });
  console.log(`Purged ${urls.length} URLs`);
}

main().catch((error: Error) => {
  console.error(error.message);
  process.exit(1);
});
