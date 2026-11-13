import { asc, count, eq, like } from "drizzle-orm";
import type { Db } from "@/lib/db";
import { blocks, reservations, roomTypes } from "@/lib/db/schema";
import { addDays, resortToday } from "@/lib/booking/stay";
import { addBlock } from "./admin-store";
import { recordPayment } from "./payments";
import { cancelReservation, createReservation, loadAvailability, requestCancellation } from "./store";

/**
 * Sample bookings for the trial version (src/lib/booking/native/trial.ts), so the owner and staff see a working week on
 * Today, Bookings, Calendar and Reports and can try confirming, cancelling and recording payments.
 *
 * Every date is counted from today, so the samples look current whenever they are added. They are made through the
 * same createReservation as real bookings (prices from the current rates), with made-up guests at example.com addresses
 * that no email can reach. They are marked by a request id starting with "sample-" (and the block by its reason), and
 * "remove" deletes exactly those, with their rooms, extras and payments; nothing else is touched.
 *
 * Room types are taken by position (the first, the second...), so this works for any property's rooms.
 */
const MARK = "sample-";
const BLOCK_REASON = "Sample: roof repairs";

type Sample = {
  first: string;
  last: string;
  /** ISO country code, as the booking form stores it. */
  country: string;
  /** Position of the room type in the admin's list (wraps around when there are fewer types). */
  type: number;
  rooms?: number;
  adults: number;
  /** Check-in, in days from today. */
  from: number;
  nights: number;
  /** Booked this many days before check-in; `hoursAgo` instead for a request made recently. */
  bookedBefore?: number;
  hoursAgo?: number;
  source: "web" | "admin";
  status: "confirmed" | "pending";
  paid?: "deposit" | "full";
  then?: "cancel" | "ask-cancel";
  transfer?: boolean;
  notes?: string;
  adminNotes?: string;
  cancelNote?: string;
};

const SAMPLES: Sample[] = [
  { first: "Anna", last: "Becker", country: "DE", type: 0, adults: 2, from: -75, nights: 5, bookedBefore: 40, source: "web", status: "confirmed", paid: "full" },
  { first: "Noah", last: "Williams", country: "AU", type: 3, adults: 2, from: -48, nights: 4, bookedBefore: 20, source: "admin", status: "confirmed", paid: "full", adminNotes: "Booked on WhatsApp." },
  { first: "Sophie", last: "Müller", country: "DE", type: 0, adults: 2, from: -20, nights: 6, bookedBefore: 35, source: "web", status: "confirmed", paid: "full" },
  { first: "Lucas", last: "Moreau", country: "FR", type: 4, adults: 3, from: -9, nights: 4, bookedBefore: 15, source: "web", status: "confirmed", paid: "full" },
  { first: "Maria", last: "Rossi", country: "IT", type: 3, adults: 2, from: -3, nights: 3, bookedBefore: 21, source: "web", status: "confirmed", paid: "full" },
  {
    first: "Sarah",
    last: "Whitfield",
    country: "AU",
    type: 0,
    rooms: 2,
    adults: 2,
    from: -2,
    nights: 5,
    bookedBefore: 30,
    source: "web",
    status: "confirmed",
    paid: "deposit",
    transfer: true,
    notes: "Pickup from Poto Tano harbour, please. Two couples travelling together.",
  },
  {
    first: "Kenji",
    last: "Watanabe",
    country: "JP",
    type: 1,
    adults: 2,
    from: 0,
    nights: 4,
    bookedBefore: 10,
    source: "admin",
    status: "confirmed",
    paid: "deposit",
    adminNotes: "Booked on WhatsApp. Would like surf lessons.",
  },
  { first: "Erik", last: "Lindqvist", country: "SE", type: 2, adults: 2, from: 6, nights: 4, hoursAgo: 3, source: "web", status: "pending", notes: "We arrive on the afternoon ferry." },
  {
    first: "Budi",
    last: "Santoso",
    country: "ID",
    type: 3,
    rooms: 2,
    adults: 2,
    from: 9,
    nights: 3,
    bookedBefore: 12,
    source: "admin",
    status: "confirmed",
    paid: "deposit",
    adminNotes: "Family trip, two rooms. Booked by phone.",
  },
  { first: "Emma", last: "Clarke", country: "GB", type: 0, adults: 2, from: 14, nights: 7, hoursAgo: 20, source: "web", status: "pending" },
  {
    first: "Olivia",
    last: "Martin",
    country: "CA",
    type: 4,
    adults: 2,
    from: 18,
    nights: 4,
    bookedBefore: 25,
    source: "web",
    status: "confirmed",
    paid: "deposit",
    then: "ask-cancel",
    cancelNote: "Our flights changed. Can we move the dates, or cancel?",
  },
  { first: "Daniel", last: "Kim", country: "US", type: 0, adults: 2, from: 5, nights: 3, bookedBefore: 10, source: "web", status: "confirmed", then: "cancel" },
  // Made three days ago and never answered: it shows as expired and holds nothing.
  { first: "Chloe", last: "Dubois", country: "FR", type: 1, adults: 2, from: 25, nights: 3, hoursAgo: 72, source: "web", status: "pending" },
  { first: "Liam", last: "O'Connor", country: "IE", type: 0, adults: 2, from: 32, nights: 5, bookedBefore: 40, source: "web", status: "confirmed", paid: "deposit" },
  { first: "Ayu", last: "Lestari", country: "ID", type: 2, adults: 2, from: 45, nights: 2, bookedBefore: 6, source: "admin", status: "confirmed", adminNotes: "Deposit to follow by transfer." },
];

