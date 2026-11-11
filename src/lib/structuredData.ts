import { contact, SITE_URL } from "@/data/contact";
import { extraContent } from "@/data/extra-content";
import { faq as homeFaq } from "@/data/homepage";
import { seoOverrides } from "@/data/seo-overrides";
import { getPageSeo } from "@/lib/metadata";

/**
 * SEO fixes on the structured data copied from Yoast (src/data/seo.json stays a faithful copy; this runs when the
 * JSON-LD is written into the page, JsonLd.tsx). Owner approval 2026-11-06:
 *   - WebSite: Google shows this name as the site name in results; Yoast had "moceanbeachresort.com". The
 *     SearchAction pointed at WordPress search (/?s=), which the new site does not have. The empty description goes.
 *   - Resort: coordinates, social profiles, a photo and the Google Maps place, all from the site's own data (the map
 *     embed in the footer and src/data/contact.ts).
 *   - Article: the author was the WordPress user "admin"; the posts are now credited to the resort.
 * SEO/AEO pass 2026-11-11 (Search Console, Ahrefs site audit "Organization schema missing or incomplete"):
 *   - The Resort node was only on the homepage. Every page now carries it (one @id), and the WebSite names it as
 *     publisher, so search engines and AI answers tie every page to the same business, address and phone.
 *   - Address, phone and pin as on the resort's Google Business Profile (contact.postalAddress), also on the
 *     restaurant; Yoast/WordPress had only "Pantai Moro" with no town or postcode.
 *   - Titles/descriptions replaced in src/data/seo-overrides.ts are also the WebPage node's name/description.
 */

type Node = Record<string, unknown>;

const RESORT_NAME = "Mocean Beach Resort";
const RESORT_ID = `${SITE_URL}/#resort`;

/** The resort as author, publisher or containing place: typed Resort everywhere, so one @id never has two types. */
const resortRef = { "@type": "Resort", "@id": RESORT_ID, name: RESORT_NAME, url: `${SITE_URL}/` };

const postalAddress = {
  "@type": "PostalAddress",
  streetAddress: `${contact.postalAddress.street} (Pantai Moro)`,
  addressLocality: contact.postalAddress.locality,
  addressRegion: contact.postalAddress.regionSchema,
  postalCode: contact.postalAddress.postalCode,
  addressCountry: contact.postalAddress.countryCode,
};

const isType = (node: Node, type: string) =>
  node["@type"] === type || (Array.isArray(node["@type"]) && (node["@type"] as unknown[]).includes(type));

/** The full Resort node: the homepage's hand-written one (seo.json) with the site's own contact data. */
function resortNode(homeImage: string | null): Node {
  const base = getPageSeo("/").jsonLd.find((b) => b && typeof b === "object" && isType(b as Node, "Resort")) as Node | undefined;
  const rest: Node = { ...(base ?? {}) };
  delete rest["@context"];
  return {
    ...rest,
    "@type": "Resort",
    "@id": RESORT_ID,
    name: RESORT_NAME,
    url: `${SITE_URL}/`,
    telephone: contact.phoneE164,
    // /pricing/: Standard Room low season to bungalow high season (Yoast had 2,750,000 as the top).
    priceRange: "IDR 1,690,000 to 2,800,000 per night",
    address: postalAddress,
    geo: { "@type": "GeoCoordinates", ...contact.geo },
    hasMap: contact.mapsUrl,
    ...(homeImage && !rest.image ? { image: homeImage } : {}),
    logo: `${SITE_URL}/images/uploads/2025/05/mocean-favicon-300x300.jpg`,
    sameAs: [contact.facebookUrl, contact.instagramUrl, contact.mapsUrl],
  };
}

/** The WordPress user that Yoast lists as author of every post. */
const isAdminPerson = (node: Node) => isType(node, "Person") && node.name === "admin";

