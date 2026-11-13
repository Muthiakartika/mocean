import { property } from "@/config/property";
import type { Availability, CartAddOn, CartRoom, Guest, Quote, QuoteLine, StayQuery } from "./types";

/**
 * Pure helpers of the booking engine, used by the browser (to show the summary) and by the server (which prices the
 * booking again before it reserves anything, so a changed request cannot change the price).
 */

export const LIMITS = {
  maxNights: 30,
  maxAdults: 12,
  maxChildren: 8,
  maxRooms: 10,
  /** How far ahead the calendar lets guests book. */
  maxMonthsAhead: 18,
} as const;

const DAY = 86_400_000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** "2026-12-10" -> Date at UTC midnight (dates are calendar days, never times). */
export function parseDay(value: string): Date | null {
  if (!ISO_DATE.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || toDay(date) !== value ? null : date;
}

export function toDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(day: string, days: number): string {
  const date = parseDay(day);
  return date ? toDay(new Date(date.getTime() + days * DAY)) : day;
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  const start = parseDay(checkIn);
  const end = parseDay(checkOut);
  return start && end ? Math.round((end.getTime() - start.getTime()) / DAY) : 0;
}

const dayFormats = new Map<string, Intl.DateTimeFormat>();

/** The calendar day it is right now in a time zone ("2026-11-12"), whatever the clock of the server or the guest says. */
export function todayIn(timeZone: string, now = new Date()): string {
  let format = dayFormats.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
    dayFormats.set(timeZone, format);
  }
  const parts = format.formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

/**
 * Today at the property (its time zone is in src/config/property.ts), so a late-evening search from another continent
 * does not offer yesterday.
 */
export function resortToday(now = new Date()): string {
  return todayIn(property.timeZone, now);
}

/** "Thu, Dec 10, 2026" */
export function formatDay(day: string, options: Intl.DateTimeFormatOptions = {}): string {
  const date = parseDay(day);
  if (!date) return day;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
    ...options,
  }).format(date);
}

/**
 * "IDR 2,200,000", in the property's currency unless another is given. Whole amounts only (rupiah have no cents in
 * practice; Cloudbeds' .40 splits of tax are rounded for display).
 */
export function formatMoney(amount: number, currency: string = property.currency): string {
  return `${currency} ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(amount))}`;
}

/** Checks a search; returns an error message for the guest, or null when it can be searched. */
export function checkQuery(query: StayQuery, today = resortToday()): string | null {
  const start = parseDay(query.checkIn);
  const end = parseDay(query.checkOut);
  if (!start || !end) return "Choose your check-in and check-out dates.";
  if (query.checkIn < today) return "Check-in can't be in the past.";
  const nights = nightsBetween(query.checkIn, query.checkOut);
  if (nights < 1) return "Check-out must be after check-in.";
  if (nights > LIMITS.maxNights) return `For stays longer than ${LIMITS.maxNights} nights, message us on WhatsApp.`;
  if (!Number.isInteger(query.adults) || query.adults < 1 || query.adults > LIMITS.maxAdults) return "Choose at least one adult.";
  if (!Number.isInteger(query.children) || query.children < 0 || query.children > LIMITS.maxChildren) return "Check the number of children.";
  return null;
}

/** Reads a search from URL parameters (the same names as the Cloudbeds booking engine: checkin, checkout, adults). */
export function queryFromParams(params: URLSearchParams): StayQuery | null {
  const checkIn = params.get("checkin") ?? "";
  const checkOut = params.get("checkout") ?? "";
  if (!checkIn || !checkOut) return null;
  const promo = params.get("promo")?.trim();
  return {
    checkIn,
    checkOut,
    adults: clampInt(params.get("adults"), 1, LIMITS.maxAdults, 2),
    children: clampInt(params.get("children"), 0, LIMITS.maxChildren, 0),
    ...(promo ? { promoCode: promo.slice(0, 40) } : {}),
  };
}

export function queryToParams(query: StayQuery): URLSearchParams {
  const params = new URLSearchParams({
    checkin: query.checkIn,
    checkout: query.checkOut,
    adults: String(query.adults),
    children: String(query.children),
  });
  if (query.promoCode) params.set("promo", query.promoCode);
  return params;
}

