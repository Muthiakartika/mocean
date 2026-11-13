import { randomInt } from "node:crypto";
import { and, asc, desc, eq, gt, gte, ilike, inArray, lt, or } from "drizzle-orm";
import { property } from "@/config/property";
import type { Db } from "@/lib/db";
import {
  addOns,
  blocks,
  payments,
  reservationAddOns,
  reservationRooms,
  reservations,
  roomTypes,
  seasonRanges,
  type PaymentRow,
  type ReservationRoomRow,
  type ReservationRow,
  type ReservationStatus,
} from "@/lib/db/schema";
import { QuoteError, buildQuote } from "@/lib/booking/stay";
import type { Availability, CartAddOn, CartRoom, RoomOffer, StayQuery } from "@/lib/booking/types";
import { assignLanes, freeUnits, nightlyRate, ratesForStay, stayDays, usedOn, type Hold } from "./engine";
import { depositPolicy, loadPaymentSettings } from "./payment-settings";
import { loadSettings } from "./settings";

/**
 * Everything the booking system reads from and writes to the database: availability, new reservations, confirming and
 * cancelling, and the lists the admin pages show. The rules themselves are in engine.ts.
 *
 * A reservation HOLDS its rooms when it is confirmed, or pending and not yet expired. Expiry is never written: a pending
 * reservation past `expires_at` simply stops counting (and the admin shows it as expired), so no timer job is needed.
 */

export function holdsRooms(row: { status: ReservationStatus; expiresAt: Date | null }, now: Date) {
  return row.status === "confirmed" || (row.status === "pending" && (!row.expiresAt || row.expiresAt > now));
}

/** What the admin shows: a pending reservation past its hold is "expired". */
export function displayStatus(row: { status: ReservationStatus; expiresAt: Date | null }, now = new Date()): ReservationStatus | "expired" {
  return row.status === "pending" && row.expiresAt && row.expiresAt <= now ? "expired" : row.status;
}

/** Rooms, seasons, blocks, holds and extras around one range of dates. */
async function loadStay(db: Db, from: string, to: string, now: Date, excludeReservationId?: string) {
  const [types, ranges, blockRows, reservedRows, extras, settings] = await Promise.all([
    db.select().from(roomTypes).orderBy(asc(roomTypes.sort), asc(roomTypes.name)),
    db.select().from(seasonRanges),
    db.select().from(blocks).where(and(lt(blocks.startsOn, to), gt(blocks.endsOn, from))),
    db
      .select({
        id: reservations.id,
        roomTypeId: reservationRooms.roomTypeId,
        startsOn: reservations.checkIn,
        endsOn: reservations.checkOut,
        status: reservations.status,
        expiresAt: reservations.expiresAt,
      })
      .from(reservationRooms)
      .innerJoin(reservations, eq(reservationRooms.reservationId, reservations.id))
      .where(and(lt(reservations.checkIn, to), gt(reservations.checkOut, from), inArray(reservations.status, ["pending", "confirmed"]))),
    db.select().from(addOns).where(eq(addOns.active, true)).orderBy(asc(addOns.sort)),
    loadSettings(db),
  ]);

  const blocked = new Map<string, Hold[]>();
  const booked = new Map<string, Hold[]>();
  const push = (map: Map<string, Hold[]>, typeId: string, hold: Hold) => map.set(typeId, [...(map.get(typeId) ?? []), hold]);
  for (const block of blockRows) push(blocked, block.roomTypeId, { startsOn: block.startsOn, endsOn: block.endsOn, units: block.units });
  for (const row of reservedRows) {
    if (row.id === excludeReservationId || !holdsRooms(row, now)) continue;
    push(booked, row.roomTypeId, { startsOn: row.startsOn, endsOn: row.endsOn, units: 1 });
  }
  return { types, ranges, blocked, booked, extras, settings };
}

const holdsOf = (stay: Awaited<ReturnType<typeof loadStay>>, typeId: string) => [
  ...(stay.blocked.get(typeId) ?? []),
  ...(stay.booked.get(typeId) ?? []),
];

