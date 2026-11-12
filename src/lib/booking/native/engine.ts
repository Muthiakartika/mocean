import { addDays, nightsBetween } from "@/lib/booking/stay";
import type { RateOffer } from "@/lib/booking/types";

/**
 * Pure rules of the resort's own booking system: which nights a stay covers, what a night costs, how many rooms are free.
 * No database in here, so every rule can be tested alone (tests/booking-engine.test.ts). The queries that feed these
 * functions are in store.ts.
 *
 * Ranges are half-open: [startsOn, endsOn). A guest who leaves on the 13th does not hold the night of the 13th.
 */

export type Season = "low" | "shoulder" | "high";
export type SeasonRange = { season: "shoulder" | "high"; startsOn: string; endsOn: string };
export type PriceRow = { priceLow: number; priceShoulder: number; priceHigh: number };
/** Rooms of one type that are not for sale on some nights: blocked by staff, or held by a reservation. */
export type Hold = { startsOn: string; endsOn: string; units: number };

export type RateSettings = { extendedStayMinNights: number; extendedStayDiscountPct: number };

export const covers = (range: { startsOn: string; endsOn: string }, day: string) => range.startsOn <= day && day < range.endsOn;

/** The nights of a stay: check-in day up to, not including, check-out day. */
export function stayDays(checkIn: string, checkOut: string): string[] {
  const nights = nightsBetween(checkIn, checkOut);
  return Array.from({ length: Math.max(0, nights) }, (_, index) => addDays(checkIn, index));
}

/** High season wins over shoulder season where two ranges overlap; a date in no range is low season. */
export function seasonOn(day: string, ranges: SeasonRange[]): Season {
  let season: Season = "low";
  for (const range of ranges) {
    if (!covers(range, day)) continue;
    if (range.season === "high") return "high";
    season = "shoulder";
  }
  return season;
}

export function nightlyRate(room: PriceRow, day: string, ranges: SeasonRange[]): number {
  const season = seasonOn(day, ranges);
  return season === "high" ? room.priceHigh : season === "shoulder" ? room.priceShoulder : room.priceLow;
}

/** How many nights this many rooms are used on one day. */
export function usedOn(day: string, holds: Hold[]): number {
  return holds.reduce((sum, hold) => (covers(hold, day) ? sum + hold.units : sum), 0);
}

/** Rooms free on EVERY night of the stay (the least free night decides). */
export function freeUnits(units: number, days: string[], holds: Hold[]): number {
  if (days.length === 0) return 0;
  return Math.max(0, units - Math.max(...days.map((day) => usedOn(day, holds))));
}

const WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];

/**
 * The rates offered for one room type: the standard rate, and the extended-stay rate (a percentage off every night)
 * when the stay is long enough. The extended rate comes first, like on the Cloudbeds page.
 */
export function ratesForStay(roomTypeId: string, days: string[], nightly: number[], settings: RateSettings): RateOffer[] {
  const standard: RateOffer = {
    rateId: `${roomTypeId}-standard`,
    name: "Standard Rate",
    total: sum(nightly),
    nightly: days.map((date, index) => ({ date, rate: nightly[index] })),
  };
  const { extendedStayMinNights: minNights, extendedStayDiscountPct: percent } = settings;
  if (percent <= 0 || minNights < 1 || days.length < minNights) return [standard];

  const discounted = nightly.map((rate) => Math.round(rate * (1 - percent / 100)));
  const extended: RateOffer = {
    rateId: `${roomTypeId}-extended`,
    ratePlanId: "extended-stay",
    name: `Extended Stay - ${WORDS[minNights] ?? minNights} Night${minNights === 1 ? "" : "s"} or More`,
    total: sum(discounted),
    compareAtTotal: standard.total,
    nightly: days.map((date, index) => ({ date, rate: discounted[index] })),
  };
  return [extended, standard];
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}
