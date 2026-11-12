import { addOns, roomTypes } from "./schema";
import type { Db } from "./index";

/**
 * Starting data of the booking system: the resort's five room types and the airport transfers, as they stand on the
 * Cloudbeds booking page and the website (checked 2026-11-11). Safe to run again: rows that exist are left alone.
 *
 * To confirm with the owner (also listed in docs/booking-native.md):
 *  - Unit counts come from Cloudbeds (4 + 1 + 1 bungalows = 6, 2 + 2 standard rooms = 4, ten rooms in all).
 *  - Guests per room: the website says 2 for a Deluxe Bungalow and 3 for a Standard Room; the Cloudbeds page offers 3 for
 *    all. The website's numbers are used (the stricter ones).
 *  - Prices are the website's `roomRates` (src/data/homepage.ts), rates for two guests with breakfast, tax and service.
 *    Season dates are NOT known: until they are entered in the admin, every night is priced as low season.
 */

const BUNGALOW_TEXT =
  "The spacious double room offers air conditioning, a tea and coffee maker, a terrace with garden views as well as a private bathroom featuring a walk-in shower.";

const DELUXE = { maxGuests: 2, priceLow: 2_200_000, priceShoulder: 2_337_500, priceHigh: 2_800_000 };
const STANDARD = { maxGuests: 3, priceLow: 1_690_000, priceShoulder: 1_785_000, priceHigh: 2_150_000 };

const BUNGALOW_FEATURES = ["Air conditioning", "Garden view terrace", "Walk-in shower", "Tea and coffee maker", "Hairdryer"];
const STANDARD_FEATURES = ["Air conditioning", "Garden view", "Walk-in shower", "Tea and coffee maker"];

export const ROOM_TYPE_SEED: (typeof roomTypes.$inferInsert)[] = [
  {
    id: "dlx-king",
    name: "Deluxe King Bungalow with Garden View",
    description: `${BUNGALOW_TEXT} The unit offers 1 bed.`,
    units: 4,
    photos: ["/images/uploads/2025/09/accommodation_galery_12.jpg"],
    features: BUNGALOW_FEATURES,
    sort: 1,
    ...DELUXE,
  },
  {
    id: "dlx-queen",
    name: "Deluxe Queen Bungalow with Garden View",
    description: `${BUNGALOW_TEXT} The unit offers 1 bed.`,
    units: 1,
    photos: ["/images/uploads/2025/09/accommodation_galery_12.jpg"],
    features: BUNGALOW_FEATURES,
    sort: 2,
    ...DELUXE,
  },
  {
    id: "dlx-twin",
    name: "Deluxe Twin Bungalow with Garden View",
    description: `${BUNGALOW_TEXT} The unit offers twin beds.`,
    units: 1,
    photos: ["/images/uploads/2025/09/accommodation_galery_6.jpg"],
    features: BUNGALOW_FEATURES,
    sort: 3,
    ...DELUXE,
  },
  {
    id: "std-king",
    name: "Standard King with Garden View",
    description: `${BUNGALOW_TEXT} The unit offers 1 king bed.`,
    units: 2,
    photos: ["/images/uploads/2025/10/Standard-room-King-Bed.jpg"],
    features: STANDARD_FEATURES,
    sort: 4,
    ...STANDARD,
  },
  {
    id: "std-twin",
    name: "Standard Twin with Garden View",
    description: `${BUNGALOW_TEXT} The unit offers twin beds.`,
    units: 2,
    photos: ["/images/uploads/2025/09/Standard-room.jpg"],
    features: STANDARD_FEATURES,
    sort: 5,
    ...STANDARD,
  },
];

export const ADD_ON_SEED: (typeof addOns.$inferInsert)[] = [
  { id: "airport-in", name: "Airport transportation - check in", price: 850_000, sort: 1 },
  { id: "potano-in", name: "Poto Tano transportation - check in", price: 350_000, sort: 2 },
  { id: "potano-out", name: "Poto Tano transportation - check out", price: 350_000, sort: 3 },
  { id: "airport-out", name: "Airport transportation - check out", price: 850_000, sort: 4 },
];

export async function seedDatabase(db: Db) {
  await db.insert(roomTypes).values(ROOM_TYPE_SEED).onConflictDoNothing();
  await db.insert(addOns).values(ADD_ON_SEED).onConflictDoNothing();
}