/** What /book/ shows for a search: the room types with a room free on every night, their rates and the extras. */
export async function loadAvailability(db: Db, query: StayQuery, now = new Date(), excludeReservationId?: string): Promise<Availability> {
  const days = stayDays(query.checkIn, query.checkOut);
  const stay = await loadStay(db, query.checkIn, query.checkOut, now, excludeReservationId);

  const rooms: RoomOffer[] = [];
  for (const type of stay.types) {
    if (!type.active) continue;
    const available = freeUnits(type.units, days, holdsOf(stay, type.id));
    if (available < 1) continue;
    const nightly = days.map((day) => nightlyRate(type, day, stay.ranges));
    rooms.push({
      roomTypeId: type.id,
      name: type.name,
      description: type.description,
      maxGuests: type.maxGuests,
      photos: type.photos,
      features: type.features,
      available,
      rates: ratesForStay(type.id, days, nightly, stay.settings),
    });
  }

  return {
    query,
    nights: days.length,
    currency: property.currency,
    rooms,
    addOns: stay.extras.map((extra) => ({ id: extra.id, name: extra.name, description: extra.description || undefined, price: extra.price })),
    includedTaxRate: stay.settings.includedTaxRate,
    source: "native",
    depositPolicy: depositPolicy(await loadPaymentSettings(db)),
  };
}

export type GuestInput = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  country?: string;
  zip?: string;
  arrivalTime?: string;
  notes?: string;
};

export type NewReservation = {
  query: StayQuery;
  rooms: CartRoom[];
  addOns: CartAddOn[];
  guest: GuestInput;
  source: "web" | "admin";
  /** The booking page's attempt id; a repeat of it returns the reservation made the first time. */
  requestId?: string;
  /** Total the guest was shown; the reservation is refused if the price has moved since. */
  expectedTotal?: number;
  /** Staff price for a booking they enter themselves (a negotiated rate); the deposit is capped by it. */
  totalOverride?: number;
  /** Default: confirmed for staff and for websites with auto-confirm on, else pending. */
  status?: ReservationStatus;
  adminNotes?: string;
};

export type CreatedReservation = {
  id: string;
  code: string;
  status: ReservationStatus;
  total: number;
  deposit: number;
  expiresAt: Date | null;
};

const summary = (row: ReservationRow): CreatedReservation => ({
  id: row.id,
  code: row.code,
  status: row.status,
  total: row.total,
  deposit: row.deposit,
  expiresAt: row.expiresAt,
});

// No 0/O, 1/I/L: a code read out over WhatsApp or the phone.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

async function newCode(db: Db): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = `${property.bookingCodePrefix}-${Array.from({ length: 6 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("")}`;
    const [taken] = await db.select({ id: reservations.id }).from(reservations).where(eq(reservations.code, code)).limit(1);
    if (!taken) return code;
  }
  throw new Error("Could not make a free booking code.");
}

function isUniqueViolation(error: unknown) {
  const code = (error as { code?: string })?.code ?? (error as { cause?: { code?: string } })?.cause?.code;
  return code === "23505";
}

/**
 * Makes a reservation. Throws QuoteError when something the guest chose is no longer free or its price moved.
 *
 * The check and the insert run in ONE transaction that first locks the rows of the chosen room types (FOR UPDATE, in a
 * fixed order so two bookings cannot wait on each other). Two guests asking for the last room therefore line up: the
 * second one counts the room as taken and gets a QuoteError.
 */
