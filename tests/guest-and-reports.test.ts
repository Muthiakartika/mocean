import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import type { Db } from "@/lib/db";
import { checkGuestToken, guestToken, managePath } from "@/lib/booking/native/guest-link";
import { loadReport, summarise, shiftMonth } from "@/lib/booking/native/reports";
import {
  cancelByGuest,
  confirmReservation,
  createReservation,
  getReservation,
  listCancelRequests,
  requestCancellation,
  type NewReservation,
} from "@/lib/booking/native/store";
import { testDb } from "./helpers/test-db";

const NOW = new Date("2026-11-12T00:00:00Z");
const GUEST = { firstName: "Ana", lastName: "Test", email: "Ana@Example.com", phone: "+62 812 0000 0000", country: "ID" };

function booking(checkIn: string, checkOut: string, roomTypeId = "dlx-king", adults = 2): NewReservation {
  return {
    query: { checkIn, checkOut, adults, children: 0 },
    rooms: [{ roomTypeId, rateId: `${roomTypeId}-standard`, adults, children: 0 }],
    addOns: [],
    guest: GUEST,
    source: "web",
  };
}

describe("guest link", () => {
  it("accepts its own token, whatever the case of the number or email", () => {
    const token = guestToken("MOC-ABC123", "ana@example.com");
    assert.ok(checkGuestToken("moc-abc123", "Ana@Example.com", token));
  });

  it("refuses a token made for another booking or another email", () => {
    const token = guestToken("MOC-ABC123", "ana@example.com");
    assert.equal(checkGuestToken("MOC-ABC124", "ana@example.com", token), false);
    assert.equal(checkGuestToken("MOC-ABC123", "bob@example.com", token), false);
    assert.equal(checkGuestToken("MOC-ABC123", "ana@example.com", "short"), false);
  });

  it("builds the page address with the number and the token", () => {
    const path = managePath("moc-abc123", "ana@example.com");
    assert.ok(path.startsWith("/book/manage/?code=MOC-ABC123&t="));
  });
});

describe("guest cancelling", () => {
  let db: Db;
  before(async () => {
    db = await testDb();
  });

  it("lets the guest cancel a request that is not confirmed", async () => {
    const made = await createReservation(db, booking("2026-12-10", "2026-12-13"), NOW);
    const result = await cancelByGuest(db, made.code, NOW);
    assert.ok(result.ok && result.changed && result.reservation.status === "cancelled");
  });

  it("does not let the guest cancel a confirmed booking directly, only ask", async () => {
    const made = await createReservation(db, booking("2026-12-20", "2026-12-23"), NOW);
    await confirmReservation(db, made.code, NOW);
    const direct = await cancelByGuest(db, made.code, NOW);
    assert.equal(direct.ok, false);

    const asked = await requestCancellation(db, made.code, "  Flight cancelled  ", NOW);
    assert.ok(asked.ok && asked.changed);
    const detail = await getReservation(db, made.code);
    assert.equal(detail?.reservation.status, "confirmed", "keeps its rooms until staff cancel it");
    assert.equal(detail?.reservation.cancelRequestNote, "Flight cancelled");
    assert.deepEqual(
      (await listCancelRequests(db)).map((row) => row.code),
      [made.code],
    );

    const again = await requestCancellation(db, made.code, "", NOW);
    assert.ok(again.ok && !again.changed, "a second request changes nothing");
  });

  it("refuses a cancellation request for a booking that is only a request", async () => {
    const made = await createReservation(db, booking("2027-01-05", "2027-01-08"), NOW);
    const asked = await requestCancellation(db, made.code, "", NOW);
    assert.equal(asked.ok, false);
  });
});

describe("reports", () => {
  it("counts guests and value in the arrival month and room nights in the month slept", () => {
    const report = summarise(
      [
        { id: "a", checkIn: "2026-11-29", checkOut: "2026-12-02", total: 6_600_000, country: "AU" },
        { id: "b", checkIn: "2026-12-10", checkOut: "2026-12-12", total: 3_380_000, country: "AU" },
        { id: "c", checkIn: "2026-12-20", checkOut: "2026-12-21", total: 1_000_000, country: "" },
      ],
      [
        { reservationId: "a", roomTypeId: "dlx-king", adults: 2, children: 1 },
        { reservationId: "b", roomTypeId: "std-king", adults: 2, children: 0 },
        { reservationId: "b", roomTypeId: "std-king", adults: 1, children: 0 },
        { reservationId: "c", roomTypeId: "dlx-king", adults: 1, children: 0 },
      ],
      [
        { id: "dlx-king", name: "Deluxe King", units: 4 },
        { id: "std-king", name: "Standard King", units: 2 },
      ],
      "2026-11",
      2,
    );
    const [nov, dec] = report.months;
    assert.deepEqual([nov.arrivals, nov.guests, nov.value, nov.roomNights, nov.capacity], [1, 3, 6_600_000, 2, 180]);
    // Booking a's last night (Dec 1) belongs to December; b is two rooms for two nights.
    assert.deepEqual([dec.arrivals, dec.guests, dec.value, dec.roomNights, dec.capacity], [2, 4, 4_380_000, 1 + 4 + 1, 186]);
    assert.equal(report.totals.nights, 3 + 2 + 1);
    assert.deepEqual(report.roomTypes, [
      { name: "Deluxe King", roomNights: 4 },
      { name: "Standard King", roomNights: 4 },
    ]);
    assert.deepEqual(report.countries[0], { code: "AU", bookings: 2, guests: 6 });
  });

  it("moves months across years", () => {
    assert.equal(shiftMonth("2026-11", 3), "2027-02");
    assert.equal(shiftMonth("2026-01", -1), "2025-12");
  });

  it("counts only confirmed bookings from the database", async () => {
    const db = await testDb();
    const confirmed = await createReservation(db, booking("2026-12-10", "2026-12-13"), NOW);
    await confirmReservation(db, confirmed.code, NOW);
    await createReservation(db, booking("2026-12-15", "2026-12-18", "std-king"), NOW);
    const report = await loadReport(db, "2026-12", 1);
    assert.equal(report.totals.bookings, 1);
    assert.equal(report.months[0].guests, 2);
    assert.equal(report.months[0].roomNights, 3);
  });
});
