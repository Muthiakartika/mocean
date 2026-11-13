/**
 * Extra planning content for pages that were thin (owner request, 2026-11-11; word counts from the live-site crawl:
 * /surf-spots/ 281, /seasonal-diving/ 332, /wellness-retreat/ 527, /couples-retreat/ 577, host-a-retreat 670, menus
 * and footer included). Rendered under the page's own content by ExtraContent.tsx (redesign only, hidden with
 * ?original), and the questions go into the page's FAQPage structured data (structuredData.ts).
 *
 * No new claims: every fact, price and time is stated elsewhere on this site, and each line notes where:
 * rates and seasons /pricing/, rooms /accommodation/, shoreline and days /tropical-beach-resort/, massage
 * /couples-retreat/, restaurant /restaurant/, surf /surf-trip/ /surf-lesson/
 * /surf-spots/sumbawa/, yoga /surf-retreat/, diving /fun-diving/ /manta-rays/ /pricing/ and the course pages,
 * transfers /pricing/ /travel-lombok-sumbawa/, venue /host-a-retreat-venue-for-rent-hire/.
 * Text has no inline links (owner, 2026-11-11): each card ends with link buttons ("links").
 */

export type ExtraCard = {
  heading: string;
  text?: string[];
  /** Short label/value rows (prices, times). */
  facts?: [string, string][];
  /** Buttons at the foot of the card: [label, path]. */
  links?: [string, string][];
};

export type ExtraPhoto = { src: string; alt: string; width: number; height: number };

export type ExtraContent = {
  kicker: string;
  title: string;
  intro?: string;
  cards: ExtraCard[];
  /** Heading of the FAQ band, as "Surf Camp FAQ" on the other pages. */
  faqTitle: string;
  /** The FAQ collage, as on the other FAQs: two small photos, then the tall one. Photos from the site's own pages. */
  photos: [ExtraPhoto, ExtraPhoto, ExtraPhoto];
  faq: { question: string; answer: string }[];
};

const photo = (src: string, width: number, height: number, alt: string): ExtraPhoto => ({
  src: "/images/uploads/" + src,
  alt,
  width,
  height,
});

/** Room rates and getting here (/pricing/, /accommodation/), shared by the stay pages. */
const ratesCard: ExtraCard = {
  heading: "Rates and getting here",
  facts: [
    ["Deluxe Garden View Bungalow", "IDR 2,200,000 to 2,800,000 a night"],
    ["Standard Room", "IDR 1,690,000 to 2,150,000 a night"],
    ["Included", "Two guests, breakfast, tax and service"],
    ["Book direct", "Discount on stays of three nights or more"],
    ["From Poto Tano ferry port", "About 30 minutes, pickup arranged"],
    ["From Sumbawa Besar airport", "About 2 hours 15 minutes, pickup arranged"],
  ],
  text: ["Lowest rates 1 December to 28 February, highest 1 May to 30 September."],
  links: [
    ["All prices", "/pricing/"],
    ["How to get here", "/how-to-get-to-sumbawa/"],
  ],
};

// The local tours (Kalela and Agal waterfalls, Danau Lebo, the rice field walk) were taken out of these cards on
// 2026-11-13: the resort has no reliable local tour operator (docs/archive/local-tours/README.md).

const massageAnswer =
  "There is no in-house spa, but a therapeutic massage can come to your bungalow if you book it in advance.";

const transferAnswer =
  "Fly to Sumbawa Besar (about 2 hours 15 minutes away) or take the ferry from Kayangan in Lombok to Poto Tano (about 30 minutes away). We arrange pickups from both; send us your arrival time and group size for the price.";

