import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import { property } from "@/config/property";
import type { Db } from "@/lib/db";
import { blocks, reservations, seasonRanges } from "@/lib/db/schema";
import { saveSettings } from "@/lib/booking/native/settings";
import {
  calendarUsage,
  cancelReservation,
  confirmReservation,
  createReservation,
  loadAvailability,
  type NewReservation,
} from "@/lib/booking/native/store";
import { QuoteError } from "@/lib/booking/stay";
import { testDb } from "./helpers/test-db";

const NOW = new Date("2026-11-12T00:00:00Z");
const hoursLater = (hours: number) => new Date(NOW.getTime() + hours * 3_600_000);

const DEC = { checkIn: "2026-12-10", checkOut: "2026-12-13", adults: 2, children: 0 };
const GUEST = { firstName: "Ana", lastName: "Test", email: "ana@example.com", phone: "+62 812 0000 0000", country: "ID" };

function booking(roomTypeId: string, extra: Partial<NewReservation> = {}): NewReservation {
  return {
    query: DEC,
    rooms: [{ roomTypeId, rateId: `${roomTypeId}-standard`, adults: 2, children: 0 }],
    addOns: [],
    guest: GUEST,
    source: "web",
    ...extra,
  };
}

const typeIds = async (db: Db, query = DEC, now = NOW) => (await loadAvailability(db, query, now)).rooms.map((room) => room.roomTypeId);

describe("availability", () => {
  let db: Db;
  before(async () => {
    db = await testDb();
  });

  it("offers every room type with its units and both rates", async () => {
    const availability = await loadAvailability(db, DEC, NOW);
    assert.equal(availability.source, "native");
    assert.equal(availability.nights, 3);
    assert.deepEqual(
      availability.rooms.map((room) => [room.roomTypeId, room.available]),
      [
        ["dlx-king", 4],
        ["dlx-queen", 1],
        ["dlx-twin", 1],
        ["std-king", 2],
        ["std-twin", 2],
      ],
    );
    const king = availability.rooms[0];
    assert.deepEqual(
      king.rates.map((rate) => [rate.name, rate.total]),
      [
        ["Extended Stay - Three Nights or More", 6_270_000],
        ["Standard Rate", 6_600_000],
      ],
    );
  });

  it("prices every night of a stay that crosses into high season", async () => {
    await db.insert(seasonRanges).values({ season: "high", startsOn: "2026-12-20", endsOn: "2027-01-05", label: "Test" });
    const availability = await loadAvailability(db, { ...DEC, checkIn: "2026-12-19", checkOut: "2026-12-22" }, NOW);
    const standard = availability.rooms[0].rates.find((rate) => rate.name === "Standard Rate")!;
    assert.deepEqual(
      standard.nightly.map((night) => night.rate),
      [2_200_000, 2_800_000, 2_800_000],
    );
    assert.equal(standard.total, 7_800_000);
  });

  it("hides a room type that a block takes out of sale for part of the stay", async () => {
    await db.insert(blocks).values({ roomTypeId: "dlx-queen", startsOn: "2026-12-12", endsOn: "2026-12-14", units: 1, reason: "repairs" });
    assert.ok(!(await typeIds(db)).includes("dlx-queen"));
    // The same dates a day earlier do not touch the block.
    assert.ok((await typeIds(db, { ...DEC, checkIn: "2026-12-09", checkOut: "2026-12-12" })).includes("dlx-queen"));
  });
});