export async function createReservation(db: Db, input: NewReservation, now = new Date()): Promise<CreatedReservation> {
  const earlier = async () => {
    if (!input.requestId) return null;
    const [row] = await db.select().from(reservations).where(eq(reservations.requestId, input.requestId)).limit(1);
    return row ? summary(row) : null;
  };

  const existing = await earlier();
  if (existing) return existing;

  try {
    return await db.transaction(async (tx) => {
      const t = tx as unknown as Db;
      const typeIds = [...new Set(input.rooms.map((room) => room.roomTypeId))].sort();
      if (typeIds.length) {
        await t.select({ id: roomTypes.id }).from(roomTypes).where(inArray(roomTypes.id, typeIds)).orderBy(asc(roomTypes.id)).for("update");
      }

      const availability = await loadAvailability(t, input.query, now);
      const quote = buildQuote(availability, input.rooms, input.addOns);
      if (input.expectedTotal !== undefined && Math.abs(quote.total - input.expectedTotal) > input.rooms.length) {
        throw new QuoteError("The price for these dates has just changed.");
      }

      const settings = await loadSettings(t);
      const status: ReservationStatus = input.status ?? (input.source === "admin" || settings.autoConfirm ? "confirmed" : "pending");
      const total = Math.round(input.totalOverride ?? quote.total);
      const deposit = Math.min(Math.round(quote.deposit), total);
      const guest = input.guest;

      const [row] = await t
        .insert(reservations)
        .values({
          code: await newCode(t),
          status,
          checkIn: input.query.checkIn,
          checkOut: input.query.checkOut,
          firstName: guest.firstName.trim(),
          lastName: guest.lastName.trim(),
          email: guest.email?.trim() ?? "",
          phone: guest.phone?.trim() ?? "",
          country: guest.country?.trim() ?? "",
          zip: guest.zip?.trim() ?? "",
          arrivalTime: guest.arrivalTime?.trim() ?? "",
          notes: guest.notes?.trim() ?? "",
          adminNotes: input.adminNotes?.trim() ?? "",
          total,
          deposit,
          source: input.source,
          requestId: input.requestId ?? null,
          expiresAt: status === "pending" ? new Date(now.getTime() + settings.pendingHoldHours * 3_600_000) : null,
          confirmedAt: status === "confirmed" ? now : null,
        })
        .returning();

      for (const cartRoom of input.rooms) {
        const room = availability.rooms.find((offer) => offer.roomTypeId === cartRoom.roomTypeId);
        const rate = room?.rates.find((offer) => offer.rateId === cartRoom.rateId);
        if (!room || !rate) throw new QuoteError("A room you chose is no longer offered for these dates.");
        await t.insert(reservationRooms).values({
          reservationId: row.id,
          roomTypeId: room.roomTypeId,
          rateName: rate.name,
          adults: cartRoom.adults,
          children: cartRoom.children,
          total: Math.round(rate.total),
          nightly: rate.nightly,
        });
      }

      for (const cartAddOn of input.addOns) {
        const addOn = availability.addOns.find((offer) => offer.id === cartAddOn.addOnId);
        if (!addOn) throw new QuoteError("An add-on you chose is no longer offered.");
        await t.insert(reservationAddOns).values({
          reservationId: row.id,
          name: addOn.name,
          quantity: cartAddOn.quantity,
          unitPrice: Math.round(addOn.price),
        });
      }

      return summary(row);
    });
  } catch (error) {
    // The same attempt arrived twice at once: the other one won; answer with its reservation.
    if (isUniqueViolation(error)) {
      const winner = await earlier();
      if (winner) return winner;
    }
    throw error;
  }
}

export type ReservationDetail = {
  reservation: ReservationRow;
  rooms: (ReservationRoomRow & { roomName: string })[];
  extras: { name: string; quantity: number; unitPrice: number }[];
  /** Money received and online payment pages, oldest first (src/lib/booking/native/payments.ts). */
  payments: PaymentRow[];
};

