import { contact, SITE_URL } from "@/data/contact";

/**
 * SEO fixes on the structured data copied from Yoast (src/data/seo.json stays a faithful copy; this runs when the
 * JSON-LD is written into the page, JsonLd.tsx). Owner approval 2026-11-06:
 *   - WebSite: Google shows this name as the site name in results; Yoast had "moceanbeachresort.com". The
 *     SearchAction pointed at WordPress search (/?s=), which the new site does not have. The empty description goes.
 *   - Resort: coordinates, social profiles, a photo and the Google Maps place, all from the site's own data (the map
 *     embed in the footer and src/data/contact.ts).
 *   - Article: the author was the WordPress user "admin"; the posts are now credited to the resort.
 */

type Node = Record<string, unknown>;

const RESORT_NAME = "Mocean Beach Resort";

/** Coordinates and place of "Mocean Resort and Dive" in the footer's Google Maps embed (contact.mapEmbedUrl). */
const GEO = { "@type": "GeoCoordinates", latitude: -8.6741111, longitude: 116.7670422 };
const MAP_URL = "https://maps.google.com/?cid=9781918641660082954";

const resortOrganization = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#resort`,
  name: RESORT_NAME,
  url: `${SITE_URL}/`,
};

const isType = (node: Node, type: string) =>
  node["@type"] === type || (Array.isArray(node["@type"]) && (node["@type"] as unknown[]).includes(type));

/** The WordPress user that Yoast lists as author of every post. */
const isAdminPerson = (node: Node) => isType(node, "Person") && node.name === "admin";

function fixNode(node: Node, homeImage: string | null): Node {
  if (isType(node, "WebSite")) {
    const rest = { ...node };
    delete rest.potentialAction;
    if (!rest.description) delete rest.description;
    return { ...rest, name: RESORT_NAME, alternateName: "moceanbeachresort.com" };
  }
  if (isType(node, "Resort")) {
    return {
      ...node,
      ...(homeImage && !node.image ? { image: homeImage } : {}),
      geo: GEO,
      hasMap: MAP_URL,
      sameAs: [contact.facebookUrl, contact.instagramUrl],
    };
  }
  if (isType(node, "Article")) {
    return { ...node, author: resortOrganization, publisher: resortOrganization };
  }
  // The post's WebPage node points at the same "admin" person.
  if (isAdminReference(node.author)) {
    return { ...node, author: resortOrganization };
  }
  // A bare reference to the resort (the Restaurant on /restaurant/): the Resort node itself is only on the homepage,
  // so the reference carries the name and address of the site too.
  // Typed Resort here: the property is containedInPlace, which expects a place (a Resort is both place and business).
  const resortRef = Object.entries(node).find(([, value]) => isBareResortReference(value));
  if (resortRef) {
    return { ...node, [resortRef[0]]: { ...resortOrganization, "@type": "Resort" } };
  }
  return node;
}

const isBareResortReference = (value: unknown) =>
  !!value &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.keys(value).length === 1 &&
  (value as Node)["@id"] === `${SITE_URL}/#resort`;

/** {"@id": ".../#/schema/person/..."}: Yoast's reference to the WordPress user. */
const isAdminReference = (value: unknown) =>
  !!value && typeof value === "object" && String((value as Node)["@id"] ?? "").includes("/#/schema/person/");

/** The page's JSON-LD blocks with the fixes above applied. */
export function improveJsonLd(blocks: unknown[], homeImage: string | null): unknown[] {
  return blocks.map((block) => {
    if (!block || typeof block !== "object") return block;
    const b = block as Node;
    if (Array.isArray(b["@graph"])) {
      const graph = (b["@graph"] as Node[]).filter((node) => !isAdminPerson(node)).map((node) => fixNode(node, homeImage));
      return { ...b, "@graph": graph };
    }
    return fixNode(b, homeImage);
  });
}
