/**
 * Data of the site's own booking engine (/book/), shared by the browser and the server.
 *
 * The server fills these from the Cloudbeds API (src/lib/cloudbeds/) or, without API credentials, from the demo data
 * (src/lib/booking/demo.ts). The browser never talks to Cloudbeds itself: the API key stays on the server.
 */

/** What the guest searches for. Dates are YYYY-MM-DD in the resort's time zone. */
export type StayQuery = {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  promoCode?: string;
};

/** One bookable price of a room type for the whole stay (a Cloudbeds rate: room type x rate plan). */
export type RateOffer = {
  /** Cloudbeds rateID; postReservation takes it as roomRateID. */
  rateId: string;
  /** Rate plan the price belongs to; absent for the base rate. */
  ratePlanId?: string;
  /** Public name, e.g. "Standard Rate" or "Extended Stay - Three Nights or More". */
  name: string;
  /** Total for one room over the whole stay, as Cloudbeds prices it (the resort's rates include tax and service). */
  total: number;
  /** The base rate's total for the same stay when this rate is lower, to show the saving. */
  compareAtTotal?: number;
  /** Price of each night. */
  nightly: { date: string; rate: number }[];
};

/** A room type with what is free for the searched stay. */
export type RoomOffer = {
  roomTypeId: string;
  name: string;
  description: string;
  maxGuests: number;
  photos: string[];
  features: string[];
  /** Rooms of this type still free on every night of the stay. */
  available: number;
  rates: RateOffer[];
};

/** Something bookable with the stay (Cloudbeds item / add-on), e.g. an airport transfer. */
export type AddOn = {
  id: string;
  name: string;
  description?: string;
  /** Price of one unit, tax included like the room rates. */
  price: number;
};

/** Where the rooms and reservations live: Cloudbeds, the resort's own database (src/lib/booking/native/), or sample data. */
export type BookingSource = "cloudbeds" | "native" | "demo";

/** How the deposit is worked out (own database only; without it, the first night of each room). */
export type DepositPolicy = { mode: "first-night" | "full" } | { mode: "percent"; percent: number };

/** Answer of GET /api/booking/availability. */
export type Availability = {
  query: StayQuery;
  nights: number;
  currency: string;
  rooms: RoomOffer[];
  addOns: AddOn[];
  /** Tax and service already in the prices (0.221: a price is 122.1% of its net amount). */
  includedTaxRate: number;
  /** Tax charged on top of the prices, when the property has exclusive taxes (0 or absent: none). */
  addedTaxRate?: number;
  /** "demo" while the site runs without Cloudbeds credentials: nothing is reserved. */
  source: BookingSource;
  /** How much the guest pays to confirm (own database). Absent: the first night of each room. */
  depositPolicy?: DepositPolicy;
};

/** A room the guest put in the stay. */
export type CartRoom = {
  roomTypeId: string;
  rateId: string;
  adults: number;
  children: number;
};

export type CartAddOn = {
  addOnId: string;
  quantity: number;
};

export type Guest = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  /** ISO 3166-1 alpha-2, as Cloudbeds expects it. */
  country: string;
  /** Postal code, optional. */
  zip?: string;
  /** "HH:MM", optional. */
  arrivalTime?: string;
  /** Requests for the resort, kept as a note on the reservation. */
  notes?: string;
};

/** Body of POST /api/booking/reserve. */
export type ReservationRequest = {
  query: StayQuery;
  rooms: CartRoom[];
  addOns: CartAddOn[];
  guest: Guest;
  /** The total the guest saw; the server refuses the booking if its own price differs. */
  expectedTotal: number;
  /** Random id of this attempt: a repeated request (double click, retry) gets the first answer instead of a second booking. */
  requestId: string;
  /** Honeypot: people leave it empty. */
  website?: string;
};

export type QuoteLine = { label: string; detail?: string; amount: number };

export type Quote = {
  lines: QuoteLine[];
  /** Total without tax and service. */
  net: number;
  /** Tax and service included in the total. */
  taxes: number;
  total: number;
  /** Paid now to hold the booking: the first night of each room. */
  deposit: number;
};

export type ReservationResult =
  | {
      ok: true;
      reservationId: string;
      source: BookingSource;
      quote: Quote;
      guestEmail: string;
      /** "pending": a request the resort still has to confirm (own database only). Absent: nothing to wait for. */
      status?: "pending" | "confirmed";
      /** The guest's page for this booking, /book/manage/?code=..&t=.. (own database only). */
      manageUrl?: string;
      /** The guest can pay the deposit now: on their booking page online, and/or by bank transfer (own database only). */
      payNow?: { online: boolean; bank: boolean };
    }
  | {
      ok: false;
      message: string;
      /** Per field, for the guest form. */
      errors?: Partial<Record<keyof Guest, string>>;
      /** True when the price or availability changed since the search: search again. */
      stale?: boolean;
    };
