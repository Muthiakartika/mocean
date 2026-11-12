import { getDb } from "@/lib/db";
import type { BookingProvider } from "@/lib/booking/server";
import { sendBookingReceived } from "./emails";
import { managePath } from "./guest-link";
import { loadSettings } from "./settings";
import { createReservation, getReservation, loadAvailability } from "./store";

/**
 * /book/ on the resort's own database (src/lib/booking/native/), chosen with BOOKING_PROVIDER=native
 * (see bookingProvider in src/lib/booking/server.ts).
 */
export const nativeProvider: BookingProvider = {
  source: "native",

  async availability(query) {
    return loadAvailability(await getDb(), query);
  },

  async reserve(request, _availability, quote) {
    const db = await getDb();
    const made = await createReservation(db, {
      query: request.query,
      rooms: request.rooms,
      addOns: request.addOns,
      guest: request.guest,
      source: "web",
      requestId: request.requestId,
      // The route priced the stay a moment ago; the transaction prices it again under lock and refuses a moved price.
      expectedTotal: quote.total,
    });

    // After the booking is safe in the database: emails never decide whether a guest gets a room.
    const [detail, settings] = await Promise.all([getReservation(db, made.code), loadSettings(db)]);
    if (detail) await sendBookingReceived(detail, settings.pendingHoldHours);

    return {
      reservationId: made.code,
      total: made.total,
      deposit: made.deposit,
      status: made.status === "confirmed" ? "confirmed" : "pending",
      // The guest's own page for this booking (see it, cancel it, write to the resort).
      ...(request.guest.email ? { manageUrl: managePath(made.code, request.guest.email) } : {}),
    };
  },
};
