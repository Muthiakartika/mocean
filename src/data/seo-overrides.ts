/**
 * Titles and descriptions that replace the copied Yoast ones (src/data/seo.json stays a faithful copy of WordPress).
 * SEO pass 2026-11-11, from Search Console and the Ahrefs site audit: these pages had generic titles without the place
 * ("Wellness Retreat – Reconnect Mind, Body & Soul"), short descriptions, and several were "discovered / crawled, not
 * indexed". Every claim comes from the page's own text. The couples-retreat description promised "oceanfront villas,
 * spa treatments"; the page itself says the resort has bungalows and no in-house spa (massage comes to the bungalow).
 * Applied to <title>, the meta description, Open Graph and the page's WebPage node in the structured data.
 */
export const seoOverrides: Record<string, { title: string; description: string }> = {
  "/couples-retreat/": {
    title: "Couples Retreat in Sumbawa | Beach Bungalows at Mocean",
    description:
      "A quiet couples getaway on Pantai Moro, West Sumbawa: bungalows in tropical gardens, a 105 m² pool, snorkeling, waterfall trips and in-room massage.",
  },
  "/wellness-retreat/": {
    title: "Wellness Retreat in Sumbawa | Beach Yoga at Mocean",
    description:
      "Slow down on Pantai Moro, West Sumbawa: yoga by the beach, meditation, fresh local and international food, and quiet bungalows. Set your own pace.",
  },
  "/host-a-retreat-venue-for-rent-hire/": {
    title: "Retreat Venue in Sumbawa | Host Your Retreat at Mocean",
    description:
      "Host a yoga, wellness or creative retreat on Sumbawa's west coast: garden bungalows, sunrise yoga, shared meals by the sea and transfers arranged.",
  },
  "/coral-reefs/": {
    title: "Coral Reefs in Sumbawa | Reef Diving & Snorkeling at Mocean",
    description:
      "Mocean sits in the Coral Triangle, with coral gardens minutes from shore in West Sumbawa. Guided reef dives and calm snorkeling for every level.",
  },
  "/surf-trip/": {
    title: "Sumbawa Surf Trip | Northern Rights Out Front at Mocean",
    description:
      "Sumbawa surf trip at Mocean Beach Resort. Surf Northern Rights, Middle Reef and Dirty Hippies from your room, with lessons, board rental and swell-planned days.",
  },
  "/dive-sites/": {
    title: "Sumbawa Diving | West Sumbawa Dive Sites, Season & Prices",
    description:
      "Sumbawa diving with Mocean Beach Resort: manta rays at Ju-Ju's Jackpot, the house reef and Kenawa. Season April to October, max four divers per guide.",
  },
  "/snorkeling/": {
    title: "Snorkeling Sumbawa | House Reef & Boat Trips at Mocean Resort",
    description:
      "Snorkeling Sumbawa from Mocean Beach Resort: walk in to the house reef or join a guided boat trip to the outer reefs. Turtles, rays and coral, from IDR 676,500.",
  },
  "/dive-resort/": {
    title: "Dive Resort in Sumbawa | Max 4 Divers per Guide at Mocean",
    description:
      "Diver-built dive center in West Sumbawa: custom boat with sun deck, private lockers, camera room, and mantas, reef sharks and eagle rays. 3 to 10 day packages.",
  },
};
