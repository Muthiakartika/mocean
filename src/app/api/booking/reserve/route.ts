import { bookingProvider, fromThisSite, rateLimited } from "@/lib/booking/server";
import { QuoteError, buildQuote, checkGuest, checkQuery } from "@/lib/booking/stay";
import type { Guest, ReservationRequest, ReservationResult } from "@/lib/booking/types";

/**
 * POST /api/booking/reserve/  (JSON ReservationRequest, src/lib/booking/types.ts)
 *
 * Never trusts the browser's prices: it searches again, prices the chosen rooms and extras itself, and only reserves
 * when that total matches what the guest saw. A repeated requestId (double click, network retry) gets the first
 * answer instead of a second reservation.
 */
export const dynamic = "force-dynamic";

const done = new Map<string, { at: number; result: ReservationResult }>();
const inFlight = new Map<string, Promise<ReservationResult>>();

const fail = (status: number, body: Omit<Extract<ReservationResult, { ok: false }>, "ok">) =>
  Response.json({ ok: false, ...body } satisfies ReservationResult, { status });

export async function POST(request: Request) {
  if (!fromThisSite(request)) return fail(403, { message: "This booking form only works on the resort's website." });
  if (rateLimited(request, "reserve", 8, 10 * 60_000)) {
    return fail(429, { message: "Too many booking attempts. Wait a few minutes, or message us on WhatsApp." });
  }

  let body: ReservationRequest;
  try {
    body = parseRequest(await request.json());
  } catch {
    return fail(400, { message: "The booking request was incomplete. Please search again." });
  }

  // Bots fill in the hidden field; answer like a success so they learn nothing, reserve nothing.
  if (body.website) {
    return Response.json({ ok: false, message: "The booking didn't go through. Please try again." } satisfies ReservationResult, { status: 400 });
  }

  const previous = done.get(body.requestId);
  if (previous) return Response.json(previous.result);
  const running = inFlight.get(body.requestId);
  if (running) return Response.json(await running);

  const work = handle(body);
  inFlight.set(body.requestId, work);
  try {
    const result = await work;
    if (result.ok) {
      done.set(body.requestId, { at: Date.now(), result });
      for (const [key, entry] of done) if (Date.now() - entry.at > 30 * 60_000) done.delete(key);
    }
    return Response.json(result, { status: result.ok ? 200 : result.errors ? 422 : result.stale ? 409 : 502 });
  } finally {
    inFlight.delete(body.requestId);
  }
}

async function handle(body: ReservationRequest): Promise<ReservationResult> {
  const queryProblem = checkQuery(body.query);
  if (queryProblem) return { ok: false, message: queryProblem, stale: true };

  const errors = checkGuest(body.guest);
  if (Object.keys(errors).length) return { ok: false, message: "Check the highlighted fields.", errors };
  if (body.rooms.length === 0) return { ok: false, message: "Choose a room first.", stale: true };

  const provider = bookingProvider();
  if (!provider) return { ok: false, message: "Online booking on this page isn't available right now." };

  try {
    const availability = await provider.availability(body.query);
    let quote;
    try {
      quote = buildQuote(availability, body.rooms, body.addOns);
    } catch (error) {
      if (error instanceof QuoteError) return { ok: false, message: `${error.message} We've refreshed the rooms for you.`, stale: true };
      throw error;
    }
    // A change of more than one rupiah per room means the price moved since the guest's search.
    if (Math.abs(quote.total - body.expectedTotal) > body.rooms.length) {
      return { ok: false, message: "The price for these dates has just changed. Check the new total and confirm again.", stale: true };
    }

    const booked = await provider.reserve(body, availability, quote);
    const final = { ...quote, total: booked.total ?? quote.total, deposit: booked.deposit ?? quote.deposit };
    return {
      ok: true,
      reservationId: booked.reservationId,
      source: provider.source,
      quote: final,
      guestEmail: body.guest.email.trim(),
      ...(booked.status ? { status: booked.status } : {}),
      ...(booked.manageUrl ? { manageUrl: booked.manageUrl } : {}),
    };
  } catch (error) {
    // The room went to someone else, or its price moved, between the check above and the booking itself.
    if (error instanceof QuoteError) return { ok: false, message: `${error.message} We've refreshed the rooms for you.`, stale: true };
    console.error("[booking] reservation failed:", error);
    return {
      ok: false,
      message: "The booking didn't go through, and nothing was charged. Please try again, or message us on WhatsApp with your dates.",
    };
  }
}

/** Shape check of the JSON body; values are checked again by checkQuery / checkGuest / buildQuote. */
function parseRequest(raw: unknown): ReservationRequest {
  const value = raw as Partial<ReservationRequest>;
  const query = value.query;
  if (!query || typeof query.checkIn !== "string" || typeof query.checkOut !== "string") throw new Error("query");
  if (!Array.isArray(value.rooms) || value.rooms.length > 10 || !Array.isArray(value.addOns) || value.addOns.length > 20) throw new Error("items");
  if (typeof value.requestId !== "string" || value.requestId.length < 8 || value.requestId.length > 80) throw new Error("requestId");
  const text = (input: unknown, max: number) => (typeof input === "string" ? input.trim().slice(0, max) : "");
  const guest = (value.guest ?? {}) as Partial<Guest>;

  return {
    query: {
      checkIn: query.checkIn,
      checkOut: query.checkOut,
      adults: Number(query.adults),
      children: Number(query.children),
      ...(query.promoCode ? { promoCode: text(query.promoCode, 40) } : {}),
    },
    rooms: value.rooms.map((room) => ({
      roomTypeId: String(room.roomTypeId),
      rateId: String(room.rateId),
      adults: Number(room.adults),
      children: Number(room.children),
    })),
    addOns: value.addOns.map((addOn) => ({ addOnId: String(addOn.addOnId), quantity: Number(addOn.quantity) })),
    guest: {
      firstName: text(guest.firstName, 100),
      lastName: text(guest.lastName, 100),
      email: text(guest.email, 100),
      phone: text(guest.phone, 100),
      country: text(guest.country, 2).toUpperCase(),
      zip: text(guest.zip, 20) || undefined,
      arrivalTime: text(guest.arrivalTime, 5) || undefined,
      notes: text(guest.notes, 1000) || undefined,
    },
    expectedTotal: Number(value.expectedTotal),
    requestId: value.requestId,
    website: text(value.website, 200),
  };
}