export async function getReservation(db: Db, code: string): Promise<ReservationDetail | null> {
  const [reservation] = await db.select().from(reservations).where(eq(reservations.code, code.trim().toUpperCase())).limit(1);
  if (!reservation) return null;
  const [rooms, extras, paymentRows] = await Promise.all([
    db
      .select({ room: reservationRooms, roomName: roomTypes.name })
      .from(reservationRooms)
      .innerJoin(roomTypes, eq(reservationRooms.roomTypeId, roomTypes.id))
      .where(eq(reservationRooms.reservationId, reservation.id))
      .orderBy(asc(reservationRooms.id)),
    db
      .select({ name: reservationAddOns.name, quantity: reservationAddOns.quantity, unitPrice: reservationAddOns.unitPrice })
      .from(reservationAddOns)
      .where(eq(reservationAddOns.reservationId, reservation.id))
      .orderBy(asc(reservationAddOns.id)),
    db.select().from(payments).where(eq(payments.reservationId, reservation.id)).orderBy(asc(payments.createdAt), asc(payments.id)),
  ]);
  return { reservation, rooms: rooms.map(({ room, roomName }) => ({ ...room, roomName })), extras, payments: paymentRows };
}

export type ReservationFilter = {
  status?: ReservationStatus | "expired";
  /** Matches code, guest name or email. */
  search?: string;
  checkInFrom?: string;
  checkInTo?: string;
  checkOutOn?: string;
  limit?: number;
};

export type ReservationListItem = ReservationRow & { roomNames: string[] };

export async function listReservations(db: Db, filter: ReservationFilter = {}, now = new Date()): Promise<ReservationListItem[]> {
  const conditions = [];
  if (filter.status === "expired") conditions.push(eq(reservations.status, "pending"), lt(reservations.expiresAt, now));
  else if (filter.status) conditions.push(eq(reservations.status, filter.status));
  if (filter.checkInFrom) conditions.push(gte(reservations.checkIn, filter.checkInFrom));
  if (filter.checkInTo) conditions.push(lt(reservations.checkIn, filter.checkInTo));
  if (filter.checkOutOn) conditions.push(eq(reservations.checkOut, filter.checkOutOn));
  const term = filter.search?.trim();
  if (term) {
    const like = `%${term.replace(/[%_\\]/g, (char) => `\\${char}`)}%`;
    conditions.push(
      or(ilike(reservations.code, like), ilike(reservations.firstName, like), ilike(reservations.lastName, like), ilike(reservations.email, like))!,
    );
  }

  const rows = await db
    .select()
    .from(reservations)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(reservations.createdAt))
    .limit(filter.limit ?? 200);
  if (rows.length === 0) return [];

  const rooms = await db
    .select({ reservationId: reservationRooms.reservationId, roomName: roomTypes.name })
    .from(reservationRooms)
    .innerJoin(roomTypes, eq(reservationRooms.roomTypeId, roomTypes.id))
    .where(
      inArray(
        reservationRooms.reservationId,
        rows.map((row) => row.id),
      ),
    )
    .orderBy(asc(reservationRooms.id));
  return rows.map((row) => ({ ...row, roomNames: rooms.filter((room) => room.reservationId === row.id).map((room) => room.roomName) }));
}

/** `changed` is false when the reservation already had that status (nothing was done, so nothing should be emailed). */
export type StatusChange = { ok: true; reservation: ReservationRow; changed: boolean } | { ok: false; message: string };

/** Pending -> confirmed. A request that expired is confirmed only if its rooms are still free. */
export async function confirmReservation(db: Db, code: string, now = new Date()): Promise<StatusChange> {
  return db.transaction(async (tx) => {
    const t = tx as unknown as Db;
    const [row] = await t.select().from(reservations).where(eq(reservations.code, code.trim().toUpperCase())).limit(1);
    if (!row) return { ok: false, message: "No booking with that number." };
    if (row.status === "confirmed") return { ok: true, reservation: row, changed: false };
    if (row.status === "cancelled") return { ok: false, message: "This booking was cancelled. Make a new booking instead." };

    if (displayStatus(row, now) === "expired") {
      const rooms = await t.select().from(reservationRooms).where(eq(reservationRooms.reservationId, row.id));
      const typeIds = [...new Set(rooms.map((room) => room.roomTypeId))].sort();
      if (typeIds.length) await t.select({ id: roomTypes.id }).from(roomTypes).where(inArray(roomTypes.id, typeIds)).orderBy(asc(roomTypes.id)).for("update");
      const stay = await loadStay(t, row.checkIn, row.checkOut, now, row.id);
      const days = stayDays(row.checkIn, row.checkOut);
      for (const typeId of typeIds) {
        const type = stay.types.find((candidate) => candidate.id === typeId);
        const needed = rooms.filter((room) => room.roomTypeId === typeId).length;
        if (!type || freeUnits(type.units, days, holdsOf(stay, typeId)) < needed) {
          return { ok: false, message: `The request expired and ${type?.name ?? "a room"} was booked by someone else in the meantime.` };
        }
      }
    }

    const [updated] = await t
      .update(reservations)
      .set({ status: "confirmed", confirmedAt: now, expiresAt: null })
      .where(eq(reservations.id, row.id))
      .returning();
    return { ok: true, reservation: updated, changed: true };
  });
}