function clampInt(value: string | null, min: number, max: number, fallback: number) {
  const number = Number.parseInt(value ?? "", 10);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

/** Prices the rooms and add-ons the guest chose. Throws when something is no longer offered. */
export function buildQuote(availability: Availability, rooms: CartRoom[], addOns: CartAddOn[]): Quote {
  const lines: QuoteLine[] = [];
  let deposit = 0;

  rooms.forEach((cartRoom) => {
    const room = availability.rooms.find((offer) => offer.roomTypeId === cartRoom.roomTypeId);
    const rate = room?.rates.find((offer) => offer.rateId === cartRoom.rateId);
    if (!room || !rate) throw new QuoteError("A room you chose is no longer offered for these dates.");
    const guests = cartRoom.adults + cartRoom.children;
    if (cartRoom.adults < 1 || guests > room.maxGuests) {
      throw new QuoteError(`${room.name} takes up to ${room.maxGuests} guests.`);
    }
    lines.push({ label: room.name, detail: rate.name, amount: rate.total });
    deposit += rate.nightly[0]?.rate ?? rate.total / Math.max(1, availability.nights);
  });

  // Not more rooms of a type than are free.
  for (const room of availability.rooms) {
    const chosen = rooms.filter((cartRoom) => cartRoom.roomTypeId === room.roomTypeId).length;
    if (chosen > room.available) throw new QuoteError(`Only ${room.available} ${room.name} left for these dates.`);
  }

  addOns.forEach((cartAddOn) => {
    const addOn = availability.addOns.find((offer) => offer.id === cartAddOn.addOnId);
    if (!addOn) throw new QuoteError("An add-on you chose is no longer offered.");
    if (!Number.isInteger(cartAddOn.quantity) || cartAddOn.quantity < 1 || cartAddOn.quantity > 20) {
      throw new QuoteError(`Check the quantity of ${addOn.name}.`);
    }
    lines.push({
      label: addOn.name,
      detail: cartAddOn.quantity > 1 ? `${cartAddOn.quantity} x ${formatMoney(addOn.price, availability.currency)}` : undefined,
      amount: addOn.price * cartAddOn.quantity,
    });
  });

  const prices = lines.reduce((sum, line) => sum + line.amount, 0);
  const net = prices / (1 + availability.includedTaxRate);
  const total = prices * (1 + (availability.addedTaxRate ?? 0));
  // The property's own rule when it has one (a percentage, or everything); otherwise the first night of each room.
  const policy = availability.depositPolicy;
  if (policy?.mode === "full") deposit = total;
  else if (policy?.mode === "percent") deposit = Math.round((total * Math.min(100, Math.max(0, policy.percent))) / 100);
  return { lines, net, taxes: total - net, total, deposit: Math.min(deposit, total) };
}

export class QuoteError extends Error {}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Checks the guest form; the same rules run in the browser and on the server. */
export function checkGuest(guest: Guest): Partial<Record<keyof Guest, string>> {
  const errors: Partial<Record<keyof Guest, string>> = {};
  if (!guest.firstName.trim()) errors.firstName = "Enter your first name.";
  if (!guest.lastName.trim()) errors.lastName = "Enter your last name.";
  if (!EMAIL.test(guest.email.trim())) errors.email = "Enter a valid email address.";
  if (guest.phone.replace(/\D/g, "").length < 6) errors.phone = "Enter a phone number we can reach you on.";
  if (!/^[A-Z]{2}$/.test(guest.country)) errors.country = "Choose your country.";
  if (guest.arrivalTime && !/^\d{2}:\d{2}$/.test(guest.arrivalTime)) errors.arrivalTime = "Choose an arrival time.";
  if ((guest.notes ?? "").length > 1000) errors.notes = "Keep requests under 1,000 characters.";
  if ((guest.zip ?? "").length > 20) errors.zip = "That postal code is too long.";
  for (const key of ["firstName", "lastName", "email", "phone"] as const) {
    if (guest[key].length > 100) errors[key] = "That is too long.";
  }
  return errors;
}
