import { contact, SITE_URL } from "@/data/contact";
import { getPageSeo } from "@/lib/metadata";

/**
 * /llms.txt — a plain-text summary of the resort for AI assistants and answer engines (llmstxt.org format): what the
 * place is, the facts people plan with, and the main pages with their descriptions. Every fact is the site's own
 * (homepage FAQ, page descriptions, PRODUCT.md); prices are the ones on /pricing/. Built at build time.
 */
export const dynamic = "force-static";

const sections: { title: string; paths: string[] }[] = [
  { title: "Stay", paths: ["/", "/tropical-beach-resort/", "/accommodation/", "/pricing/", "/restaurant/", "/couples-retreat/", "/wellness-retreat/", "/surf-retreat/", "/host-a-retreat-venue-for-rent-hire/"] },
  { title: "Diving", paths: ["/fun-diving/", "/dive-resort/", "/scuba-diving/", "/discover-scuba-diving/", "/scuba-diving/padi-open-water/", "/scuba-diving/padi-advanced-open-water/", "/scuba-diving/rescue-diver/", "/snorkeling/", "/manta-rays/", "/coral-reefs/", "/seasonal-diving/", "/dive-sites/"] },
  { title: "Surfing", paths: ["/surf-trip/", "/surf-lesson/", "/surf-spots/sumbawa/", "/scar-reef/"] },
  { title: "Explore West Sumbawa", paths: ["/things-to-do-in-sumbawa-indonesia/"] },
  { title: "Plan the trip", paths: ["/how-to-get-to-sumbawa/", "/travel-lombok-sumbawa/", "/contact/"] },
];

function link(path: string): string {
  const seo = getPageSeo(path);
  const name = seo.title.split(" | ")[0];
  return `- [${name}](${SITE_URL}${path})${seo.description ? `: ${seo.description}` : ""}`;
}

export function GET() {
  const a = contact.postalAddress;
  const body = [
    "# Mocean Beach Resort",
    "",
    "> Beachfront dive and surf resort on Pantai Moro (Moro Bay), West Sumbawa, Indonesia. Ten rooms (six handcrafted bungalows and four Standard Rooms), a pool and restaurant on the beach, a PADI dive center, and the Northern Rights surf break in front of the resort.",
    "",
    "## Key facts",
    "",
    `- Address: ${a.street}, ${a.locality}, ${a.regency}, ${a.region} ${a.postalCode}, ${a.country} (Pantai Moro). Map: ${contact.mapsUrl}`,
    `- Phone and WhatsApp: ${contact.phoneDisplay} (${contact.whatsappUrl})`,
    `- Online booking: ${contact.cloudbedsUrl}. Stays of three nights or more booked direct get a discount.`,
    "- Getting there: about 30 minutes by car from Poto Tano ferry port (ferry from Kayangan, Lombok) or about 2 hours 15 minutes from Sumbawa Besar airport (SWQ). The resort arranges pickups from both.",
    "- Rooms: Standard Rooms IDR 1,690,000 to 2,150,000 a night, Deluxe Garden View Bungalows IDR 2,200,000 to 2,800,000, depending on season (high season 1 May to 30 September, low season 1 December to 28 February). Rates cover two guests, breakfast, tax and service.",
    "- Diving: two-tank boat dives from IDR 2,200,000, at most four divers per guide, dive season 1 April to 31 October. Manta rays at Ju-Ju's Jackpot. PADI courses from Discover Scuba Diving to Rescue Diver, with a training pool.",
    "- Surfing: Northern Rights breaks right in front of the resort; Middle Reef and Dirty Hippies are a short walk down the beach. Private surf lessons IDR 1,000,000 per person.",
    "- Seasons: May to October is dry season, with the most consistent surf and the clearest water. November to April is greener and quieter, with lower room rates.",
    "- Restaurant: Mutiara by Mocean, on the beach, open daily 7am to 10pm.",
    "- Day guests: welcome to dive; pool day pass IDR 300,000 (10:00 to 17:00), IDR 200,000 of it usable in the restaurant.",
    "",
    ...sections.flatMap((s) => [`## ${s.title}`, "", ...s.paths.map(link), ""]),
  ].join("\n");

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
