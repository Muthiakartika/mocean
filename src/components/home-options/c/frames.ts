/**
 * Frames of the reel in homepage option C. Titles and lines are cut from the
 * homepage text (src/data/homepage.ts); edge codes repeat facts stated there.
 */
import { accommodation, diving, restaurant } from "@/data/homepage";

const img = (path: string) => `/images/uploads/${path}`;

export type ReelFrame = {
  id: string;
  image: string;
  alt: string;
  /** Focal point for object-position. */
  focus?: string;
  title: string;
  text: string;
  /** Printed along the film edge above the frame. */
  edge: string[];
};

export const reelFrames: ReelFrame[] = [
  {
    id: "beach",
    image: img("2025/06/Slider-mocean-2.jpg"),
    alt: "Daybeds on the sand at Pantai Moro",
    title: "A Quiet Stretch of Pantai Moro",
    text: "West Sumbawa’s only beachfront dive and surf resort, for those who want a touch of comfort with their adventure.",
    edge: ["Pantai Moro", "2 km of beach", "8°40′S 116°46′E"],
  },
  {
    id: "rooms",
    image: img("2025/09/accommodation_galery_10.jpg"),
    alt: "View from a bungalow lanai towards the pool",
    focus: "50% 60%",
    title: accommodation.title,
    text: "Six handcrafted bungalows, built with regional materials, alongside four garden-view Standard Rooms.",
    edge: ["6 bungalows", "4 Standard Rooms", "Bungalows 50 m² with lanai"],
  },
  {
    id: "restaurant",
    image: img("2025/05/Dine_1.jpg"),
    alt: "The open-air dining room of Mutiara by Mocean",
    focus: "50% 55%",
    title: restaurant.title,
    text: "Enjoy bold grilled favorites and fresh dishes with flavors inspired by the Asia-Pacific region.",
    edge: ["Breakfast to dinner", "Private beachfront dining"],
  },
  {
    id: "dive-center",
    image: img("2025/05/dive_1.jpg"),
    alt: "The gear room with individual lockers",
    focus: "50% 45%",
    title: diving.title,
    text: "Our custom built boat offers ample room for guests and gear. We offer equipment rental and PADI dive instruction.",
    edge: ["Two-tank boat dives from IDR 2,200,000", "No more than 4 divers per guide"],
  },
  {
    id: "reef",
    image: img("2025/06/Slider-mocean-4.jpg"),
    alt: "Clownfish in an anemone",
    focus: "55% 50%",
    title: "Dive Our House Reef",
    text: "Our dive season runs 1 April to 31 October.",
    edge: ["House reef", "Dive season 1 April to 31 October"],
  },
  {
    id: "surf",
    image: img("2025/06/74.jpg"),
    alt: "A surfer on a right-hand wave below dry hills",
    focus: "60% 50%",
    title: "Surf Uncrowded Waves at Northern Rights",
    text: "Northern Rights breaks right in front of the resort, with Middle Reef and Dirty Hippies a short walk down the beach.",
    edge: ["Northern Rights", "In front of the resort", "May to October: most consistent surf"],
  },
  // A last frame on the local tours ("Trek to Agal Waterfall") was taken out on 2026-11-13: the resort has no reliable
  // local tour operator (docs/archive/local-tours/README.md).
];

/** The three frames on the strip in the first viewport (the middle one is in the gate). */
export const heroFrames = [
  { image: img("2025/06/Slider-mocean-1.jpg"), alt: "Aerial view of the bay and the resort on Pantai Moro" },
  { image: img("2025/05/resort_galery_11.jpg"), alt: "The pool on the beach with blue loungers" },
  { image: img("2025/06/Slider-mocean-6.jpg"), alt: "A manta ray gliding over the reef" },
];
