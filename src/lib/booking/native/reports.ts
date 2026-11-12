import { and, eq, gt, inArray, lt } from "drizzle-orm";
import type { Db } from "@/lib/db";
import { reservationRooms, reservations, roomTypes } from "@/lib/db/schema";
import { nightsBetween } from "@/lib/booking/stay";

/**
 * Figures for the admin's Reports page. Only CONFIRMED bookings count: a request is not business yet and a cancelled
 * booking is none. Guests and booking value are counted in the month the guests arrive; room nights in the month they
 * are slept. Booking value is what the bookings are worth (tax and service included), not money received: the site
 * does not take payments yet.
 */

export type MonthFigures = {
  /** "2026-11" */
  month: string;
  arrivals: number;
  guests: number;
  value: number;
  roomNights: number;
  /** Room nights the resort has in the month (rooms x days). */
  capacity: number;
};

export type Report = {
  months: MonthFigures[];
  totals: { bookings: number; guests: number; value: number; nights: number; roomNights: number; capacity: number };
  roomTypes: { name: string; roomNights: number }[];
  countries: { code: string; bookings: number; guests: number }[];
};

export type ReportBooking = {
  id: string;
  checkIn: string;
  checkOut: string;
  total: number;
  country: string;
};
export type ReportRoom = { reservationId: string; roomTypeId: string; adults: number; children: number };

const pad = (value: number) => String(value).padStart(2, "0");

/** "2026-11" moved by some months. */
export function shiftMonth(month: string, by: number): string {
  const [year, number] = month.split("-").map(Number);
  const index = year * 12 + (number - 1) + by;
  return `${Math.floor(index / 12)}-${pad((index % 12) + 1)}`;
}

/** Nights of [checkIn, checkOut) that fall in [from, to). */
function nightsWithin(checkIn: string, checkOut: string, from: string, to: string) {
  const start = checkIn > from ? checkIn : from;
  const end = checkOut < to ? checkOut : to;
  return end > start ? nightsBetween(start, end) : 0;
}

/** The figures of `count` months from `firstMonth`, from bookings and their rooms (pure, so it can be tested). */
export function summarise(
  bookings: ReportBooking[],
  rooms: ReportRoom[],
  types: { id: string; name: string; units: number }[],
  firstMonth: string,
  count: number,
): Report {
  const unitsTotal = types.reduce((sum, type) => sum + type.units, 0);
  const roomsOf = new Map<string, ReportRoom[]>();
  for (const room of rooms) roomsOf.set(room.reservationId, [...(roomsOf.get(room.reservationId) ?? []), room]);

  const months: MonthFigures[] = Array.from({ length: count }, (_, index) => {
    const month = shiftMonth(firstMonth, index);
    const from = `${month}-01`;
    const to = `${shiftMonth(month, 1)}-01`;
    let arrivals = 0;
    let guests = 0;
    let value = 0;
    let roomNights = 0;
    for (const booking of bookings) {
      const its = roomsOf.get(booking.id) ?? [];
      if (booking.checkIn >= from && booking.checkIn < to) {
        arrivals += 1;
        guests += its.reduce((sum, room) => sum + room.adults + room.children, 0);
        value += booking.total;
      }
      roomNights += its.length * nightsWithin(booking.checkIn, booking.checkOut, from, to);
    }
    return { month, arrivals, guests, value, roomNights, capacity: unitsTotal * nightsBetween(from, to) };
  });

  const windowFrom = `${firstMonth}-01`;
  const windowTo = `${shiftMonth(firstMonth, count)}-01`;
  const arriving = bookings.filter((booking) => booking.checkIn >= windowFrom && booking.checkIn < windowTo);

  const typeNights = new Map<string, number>();
  for (const booking of bookings) {
    const nights = nightsWithin(booking.checkIn, booking.checkOut, windowFrom, windowTo);
    for (const room of roomsOf.get(booking.id) ?? []) typeNights.set(room.roomTypeId, (typeNights.get(room.roomTypeId) ?? 0) + nights);
  }

  const countries = new Map<string, { bookings: number; guests: number }>();
  for (const booking of arriving) {
    const code = booking.country || "??";
    const entry = countries.get(code) ?? { bookings: 0, guests: 0 };
    entry.bookings += 1;
    entry.guests += (roomsOf.get(booking.id) ?? []).reduce((sum, room) => sum + room.adults + room.children, 0);
    countries.set(code, entry);
  }

  return {
    months,
    totals: {
      bookings: arriving.length,
      guests: months.reduce((sum, month) => sum + month.guests, 0),
      value: months.reduce((sum, month) => sum + month.value, 0),
      nights: arriving.reduce((sum, booking) => sum + nightsBetween(booking.checkIn, booking.checkOut), 0),
      roomNights: months.reduce((sum, month) => sum + month.roomNights, 0),
      capacity: months.reduce((sum, month) => sum + month.capacity, 0),
    },
    roomTypes: types
      .map((type) => ({ name: type.name, roomNights: typeNights.get(type.id) ?? 0 }))
      .sort((a, b) => b.roomNights - a.roomNights),
    countries: [...countries]
      .map(([code, entry]) => ({ code, ...entry }))
      .sort((a, b) => b.guests - a.guests || b.bookings - a.bookings),
  };
}

/** Confirmed bookings touching the months, read from the database and summarised. */
export async function loadReport(db: Db, firstMonth: string, count: number): Promise<Report> {
  const from = `${firstMonth}-01`;
  const to = `${shiftMonth(firstMonth, count)}-01`;
  const [types, bookings] = await Promise.all([
    db.select({ id: roomTypes.id, name: roomTypes.name, units: roomTypes.units, active: roomTypes.active }).from(roomTypes),
    db
      .select({ id: reservations.id, checkIn: reservations.checkIn, checkOut: reservations.checkOut, total: reservations.total, country: reservations.country })
      .from(reservations)
      .where(and(eq(reservations.status, "confirmed"), lt(reservations.checkIn, to), gt(reservations.checkOut, from))),
  ]);
  const rooms = bookings.length
    ? await db
        .select({ reservationId: reservationRooms.reservationId, roomTypeId: reservationRooms.roomTypeId, adults: reservationRooms.adults, children: reservationRooms.children })
        .from(reservationRooms)
        .where(
          inArray(
            reservationRooms.reservationId,
            bookings.map((booking) => booking.id),
          ),
        )
    : [];
  // Capacity counts the room types on sale; a type taken off the website still counts while it has bookings.
  const counted = types.filter((type) => type.active || rooms.some((room) => room.roomTypeId === type.id));
  return summarise(bookings, rooms, counted, firstMonth, count);
}