function fixNode(node: Node, path: string, homeImage: string | null): Node {
  if (isType(node, "WebSite")) {
    const rest = { ...node };
    delete rest.potentialAction;
    if (!rest.description) delete rest.description;
    return { ...rest, name: RESORT_NAME, alternateName: "moceanbeachresort.com", publisher: { "@id": RESORT_ID } };
  }
  if (isType(node, "Resort")) {
    const context = node["@context"];
    return { ...(context ? { "@context": context } : {}), ...resortNode(homeImage) };
  }
  if (isType(node, "Restaurant")) {
    return { ...node, telephone: contact.phoneE164, address: postalAddress, containedInPlace: resortRef };
  }
  if (isType(node, "Article")) {
    return { ...node, author: resortRef, publisher: resortRef };
  }
  // The page itself: the replaced title/description, and the post's "admin" author.
  if (isType(node, "WebPage")) {
    const override = seoOverrides[path];
    return {
      ...node,
      ...(override ? { name: override.title, description: override.description } : {}),
      ...(isAdminReference(node.author) ? { author: resortRef } : {}),
    };
  }
  // Any other bare reference to the resort carries its name and type too.
  const resortKey = Object.entries(node).find(([, value]) => isBareResortReference(value))?.[0];
  if (resortKey) return { ...node, [resortKey]: resortRef };
  return node;
}

const isBareResortReference = (value: unknown) =>
  !!value &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.keys(value).length === 1 &&
  (value as Node)["@id"] === RESORT_ID;

/** {"@id": ".../#/schema/person/..."}: Yoast's reference to the WordPress user. */
const isAdminReference = (value: unknown) =>
  !!value && typeof value === "object" && String((value as Node)["@id"] ?? "").includes("/#/schema/person/");

const hasResort = (blocks: unknown[]) =>
  blocks.some((block) => {
    if (!block || typeof block !== "object") return false;
    const b = block as Node;
    return isType(b, "Resort") || (Array.isArray(b["@graph"]) && (b["@graph"] as Node[]).some((n) => isType(n, "Resort")));
  });

const question = (name: string, text: string) => ({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } });

/**
 * The page's questions (2026-11-11): on the homepage the FAQ of src/data/homepage.ts (the copied Yoast block quoted
 * room prices that /pricing/ contradicts, now corrected there); on the pages with extra content (extra-content.ts) its
 * questions are added to the page's FAQPage, or form one. One FAQPage per page.
 */
function withQuestions(blocks: unknown[], path: string): unknown[] {
  const extra = (extraContent[path]?.faq ?? []).map((item) => question(item.question, item.answer));
  const home = path === "/" ? homeFaq.items.map((item) => question(item.question, item.answer)) : null;
  if (!extra.length && !home) return blocks;

  let done = false;
  const update = (node: Node): Node => {
    if (done || !isType(node, "FAQPage")) return node;
    done = true;
    const current = home ?? (Array.isArray(node.mainEntity) ? (node.mainEntity as unknown[]) : []);
    return { ...node, mainEntity: [...current, ...extra] };
  };
  const result = blocks.map((block) => {
    if (!block || typeof block !== "object") return block;
    const b = block as Node;
    return Array.isArray(b["@graph"]) ? { ...b, "@graph": (b["@graph"] as Node[]).map(update) } : update(b);
  });
  return done || !extra.length ? result : [...result, { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: extra }];
}

/** The page's JSON-LD blocks with the fixes above applied, plus the Resort node where the page had none. */
export function improveJsonLd(blocks: unknown[], path: string, homeImage: string | null): unknown[] {
  const fixed = blocks.map((block) => {
    if (!block || typeof block !== "object") return block;
    const b = block as Node;
    if (Array.isArray(b["@graph"])) {
      const graph = (b["@graph"] as Node[]).filter((node) => !isAdminPerson(node)).map((node) => fixNode(node, path, homeImage));
      return { ...b, "@graph": graph };
    }
    return fixNode(b, path, homeImage);
  });
  const withResort = hasResort(fixed) ? fixed : [...fixed, { "@context": "https://schema.org", ...resortNode(homeImage) }];
  return withQuestions(withResort, path);
}