export async function cancelReservation(db: Db, code: string, now = new Date()): Promise<StatusChange> {
  const [current] = await db.select().from(reservations).where(eq(reservations.code, code.trim().toUpperCase())).limit(1);
  if (!current) return { ok: false, message: "No booking with that number." };
  if (current.status === "cancelled") return { ok: true, reservation: current, changed: false };
  const [row] = await db.update(reservations).set({ status: "cancelled", cancelledAt: now }).where(eq(reservations.id, current.id)).returning();
  return { ok: true, reservation: row, changed: true };
}

/**
 * The guest cancels on "Manage my booking". Only a request the resort has not confirmed yet (nothing was paid):
 * a confirmed booking goes through requestCancellation, so staff can settle the deposit first.
 */
export async function cancelByGuest(db: Db, code: string, now = new Date()): Promise<StatusChange> {
  const [current] = await db.select().from(reservations).where(eq(reservations.code, code.trim().toUpperCase())).limit(1);
  if (!current) return { ok: false, message: "No booking with that number." };
  if (current.status === "confirmed") return { ok: false, message: "This booking is confirmed. Ask the resort to cancel it below." };
  return cancelReservation(db, code, now);
}

/** The guest asks to cancel a confirmed booking. Staff see it on the admin dashboard and cancel it themselves. */
export async function requestCancellation(db: Db, code: string, note: string, now = new Date()): Promise<StatusChange> {
  const [current] = await db.select().from(reservations).where(eq(reservations.code, code.trim().toUpperCase())).limit(1);
  if (!current) return { ok: false, message: "No booking with that number." };
  if (current.status === "cancelled") return { ok: false, message: "This booking is already cancelled." };
  if (current.status !== "confirmed") return { ok: false, message: "This request is not confirmed yet: you can cancel it yourself." };
  if (current.cancelRequestedAt) return { ok: true, reservation: current, changed: false };
  const [row] = await db
    .update(reservations)
    .set({ cancelRequestedAt: now, cancelRequestNote: note.trim().slice(0, 1000) })
    .where(eq(reservations.id, current.id))
    .returning();
  return { ok: true, reservation: row, changed: true };
}

/** Confirmed bookings whose guest asked to cancel, oldest request first. */
export async function listCancelRequests(db: Db): Promise<ReservationListItem[]> {
  const rows = await listReservations(db, { status: "confirmed", limit: 500 });
  return rows
    .filter((row) => row.cancelRequestedAt)
    .sort((a, b) => a.cancelRequestedAt!.getTime() - b.cancelRequestedAt!.getTime());
}

export async function saveAdminNotes(db: Db, code: string, notes: string) {
  await db
    .update(reservations)
    .set({ adminNotes: notes.trim().slice(0, 2000) })
    .where(eq(reservations.code, code.trim().toUpperCase()));
}