describe("createReservation", () => {
  it("holds the room: it disappears for those dates but not for back-to-back dates", async () => {
    const db = await testDb();
    const made = await createReservation(db, booking("dlx-queen"), NOW);
    assert.match(made.code, new RegExp(`^${property.bookingCodePrefix}-[A-Z2-9]{6}$`));
    assert.equal(made.status, "pending");
    assert.ok(!(await typeIds(db)).includes("dlx-queen"));
    assert.ok((await typeIds(db, { ...DEC, checkIn: "2026-12-13", checkOut: "2026-12-15" })).includes("dlx-queen"));
    assert.ok((await typeIds(db, { ...DEC, checkIn: "2026-12-07", checkOut: "2026-12-10" })).includes("dlx-queen"));
  });

  it("refuses the last room a second time", async () => {
    const db = await testDb();
    await createReservation(db, booking("dlx-queen"), NOW);
    await assert.rejects(createReservation(db, booking("dlx-queen"), NOW), QuoteError);
  });

  it("gives the last room to exactly one of several guests asking at once", async () => {
    const db = await testDb();
    const results = await Promise.allSettled(
      ["a", "b", "c", "d"].map((id) => createReservation(db, booking("dlx-queen", { requestId: `attempt-${id}-0000` }), NOW)),
    );
    assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
    for (const result of results) if (result.status === "rejected") assert.ok(result.reason instanceof QuoteError);
    assert.equal((await db.select().from(reservations)).length, 1);
  });

  it("answers a repeated attempt with the first reservation", async () => {
    const db = await testDb();
    const first = await createReservation(db, booking("std-king", { requestId: "same-attempt-1" }), NOW);
    const again = await createReservation(db, booking("std-king", { requestId: "same-attempt-1" }), NOW);
    assert.equal(again.code, first.code);
    assert.equal((await db.select().from(reservations)).length, 1);
  });

  it("holds each of several rooms of a type it books", async () => {
    const db = await testDb();
    const rooms = [
      { roomTypeId: "std-king", rateId: "std-king-standard", adults: 2, children: 0 },
      { roomTypeId: "std-king", rateId: "std-king-standard", adults: 1, children: 0 },
    ];
    await createReservation(db, booking("std-king", { rooms }), NOW);
    assert.ok(!(await typeIds(db)).includes("std-king"));
    await assert.rejects(createReservation(db, booking("std-king"), NOW), QuoteError);
  });

  it("refuses a booking whose price has moved since the guest saw it", async () => {
    const db = await testDb();
    await assert.rejects(createReservation(db, booking("std-twin", { expectedTotal: 1_000_000 }), NOW), QuoteError);
  });

  it("refuses more guests than the room takes", async () => {
    const db = await testDb();
    const rooms = [{ roomTypeId: "dlx-king", rateId: "dlx-king-standard", adults: 3, children: 0 }];
    await assert.rejects(createReservation(db, booking("dlx-king", { rooms }), NOW), QuoteError);
  });

  it("takes the first night of each room as the deposit and caps a staff price", async () => {
    const db = await testDb();
    const rooms = [{ roomTypeId: "dlx-king", rateId: "dlx-king-extended", adults: 2, children: 0 }];
    const made = await createReservation(db, booking("dlx-king", { rooms }), NOW);
    assert.equal(made.total, 6_270_000);
    assert.equal(made.deposit, 2_090_000);

    const cheap = await createReservation(db, booking("std-king", { source: "admin", totalOverride: 1_000_000 }), NOW);
    assert.equal(cheap.total, 1_000_000);
    assert.equal(cheap.deposit, 1_000_000);
    assert.equal(cheap.status, "confirmed");
  });

  it("confirms at once when auto-confirm is on", async () => {
    const db = await testDb();
    await saveSettings(db, { autoConfirm: true });
    assert.equal((await createReservation(db, booking("std-twin"), NOW)).status, "confirmed");
  });
});

describe("holding time and status changes", () => {
  it("frees the rooms of a pending request after the hold, but not before", async () => {
    const db = await testDb();
    await createReservation(db, booking("dlx-queen"), NOW);
    assert.ok(!(await typeIds(db, DEC, hoursLater(23))).includes("dlx-queen"));
    assert.ok((await typeIds(db, DEC, hoursLater(25))).includes("dlx-queen"));
  });

  it("keeps the rooms of a confirmed reservation however long ago it was made", async () => {
    const db = await testDb();
    const made = await createReservation(db, booking("dlx-queen"), NOW);
    assert.equal((await confirmReservation(db, made.code, NOW)).ok, true);
    assert.ok(!(await typeIds(db, DEC, hoursLater(24 * 30))).includes("dlx-queen"));
  });

  it("frees the rooms when a reservation is cancelled", async () => {
    const db = await testDb();
    const made = await createReservation(db, booking("dlx-queen"), NOW);
    assert.equal((await cancelReservation(db, made.code, NOW)).ok, true);
    assert.ok((await typeIds(db)).includes("dlx-queen"));
  });

  it("will not confirm an expired request whose room was taken meanwhile", async () => {
    const db = await testDb();
    const expired = await createReservation(db, booking("dlx-queen"), NOW);
    const later = hoursLater(30);
    await createReservation(db, booking("dlx-queen", { source: "admin" }), later);
    const result = await confirmReservation(db, expired.code, later);
    assert.equal(result.ok, false);
  });

  it("confirms an expired request whose room is still free", async () => {
    const db = await testDb();
    const expired = await createReservation(db, booking("dlx-queen"), NOW);
    const result = await confirmReservation(db, expired.code, hoursLater(30));
    assert.equal(result.ok, true);
  });
});

describe("calendarUsage", () => {
  it("counts booked, blocked and free rooms per day", async () => {
    const db = await testDb();
    await createReservation(db, booking("std-king"), NOW);
    await db.insert(blocks).values({ roomTypeId: "std-king", startsOn: "2026-12-11", endsOn: "2026-12-12", units: 1 });
    const calendar = await calendarUsage(db, "2026-12-09", "2026-12-14", NOW);
    const king = calendar.types.find((type) => type.id === "std-king")!;
    assert.deepEqual(
      king.perDay.map((day) => [day.day, day.booked, day.blocked, day.free]),
      [
        ["2026-12-09", 0, 0, 2],
        ["2026-12-10", 1, 0, 1],
        ["2026-12-11", 1, 1, 0],
        ["2026-12-12", 1, 0, 1],
        ["2026-12-13", 0, 0, 2],
      ],
    );
  });
});
