import type { BookingProvider } from "@/lib/booking/server";
import { addDays, nightsBetween } from "@/lib/booking/stay";
import type { AddOn, Availability, RateOffer, RoomOffer, StayQuery } from "@/lib/booking/types";
import { cloudbedsGet, cloudbedsPost, propertyId } from "./client";

/**
 * The booking engine on Cloudbeds (API v1.3). Environment, besides the key and property ID (client.ts):
 *
 *   CLOUDBEDS_PAYMENT_METHOD      paymentMethod of new reservations: cash | credit | ebanking | pay_pal (default cash).
 *                                 No money is taken here; see docs/booking-engine.md for the deposit options.
 *   CLOUDBEDS_SEND_EMAIL          "false" stops Cloudbeds sending its confirmation email (default: it sends it)
 *   CLOUDBEDS_SOURCE_ID           optional reservation source; left out, Cloudbeds files it as Website / Booking engine
 *   CLOUDBEDS_ADDON_ITEM_IDS      item IDs (Cloudbeds Items & Services) offered as extras, comma-separated, in that order
 *   BOOKING_INCLUDED_TAX_RATE     optional override of the tax and service share in the rates, e.g. 0.221
 */
export function cloudbedsConfigured() {
  return Boolean(process.env.CLOUDBEDS_API_KEY && process.env.CLOUDBEDS_PROPERTY_ID);
}

/* ---------- Cloudbeds answers (only the fields used) ---------- */

type CbRoomType = {
  roomTypeID: string;
  roomTypeName: string;
  roomTypeDescription?: string;
  maxGuests?: number | string;
  roomTypePhotos?: (string | { image?: string; thumb?: string })[];
  roomTypeFeatures?: string[] | Record<string, string>;
};

type CbRate = {
  rateID: string;
  ratePlanID?: string | null;
  ratePlanNamePublic?: string | null;
  roomTypeID: string;
  roomRate?: number;
  totalRate?: number;
  roomsAvailable?: number;
  promoCode?: string | null;
  roomRateDetailed?: {
    date: string;
    rate?: number;
    rateBase?: number;
    totalRate?: number;
    roomsAvailable?: number;
    closedToArrival?: boolean;
    closedToDeparture?: boolean;
    blocked?: boolean;
    minLos?: number;
    maxLos?: number;
  }[];
};

type CbTaxOrFee = {
  type?: string;
  name?: string;
  amount?: number | string;
  amountType?: string;
  inclusiveOrExclusive?: string;
};

type CbItem = {
  itemID: string;
  name: string;
  description?: string;
  price?: number | string;
  grandTotal?: number | string;
  stopSell?: boolean;
};

/* ---------- Cache of what rarely changes ---------- */

const cache = new Map<string, { at: number; value: Promise<unknown> }>();

function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value as Promise<T>;
  const value = load();
  cache.set(key, { at: Date.now(), value });
  // A failed load is not kept.
  value.catch(() => cache.delete(key));
  return value;
}

const TEN_MINUTES = 10 * 60_000;

function roomTypes() {
  return cached("roomTypes", TEN_MINUTES, async () => {
    const answer = await cloudbedsGet<{ data: CbRoomType[] }>("getRoomTypes", { propertyIDs: propertyId(), pageSize: 100 });
    return answer.data ?? [];
  });
}

function currency() {
  return cached("currency", 60 * 60_000, async () => {
    const answer = await cloudbedsGet<{ data: { propertyCurrency?: { currencyCode?: string } } }>("getHotelDetails", {
      propertyID: propertyId(),
    });
    return answer.data?.propertyCurrency?.currencyCode || "IDR";
  });
}

/**
 * Tax and service in the prices: inclusive percentage taxes and fees, compounded (in Indonesia service is usually
 * taxed too; 10% service and 11% tax make 22.1%, the share the Cloudbeds page showed). Exclusive ones are added on top.
 */
function taxRates() {
  return cached("taxes", TEN_MINUTES, async () => {
    const override = Number.parseFloat(process.env.BOOKING_INCLUDED_TAX_RATE ?? "");
    const answer = await cloudbedsGet<{ data: CbTaxOrFee[] }>("getTaxesAndFees", { propertyID: propertyId() });
    let included = 1;
    let added = 1;
    for (const item of answer.data ?? []) {
      const amount = Number(item.amount);
      if (item.amountType !== "percentage" || !Number.isFinite(amount) || amount <= 0) continue;
      if (item.inclusiveOrExclusive === "exclusive") added *= 1 + amount / 100;
      else included *= 1 + amount / 100;
    }
    return { included: Number.isFinite(override) ? override : included - 1, added: added - 1 };
  });
}