export type CalendarStay = {
  kind: "stay";
  code: string;
  guest: string;
  /** "pending": a request staff have not answered yet. */
  status: "pending" | "confirmed";
  cancelRequested: boolean;
  guests: number;
  startsOn: string;
  endsOn: string;
};
export type CalendarBlock = { kind: "block"; id: number; reason: string; startsOn: string; endsOn: string };
export type CalendarLane = { overflow: boolean; items: (CalendarStay | CalendarBlock)[] };
export type CalendarBoard = { days: string[]; types: { id: string; name: string; units: number; active: boolean; lanes: CalendarLane[] }[] };

/**
 * The admin calendar: per room type, one row per room with the stays and blocks on it, for the nights `from` up to (not
 * including) `to`. Only what holds rooms is shown: confirmed stays, requests still waiting, and blocks. Rows are drawn
 * by assignLanes (engine.ts); they are not room numbers.
 */
export async function calendarLanes(db: Db, from: string, to: string, now = new Date()): Promise<CalendarBoard> {
  const [types, blockRows, roomRows] = await Promise.all([
    db.select().from(roomTypes).orderBy(asc(roomTypes.sort), asc(roomTypes.name)),
    db.select().from(blocks).where(and(lt(blocks.startsOn, to), gt(blocks.endsOn, from))),
    db
      .select({
        roomTypeId: reservationRooms.roomTypeId,
        adults: reservationRooms.adults,
        children: reservationRooms.children,
        code: reservations.code,
        firstName: reservations.firstName,
        lastName: reservations.lastName,
        status: reservations.status,
        expiresAt: reservations.expiresAt,
        cancelRequestedAt: reservations.cancelRequestedAt,
        startsOn: reservations.checkIn,
        endsOn: reservations.checkOut,
      })
      .from(reservationRooms)
      .innerJoin(reservations, eq(reservationRooms.reservationId, reservations.id))
      .where(and(lt(reservations.checkIn, to), gt(reservations.checkOut, from), inArray(reservations.status, ["pending", "confirmed"]))),
  ]);

  return {
    days: stayDays(from, to),
    types: types.map((type) => {
      const items: (CalendarStay | CalendarBlock)[] = [];
      for (const row of roomRows) {
        if (row.roomTypeId !== type.id || !holdsRooms(row, now)) continue;
        items.push({
          kind: "stay",
          code: row.code,
          guest: `${row.firstName} ${row.lastName}`.trim(),
          status: row.status === "confirmed" ? "confirmed" : "pending",
          cancelRequested: Boolean(row.cancelRequestedAt),
          guests: row.adults + row.children,
          startsOn: row.startsOn,
          endsOn: row.endsOn,
        });
      }
      for (const block of blockRows) {
        if (block.roomTypeId !== type.id) continue;
        // A block of several rooms takes one row per room.
        for (let n = 0; n < block.units; n++) {
          items.push({ kind: "block", id: block.id, reason: block.reason, startsOn: block.startsOn, endsOn: block.endsOn });
        }
      }
      const lanes = assignLanes(type.units, items).map((laneItems, index) => ({ overflow: index >= type.units, items: laneItems }));
      return { id: type.id, name: type.name, units: type.units, active: type.active, lanes };
    }),
  };
}

export type DayUsage = { day: string; booked: number; blocked: number; free: number };
export type MonthCalendar = { days: string[]; types: { id: string; name: string; units: number; perDay: DayUsage[] }[] };

/** Rooms booked, blocked and free per type per day, for the admin calendar. `from` / `to` are YYYY-MM-DD, `to` excluded. */
export async function calendarUsage(db: Db, from: string, to: string, now = new Date()): Promise<MonthCalendar> {
  const days = stayDays(from, to);
  const stay = await loadStay(db, from, to, now);
  return {
    days,
    types: stay.types.map((type) => ({
      id: type.id,
      name: type.name,
      units: type.units,
      perDay: days.map((day) => {
        const booked = usedOn(day, stay.booked.get(type.id) ?? []);
        const blocked = usedOn(day, stay.blocked.get(type.id) ?? []);
        return { day, booked, blocked, free: Math.max(0, type.units - booked - blocked) };
      }),
    })),
  };
}