const DAY_MS = 86_400_000;

/** How many sample bookings are in the database now. */
export async function countSampleBookings(db: Db): Promise<number> {
  const [row] = await db.select({ n: count() }).from(reservations).where(like(reservations.requestId, `${MARK}%`));
  return Number(row?.n ?? 0);
}

/**
 * Adds the samples, unless some are there already (then nothing changes). A sample whose room is taken by a real
 * booking is skipped. Answers how many were added and skipped.
 */
export async function addSampleBookings(db: Db, now = new Date()): Promise<{ added: number; skipped: number; already: number }> {
  const already = await countSampleBookings(db);
  if (already > 0) return { added: 0, skipped: 0, already };

  const types = await db.select().from(roomTypes).where(eq(roomTypes.active, true)).orderBy(asc(roomTypes.sort), asc(roomTypes.name));
  if (types.length === 0) return { added: 0, skipped: SAMPLES.length, already: 0 };
  const today = resortToday(now);
  let added = 0;
  let skipped = 0;

  for (const [index, sample] of SAMPLES.entries()) {
    const type = types[sample.type % types.length];
    const checkIn = addDays(today, sample.from);
    const checkOut = addDays(checkIn, sample.nights);
    const madeAt = sample.hoursAgo
      ? new Date(now.getTime() - sample.hoursAgo * 3_600_000)
      : new Date(Math.min(now.getTime() - 3_600_000, Date.parse(`${checkIn}T02:00:00Z`) - (sample.bookedBefore ?? 7) * DAY_MS));
    const roomCount = Math.min(sample.rooms ?? 1, type.units);
    const adults = Math.min(sample.adults, type.maxGuests);
    const query = { checkIn, checkOut, adults: adults * roomCount, children: 0 };

    try {
      const availability = await loadAvailability(db, query, madeAt);
      const offer = availability.rooms.find((room) => room.roomTypeId === type.id);
      if (!offer || offer.available < roomCount) {
        skipped++;
        continue;
      }
      const rate = offer.rates.find((option) => option.rateId.endsWith("-extended")) ?? offer.rates[0];
      const transfer = sample.transfer ? availability.addOns[0] : undefined;
      const created = await createReservation(
        db,
        {
          query,
          rooms: Array.from({ length: roomCount }, () => ({ roomTypeId: type.id, rateId: rate.rateId, adults, children: 0 })),
          addOns: transfer ? [{ addOnId: transfer.id, quantity: 1 }] : [],
          guest: {
            firstName: sample.first,
            lastName: sample.last,
            email: `${sample.first}.${sample.last}`.toLowerCase().replace(/[^a-z.]/g, "") + "@example.com",
            phone: "+00 000 000 000",
            country: sample.country,
            notes: sample.notes,
          },
          source: sample.source,
          status: sample.status,
          requestId: `${MARK}${index + 1}`,
          adminNotes: sample.adminNotes,
        },
        madeAt,
      );

      if (sample.paid) {
        const paidOn = new Date(Math.min(now.getTime(), madeAt.getTime() + DAY_MS)).toISOString().slice(0, 10);
        await recordPayment(db, {
          code: created.code,
          amount: sample.paid === "full" ? created.total : created.deposit || created.total,
          method: "bank",
          paidOn,
          note: "Sample payment",
        });
      }
      if (sample.then === "cancel") await cancelReservation(db, created.code, new Date(Math.min(now.getTime(), madeAt.getTime() + 2 * DAY_MS)));
      if (sample.then === "ask-cancel") await requestCancellation(db, created.code, sample.cancelNote ?? "", new Date(now.getTime() - 5 * 3_600_000));
      added++;
    } catch (error) {
      console.warn(`[samples] ${sample.first} ${sample.last} skipped:`, error instanceof Error ? error.message : error);
      skipped++;
    }
  }

  // Rooms out of sale for a few nights, to show what a block looks like on the calendar.
  const blocked = types[0];
  await addBlock(db, { roomTypeId: blocked.id, startsOn: addDays(today, 12), endsOn: addDays(today, 15), units: 1, reason: BLOCK_REASON });

  return { added, skipped, already: 0 };
}

/** Deletes the sample bookings (with their rooms, extras and payments) and the sample block. Answers how many bookings. */
export async function removeSampleBookings(db: Db): Promise<number> {
  const removed = await db.delete(reservations).where(like(reservations.requestId, `${MARK}%`)).returning({ id: reservations.id });
  await db.delete(blocks).where(eq(blocks.reason, BLOCK_REASON));
  return removed.length;
}