function addOns() {
  const ids = (process.env.CLOUDBEDS_ADDON_ITEM_IDS ?? "").split(",").map((id) => id.trim()).filter(Boolean);
  if (ids.length === 0) return Promise.resolve<AddOn[]>([]);
  return cached("addOns", TEN_MINUTES, async () => {
    const answer = await cloudbedsGet<{ data: CbItem[] }>("getItems", { propertyID: propertyId() });
    const items = new Map((answer.data ?? []).map((item) => [String(item.itemID), item]));
    return ids.flatMap((id) => {
      const item = items.get(id);
      const price = Number(item?.grandTotal ?? item?.price);
      if (!item || item.stopSell || !Number.isFinite(price)) return [];
      return [{ id, name: item.name, description: item.description || undefined, price }];
    });
  });
}

/* ---------- Mapping ---------- */

function photosOf(room: CbRoomType): string[] {
  return (room.roomTypePhotos ?? [])
    .map((photo) => (typeof photo === "string" ? photo : photo.image || photo.thumb || ""))
    .filter((url) => url.startsWith("https://"));
}

function featuresOf(room: CbRoomType): string[] {
  const features = room.roomTypeFeatures ?? [];
  return (Array.isArray(features) ? features : Object.values(features)).filter((feature): feature is string => typeof feature === "string");
}

