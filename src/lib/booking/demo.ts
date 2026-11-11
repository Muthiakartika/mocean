import { addDays, nightsBetween } from "./stay";
import type { AddOn, Availability, RoomOffer, StayQuery } from "./types";

/**
 * Demo data for /book/ while the site has no Cloudbeds API credentials (local development and previews).
 * Copied from the resort's Cloudbeds booking engine on 2026-11-11 (search Dec 10-13, 2026, 2 adults): the five room
 * types, their descriptions, the low-season rates, the "three nights or more" rate (5% off) and the transfer add-ons.
 * Nothing here is reserved: the reserve route answers with a DEMO number.
 */

const BUNGALOW_TEXT =
  "The spacious double room offers air conditioning, a tea and coffee maker, a terrace with garden views as well as a private bathroom featuring a walk-in shower.";

const ROOMS: (Omit<RoomOffer, "rates" | "available"> & { nightly: number; units: number })[] = [
  {
    roomTypeId: "demo-dlx-king",
    name: "Deluxe King Bungalow with Garden View",
    description: `${BUNGALOW_TEXT} The unit offers 1 bed.`,
    maxGuests: 3,
    photos: ["/images/uploads/2025/09/accommodation_galery_12.jpg"],
    features: ["Air conditioning", "Garden view terrace", "Walk-in shower", "Tea and coffee maker", "Hairdryer"],
    nightly: 2_200_000,
    units: 4,
  },
  {
    roomTypeId: "demo-dlx-queen",
    name: "Deluxe Queen Bungalow with Garden View",
    description: `${BUNGALOW_TEXT} The unit offers 1 bed.`,
    maxGuests: 3,
    photos: ["/images/uploads/2025/09/accommodation_galery_12.jpg"],
    features: ["Air conditioning", "Garden view terrace", "Walk-in shower", "Tea and coffee maker", "Hairdryer"],
    nightly: 2_200_000,
    units: 1,
  },
  {
    roomTypeId: "demo-dlx-twin",
    name: "Deluxe Twin Bungalow with Garden View",
    description: `${BUNGALOW_TEXT} The unit offers twin beds.`,
    maxGuests: 3,
    photos: ["/images/uploads/2025/09/accommodation_galery_6.jpg"],
    features: ["Air conditioning", "Garden view terrace", "Walk-in shower", "Tea and coffee maker", "Hairdryer"],
    nightly: 2_200_000,
    units: 1,
  },
  {
    roomTypeId: "demo-std-king",
    name: "Standard King with Garden View",
    description: `${BUNGALOW_TEXT} The unit offers 1 king bed.`,
    maxGuests: 3,
    photos: ["/images/uploads/2025/10/Standard-room-King-Bed.jpg"],
    features: ["Air conditioning", "Garden view", "Walk-in shower", "Tea and coffee maker"],
    nightly: 1_690_000,
    units: 2,
  },
  {
    roomTypeId: "demo-std-twin",
    name: "Standard Twin with Garden View",
    description: `${BUNGALOW_TEXT} The unit offers twin beds.`,
    maxGuests: 3,
    photos: ["/images/uploads/2025/09/Standard-room.jpg"],
    features: ["Air conditioning", "Garden view", "Walk-in shower", "Tea and coffee maker"],
    nightly: 1_690_000,
    units: 2,
  },
];

const ADD_ONS: AddOn[] = [
  { id: "demo-airport-in", name: "Airport transportation - check in", price: 850_000 },
  { id: "demo-potano-in", name: "Poto Tano transportation - check in", price: 350_000 },
  { id: "demo-potano-out", name: "Poto Tano transportation - check out", price: 350_000 },
  { id: "demo-airport-out", name: "Airport transportation - check out", price: 850_000 },
];

/** Stays of three nights or more get the "Extended Stay" rate, 5% under the standard rate (as on Cloudbeds). */
const EXTENDED_STAY = { minNights: 3, discount: 0.05 };

export function demoAvailability(query: StayQuery): Availability {
  const nights = nightsBetween(query.checkIn, query.checkOut);
  const dates = Array.from({ length: nights }, (_, index) => addDays(query.checkIn, index));

  // Every type is offered: a group combines rooms of different types.
  const rooms: RoomOffer[] = ROOMS.map(({ nightly, units, ...room }) => {
    const standard = {
      rateId: `${room.roomTypeId}-standard`,
      name: "Standard Rate",
      total: nightly * nights,
      nightly: dates.map((date) => ({ date, rate: nightly })),
    };
    const rates = [standard];
    if (nights >= EXTENDED_STAY.minNights) {
      const discounted = Math.round(nightly * (1 - EXTENDED_STAY.discount));
      rates.unshift({
        rateId: `${room.roomTypeId}-extended`,
        name: "Extended Stay - Three Nights or More",
        total: discounted * nights,
        nightly: dates.map((date) => ({ date, rate: discounted })),
        ...{ ratePlanId: "demo-extended", compareAtTotal: standard.total },
      });
    }
    return { ...room, available: units, rates };
  });

  return {
    query,
    nights,
    currency: "IDR",
    rooms,
    addOns: ADD_ONS,
    // Cloudbeds showed IDR 6,600,000 as 5,405,405.40 + 1,194,594.60 taxes and fees: 22.1% on top of the net price.
    includedTaxRate: 0.221,
    source: "demo",
  };
}