export const extraContent: Record<string, ExtraContent> = {
  "/couples-retreat/": {
    kicker: "Plan your stay",
    title: "A Couples Stay at Mocean, Day by Day",
    cards: [
      {
        heading: "Where you stay",
        text: [
          "Six Deluxe Garden View Bungalows, each with 39 m² inside and an 11 m² private lanai, Jepara teak furniture, a King Koil bed (one king or two twins), air conditioning and a rain shower. The four Standard Rooms have the same bed size and rain shower at a lower rate, without the lanai. All rooms face tropical gardens a few steps back from the sand.",
        ],
        links: [["See the rooms", "/accommodation/"]],
      },
      {
        heading: "A day for two",
        text: [
          "Mornings start with coffee at Mutiara looking out over Moro Beach. Snorkel the house reef a few steps from your room, swim in the pool on the beach or walk the 2-kilometre beach. Book a massage in your bungalow ahead of time, and ask us to set up a private dinner on the sand. Mutiara by Mocean is open daily from 7am to 10pm.",
        ],
        links: [["Restaurant and menu", "/restaurant/"]],
      },
      {
        heading: "Explore together",
        text: ["Divers can join a boat dive to Ju-Ju’s Jackpot, where manta rays feed; first-timers can try Discover Scuba Diving."],
        links: [
          ["Fun diving", "/fun-diving/"],
          ["Discover Scuba", "/discover-scuba-diving/"],
        ],
      },
      ratesCard,
    ],
    faqTitle: "Couples Retreat FAQ",
    photos: [
      photo("2025/09/beach-resort-under-2.jpg", 1650, 825, "Shaded daybeds on the sand at Mocean Beach Resort"),
      photo("2025/05/resort_galery_11.jpg", 1650, 1100, "Pool with sun loungers beside the beach"),
      photo("2025/09/accommodation_galery_5.jpg", 1650, 1100, "Bungalow bedroom with garden doors"),
    ],
    faq: [
      {
        question: "Which room is best for a couple?",
        answer:
          "A Deluxe Garden View Bungalow: 39 m² inside plus an 11 m² private lanai to sit out on, with one king or two twin beds. There are only six, so they go first in high season (May to September).",
      },
      { question: "Does Mocean have a spa?", answer: massageAnswer },
      {
        question: "Can we have a private dinner on the beach?",
        answer: "Yes. Message us on WhatsApp to set up a private dinner on the sand with Mutiara by Mocean, our beachfront restaurant.",
      },
      {
        question: "When is the best time for a couples trip to West Sumbawa?",
        answer:
          "May to October is dry season, with the clearest water. November to April is greener and quieter, with lower room rates; 1 December to 28 February is the lowest season.",
      },
    ],
  },

  "/wellness-retreat/": {
    kicker: "Plan your stay",
    title: "Yoga, Rest and Good Food on Pantai Moro",
    cards: [
      {
        heading: "Yoga on the shoreline",
        text: [
          "The yoga chalet sits on the shoreline of Pantai Moro, next to the pool and the restaurant. Our seasonal yoga and surf retreats run from morning yoga to evening meditation, with Vinyasa, Hatha and Kundalini. Outside retreat dates you set your own rhythm.",
        ],
        links: [["Yoga and surf retreat", "/surf-retreat/"]],
      },
      {
        heading: "Rest and recovery",
        text: [
          "Afternoons are for a walk along the 2-kilometre beach, a swim in the pool on the beach or a nap on your lanai. The calm house reef is a few steps from your room for an easy snorkel. There is no in-house spa, but massage comes to your bungalow when booked ahead.",
        ],
      },
      {
        heading: "Food",
        text: [
          "Mutiara by Mocean cooks with local ingredients and dishes from around the world: smoothie bowls, local dishes and seafood. Breakfast is included with your room, and the restaurant is open daily from 7am to 10pm.",
        ],
        links: [["Restaurant and menu", "/restaurant/"]],
      },
      ratesCard,
    ],
    faqTitle: "Wellness Retreat FAQ",
    photos: [
      photo("2025/09/Right-Beside-The-Sea-new.jpg", 1700, 1486, "Open-sided yoga chalet on the shoreline"),
      photo("2025/09/beach-resort-5.jpg", 1650, 1100, "Beach in front of Mocean Beach Resort"),
      photo("2025/09/Yoga-and-surf-2.jpg", 1650, 1100, "Yoga stretch on a surfboard in calm water"),
    ],
    faq: [
      {
        question: "Do you run scheduled wellness retreats?",
        answer:
          "We run seasonal yoga and surf retreats, and a seasonal yoga teacher training timed with the dry season. Dates vary through the year, so ask us on WhatsApp for the next ones. You can also come any time and plan your own days.",
      },
      {
        question: "What kind of yoga is offered?",
        answer:
          "Morning Vinyasa for strength and mobility, Hatha for alignment and breathing, and Kundalini for core strength, at the yoga chalet on the beach.",
      },
      { question: "Is there a spa at Mocean?", answer: massageAnswer },
      { question: "How do I get to Mocean Beach Resort?", answer: transferAnswer },
    ],
  },

  "/host-a-retreat-venue-for-rent-hire/": {
    kicker: "Venue facts",
    title: "Hosting Your Retreat at Mocean: The Details",
    cards: [
      {
        heading: "Rooms for your group",
        text: [
          "Ten rooms: six Deluxe Garden View Bungalows with private lanai and four Standard Rooms. Each takes up to three guests (one cot or child’s fold-out bed can be added; no rollaway beds), with air conditioning, King Koil beds (king or twin) and a rain shower.",
        ],
        links: [["See the rooms", "/accommodation/"]],
      },
      {
        heading: "Spaces",
        text: [
          "The yoga chalet, pool, lounge and restaurant sit on the shoreline of Pantai Moro; the rooms are set back in tropical gardens. Besides retreats, we host celebrations and company meets.",
        ],
        links: [
          ["Beach resort", "/tropical-beach-resort/"],
          ["Restaurant", "/restaurant/"],
        ],
      },
      {
        heading: "Activities for your guests",
        facts: [
          ["Private surf lesson", "IDR 1,000,000 per person, up to two"],
          ["Surfboard rental", "IDR 150,000 a day"],
          ["Two-tank boat dive", "IDR 2,200,000, at most four divers per guide"],
          ["Guided boat snorkel trip", "IDR 676,500 per person; private boat for six or more"],
        ],
        text: ["Plus PADI courses and beach yoga."],
        links: [
          ["PADI courses", "/scuba-diving/"],
          ["Surf lessons", "/surf-lesson/"],
        ],
      },
      ratesCard,
    ],
    faqTitle: "Retreat Venue FAQ",
    photos: [
      photo("2025/05/Dine_2.jpg", 1700, 1486, "Mutiara by Mocean restaurant facing the sea"),
      photo("2025/09/beach-resort-6.jpg", 1650, 1100, "Lounge with sofas and a view of the pool"),
      photo("2025/09/beach-resort-1.jpg", 1650, 1100, "Garden path between the bungalows"),
    ],
    faq: [
      {
        question: "How many guests can stay at Mocean?",
        answer:
          "We have ten rooms, six bungalows and four Standard Rooms, and each takes up to three guests. Tell us your group size and dates and we’ll tell you what’s free.",
      },
      {
        question: "What kind of retreats can we host?",
        answer:
          "Yoga retreats, wellness getaways, creative workshops and nature-based gatherings, as well as celebrations and company meets. Our team helps with transfers and activity timing.",
      },
      {
        question: "When is the best time to hold a retreat?",
        answer: "The dry season, May to October, when the weather is sunny and good for outdoor sessions.",
      },
      { question: "Can you arrange transfers for the whole group?", answer: transferAnswer },
    ],
  },

  "/surf-spots/": {
    kicker: "Surf from Mocean",
    title: "Surfing West Sumbawa from Mocean Beach Resort",
    intro:
      "These guides cover Indonesia’s main surf regions. Our own home break is in West Sumbawa: Northern Rights breaks right in front of the resort, Middle Reef sits next to it, and Dirty Hippies is about a 15-minute walk down the beach.",
    cards: [
      {
        heading: "Breaks you can walk to",
        facts: [
          ["Northern Rights", "Right-hander in front of the resort, best on mid to high tide"],
          ["Middle Reef", "Softer take-offs, where beginners have their lessons"],
          ["Dirty Hippies", "Laid-back left with longer walls, 15 minutes’ walk"],
        ],
        links: [["Surf camp", "/surf-trip/"]],
      },
      {
        heading: "Day trips",
        text: [
          "When swell and wind line up, we arrange transport to Scar Reef, Yo-Yos and Supersuck. Scar Reef and Supersuck are for advanced surfers only; Yo-Yos suits confident intermediates.",
        ],
        links: [
          ["Sumbawa surf spots", "/surf-spots/sumbawa/"],
          ["Scar Reef guide", "/scar-reef/"],
        ],
      },
      {
        heading: "Seasons",
        text: [
          "April to October is the most consistent, with dry-season swell and offshore winds in the mornings; June and July are often the most reliable for size. November to March brings smaller, mellower waves and thinner crowds, good for beginners and intermediates.",
        ],
      },
      {
        heading: "Lessons and boards",
        facts: [
          ["Private lesson", "IDR 1,000,000 per person, up to two"],
          ["Board rental", "IDR 150,000 a day"],
        ],
        links: [
          ["Surf lessons", "/surf-lesson/"],
          ["Yoga and surf retreat", "/surf-retreat/"],
        ],
      },
    ],
    faqTitle: "Surfing West Sumbawa FAQ",
    photos: [
      photo("2025/08/Surf-Trips-Gallery-2.jpg", 1650, 1100, "Surfers walking out of the water with their boards"),
      photo("2025/08/surf-trips-sq-2.jpg", 1700, 1486, "Two surfers carrying a board"),
      photo("2025/06/Surfing-new.jpg", 600, 800, "Surfer riding a barrel"),
    ],
    faq: [
      {
        question: "Where can I surf near Mocean Beach Resort?",
        answer:
          "Northern Rights breaks right in front of the resort, Middle Reef is next to it and Dirty Hippies is about a 15-minute walk down the beach. When conditions line up we arrange day trips to Scar Reef, Yo-Yos and Supersuck.",
      },
      {
        question: "When is the best time to surf West Sumbawa?",
        answer:
          "April to October is the most consistent, with dry-season swell and offshore morning winds. November to March has smaller, mellower waves and fewer people in the water.",
      },
      {
        question: "Is West Sumbawa good for beginner surfers?",
        answer:
          "Yes. Beginners learn at Middle Reef, which has softer take-offs and mellow shoulders. Private lessons with a local coach are IDR 1,000,000 per person, for up to two people.",
      },
      {
        question: "Which other Indonesian surf regions do your guides cover?",
        answer: "Bali, Canggu, Uluwatu, Nusa Lembongan and Lombok, each with its main breaks, levels and seasons, besides Sumbawa.",
      },
    ],
  },

  "/seasonal-diving/": {
    kicker: "Dive seasons",
    title: "When to Dive West Sumbawa",
    intro:
      "Our dive season runs from 1 April to 31 October, when the water is clearest and the sea calmest. Boat dives leave from the resort in the morning, with no more than four divers per guide.",
    cards: [
      {
        heading: "What you can see",
        text: [
          "Manta rays chain-feed at Ju-Ju’s Jackpot, and Polong, a black “ninja” manta, is a regular there. Reef sharks, eagle rays and turtles are seen on our sites; average visibility is 10 to 15 metres. Mantas are wild animals, so no dive is guaranteed.",
        ],
        links: [
          ["Manta rays", "/manta-rays/"],
          ["Coral reefs", "/coral-reefs/"],
        ],
      },
      {
        heading: "This season’s courses",
        facts: [
          ["Peak Performance Buoyancy", "One day, two boat dives, any certified diver"],
          ["Drift Diving", "Certified divers with some open water experience"],
          ["Deep Diving", "Two days, down to 40 metres, PADI Deep Diver card"],
        ],
        text: ["Two divers per instructor."],
        links: [
          ["Buoyancy", "/scuba-diving/peak-performance-buoyancy/"],
          ["Drift", "/scuba-diving/drift-diving/"],
          ["Deep", "/scuba-diving/deep-diving/"],
          ["Night diving", "/scuba-diving/night-diving/"],
        ],
      },
      {
        heading: "Dive prices",
        facts: [
          ["Two-tank boat dive", "IDR 2,200,000"],
          ["Two-tank boat dive to Kenawa", "IDR 2,750,000"],
          ["Third boat dive", "IDR 990,000"],
          ["Full gear rental", "IDR 330,000 a day"],
        ],
        links: [
          ["Fun diving", "/fun-diving/"],
          ["All prices", "/pricing/"],
        ],
      },
      {
        heading: "Out of season",
        text: [
          "November to April is greener and quieter, with lower room rates. The house reef is enjoyable for snorkeling all year.",
        ],
        links: [["Snorkeling", "/snorkeling/"]],
      },
    ],
    faqTitle: "Dive Season FAQ",
    photos: [
      photo("2025/09/Daily-Fun-Diving-1.jpg.webp", 1700, 1486, "Diver over the reef giving the OK sign"),
      photo("2025/09/Daily-Fun-Diving-3.jpg.webp", 1700, 1486, "Two divers above hard coral"),
      photo("2025/06/The_diving_5.jpg", 1700, 1486, "Manta ray gliding over the reef"),
    ],
    faq: [
      { question: "When is the dive season at Mocean?", answer: "From 1 April to 31 October." },
      {
        question: "What is the visibility like?",
        answer: "Average visibility on our dive sites is 10 to 15 metres, and April to October brings the clearest water.",
      },
      {
        question: "Where can I see manta rays in West Sumbawa?",
        answer:
          "At Ju-Ju’s Jackpot, one of our dive sites, where manta rays chain-feed in plankton-rich water. Ask us about this season’s sightings; mantas are wild, so no dive is guaranteed.",
      },
      {
        question: "Can I take a specialty course with an Open Water certification?",
        answer:
          "Yes. Peak Performance Buoyancy and Deep Diving are open to Open Water and Advanced Open Water divers, and drift diving suits certified divers with some open water experience.",
      },
    ],
  },
};