/** Drops HTML that Cloudbeds descriptions may carry and collapses whitespace. */
function plainText(html = "") {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/** Can this rate be booked for exactly these dates (free every night, no closed arrival, length of stay allowed)? */
function bookable(rate: CbRate, query: StayQuery, nights: number) {
  if (!(Number(rate.roomsAvailable) > 0) || !(Number(rate.totalRate ?? rate.roomRate) > 0)) return false;
  const days = rate.roomRateDetailed ?? [];
  if (days.some((day) => day.blocked || (day.roomsAvailable !== undefined && Number(day.roomsAvailable) <= 0))) return false;
  const first = days.find((day) => day.date === query.checkIn) ?? days[0];
  if (first?.closedToArrival) return false;
  if (first?.minLos && nights < Number(first.minLos)) return false;
  if (first?.maxLos && Number(first.maxLos) > 0 && nights > Number(first.maxLos)) return false;
  const departure = days.find((day) => day.date === query.checkOut);
  if (departure?.closedToDeparture) return false;
  return true;
}

async function availability(query: StayQuery): Promise<Availability> {
  const nights = nightsBetween(query.checkIn, query.checkOut);
  const [types, code, taxes, extras] = await Promise.all([roomTypes(), currency(), taxRates(), addOns()]);

  // Rates are per room. Price the party's occupancy, capped at what the smallest room takes; Cloudbeds prices the
  // final occupancy of each room when the reservation is made, and the confirmation shows that total.
  const smallest = Math.min(...types.map((type) => Number(type.maxGuests) || 2), 99);
  const adults = Math.max(1, Math.min(query.adults, smallest));
  const children = Math.max(0, Math.min(query.children, smallest - adults));

  const answer = await cloudbedsGet<{ data: CbRate[] }>("getRatePlans", {
    propertyIDs: propertyId(),
    startDate: query.checkIn,
    endDate: query.checkOut,
    adults,
    children,
    detailedRates: true,
    promoCode: query.promoCode,
    // Rate plans behind a promo code only show when the guest entered one.
    includePromoCode: Boolean(query.promoCode),
  });

  const ratesByType = new Map<string, CbRate[]>();
  for (const rate of answer.data ?? []) {
    if (!bookable(rate, query, nights)) continue;
    const list = ratesByType.get(String(rate.roomTypeID)) ?? [];
    list.push(rate);
    ratesByType.set(String(rate.roomTypeID), list);
  }

  const rooms: RoomOffer[] = [];
  for (const type of types) {
    const rates = ratesByType.get(String(type.roomTypeID));
    if (!rates?.length) continue;
    const base = rates.find((rate) => !rate.ratePlanID);
    const baseTotal = base ? Number(base.totalRate ?? base.roomRate) : undefined;
    const offers: RateOffer[] = rates
      .map((rate) => {
        const total = Number(rate.totalRate ?? rate.roomRate);
        return {
          rateId: String(rate.rateID),
          ratePlanId: rate.ratePlanID ? String(rate.ratePlanID) : undefined,
          name: rate.ratePlanNamePublic?.trim() || "Standard Rate",
          total,
          compareAtTotal: baseTotal && baseTotal > total ? baseTotal : undefined,
          nightly: Array.from({ length: nights }, (_, index) => {
            const date = addDays(query.checkIn, index);
            const day = rate.roomRateDetailed?.find((detail) => detail.date === date);
            return { date, rate: Number(day?.totalRate ?? day?.rate ?? day?.rateBase ?? total / nights) };
          }),
        };
      })
      .sort((a, b) => a.total - b.total);

    rooms.push({
      roomTypeId: String(type.roomTypeID),
      name: type.roomTypeName,
      description: plainText(type.roomTypeDescription),
      maxGuests: Number(type.maxGuests) || 2,
      photos: photosOf(type),
      features: featuresOf(type),
      // Availability is per room type: every rate of a type shares it.
      available: Math.min(...rates.map((rate) => Number(rate.roomsAvailable) || 0)),
      rates: offers,
    });
  }

  return {
    query,
    nights,
    currency: code,
    rooms,
    addOns: extras,
    includedTaxRate: taxes.included,
    addedTaxRate: taxes.added,
    source: "cloudbeds",
  };
}

/* ---------- Reservation ---------- */

type CbReservationAnswer = { reservationID: string; status?: string; grandTotal?: number };
type CbReservationDetails = { data?: { total?: number; balanceDetailed?: { suggestedDeposit?: number | string; grandTotal?: number | string } } };

export const cloudbedsProvider: BookingProvider = {
  source: "cloudbeds",
  availability,

  async reserve(request, availabilityNow) {
    const { query, guest, rooms } = request;
    const body = new URLSearchParams({
      propertyID: propertyId(),
      startDate: query.checkIn,
      endDate: query.checkOut,
      guestFirstName: guest.firstName,
      guestLastName: guest.lastName,
      guestEmail: guest.email,
      guestPhone: guest.phone,
      guestCountry: guest.country,
      paymentMethod: process.env.CLOUDBEDS_PAYMENT_METHOD || "cash",
      sendEmailConfirmation: process.env.CLOUDBEDS_SEND_EMAIL === "false" ? "false" : "true",
      // Our reference of the attempt, so the reservation can be traced back to the site's request.
      thirdPartyIdentifier: `web-${request.requestId}`.slice(0, 60),
    });
    if (guest.zip) body.set("guestZip", guest.zip);
    if (guest.arrivalTime) body.set("estimatedArrivalTime", guest.arrivalTime);
    if (query.promoCode) body.set("promoCode", query.promoCode);
    if (process.env.CLOUDBEDS_SOURCE_ID) body.set("sourceID", process.env.CLOUDBEDS_SOURCE_ID);
    // One entry per room, same index in rooms / adults / children (as in Cloudbeds' multi-room example).
    rooms.forEach((room, index) => {
      body.set(`rooms[${index}][roomTypeID]`, room.roomTypeId);
      body.set(`rooms[${index}][quantity]`, "1");
      body.set(`rooms[${index}][roomRateID]`, room.rateId);
      body.set(`adults[${index}][roomTypeID]`, room.roomTypeId);
      body.set(`adults[${index}][quantity]`, String(room.adults));
      body.set(`children[${index}][roomTypeID]`, room.roomTypeId);
      body.set(`children[${index}][quantity]`, String(room.children));
    });

    const created = await cloudbedsPost<CbReservationAnswer>("postReservation", body);
    const reservationID = String(created.reservationID);

    // The reservation exists now: what follows must not make the guest think it failed, so errors are only logged.
    const followUps: Promise<unknown>[] = [];
    if (guest.notes) {
      followUps.push(
        cloudbedsPost("postReservationNote", new URLSearchParams({ propertyID: propertyId(), reservationID, reservationNote: `Guest request (website): ${guest.notes}` })),
      );
    }
    for (const addOn of request.addOns) {
      if (!availabilityNow.addOns.some((offer) => offer.id === addOn.addOnId)) continue;
      followUps.push(
        cloudbedsPost(
          "postItem",
          new URLSearchParams({ propertyID: propertyId(), reservationID, itemID: addOn.addOnId, itemQuantity: String(addOn.quantity), itemPaid: "false" }),
        ),
      );
    }
    for (const outcome of await Promise.allSettled(followUps)) {
      if (outcome.status === "rejected") console.error(`[booking] reservation ${reservationID}: follow-up failed:`, outcome.reason);
    }

    // Cloudbeds' own figures: the final total (extra guests, taxes) and the deposit its policies suggest.
    try {
      const details = await cloudbedsGet<CbReservationDetails>("getReservation", { propertyID: propertyId(), reservationID });
      const total = Number(details.data?.balanceDetailed?.grandTotal ?? details.data?.total);
      const deposit = Number(details.data?.balanceDetailed?.suggestedDeposit);
      return {
        reservationId: reservationID,
        total: Number.isFinite(total) && total > 0 ? total : undefined,
        deposit: Number.isFinite(deposit) && deposit > 0 ? deposit : undefined,
      };
    } catch (error) {
      console.error(`[booking] reservation ${reservationID}: getReservation failed:`, error);
      return { reservationId: reservationID };
    }
  },
};
