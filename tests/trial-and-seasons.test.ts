import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { eq, like } from "drizzle-orm";
import { blocks, payments, reservations, roomTypes } from "@/lib/db/schema";
import { addSeasonRange, copySeasonsToNextYear, listSeasonRanges, nextYearDay, updateRoomPrices } from "@/lib/booking/native/admin-store";
import { seasonRuns } from "@/lib/booking/native/engine";
import { addSampleBookings, countSampleBookings, removeSampleBookings } from "@/lib/booking/native/samples";
import { createReservation, displayStatus } from "@/lib/booking/native/store";
import { sendMail } from "@/lib/mail";
import { testDb } from "./helpers/test-db";

describe("seasons of a year", () => {
  const ranges = [
    { season: "shoulder" as const, startsOn: "2026-06-01", endsOn: "2026-07-16" },
    { season: "high" as const, startsOn: "2026-07-01", endsOn: "2026-09-01" },
  ];

  it("groups every day into runs, high season winning where ranges overlap", () => {
    const runs = seasonRuns(2026, ranges);
    assert.deepEqual(
      runs.map((run) => [run.season, run.startsOn, run.endsOn, run.days]),
      [
        ["low", "2026-01-01", "2026-06-01", 151],
        ["shoulder", "2026-06-01", "2026-07-01", 30],
        ["high", "2026-07-01", "2026-09-01", 62],
        ["low", "2026-09-01", "2027-01-01", 122],
      ],
    );
    assert.equal(runs.reduce((sum, run) => sum + run.days, 0), 365);
    assert.equal(seasonRuns(2028, []).reduce((sum, run) => sum + run.days, 0), 366);
  });

  it("moves a day to the next year, 29 February to 1 March", () => {
    assert.equal(nextYearDay("2026-07-01"), "2027-07-01");
    assert.equal(nextYearDay("2026-12-31"), "2027-12-31");
    assert.equal(nextYearDay("2028-02-29"), "2029-03-01");
  });

  it("copies one year's season dates to the next, once", async () => {
    const db = await testDb();
    await addSeasonRange(db, { season: "high", startsOn: "2026-07-01", endsOn: "2026-09-01", label: "Summer" });
    await addSeasonRange(db, { season: "high", startsOn: "2026-12-20", endsOn: "2027-01-06", label: "Christmas" });
    await addSeasonRange(db, { season: "shoulder", startsOn: "2025-06-01", endsOn: "2025-07-01", label: "" });

    assert.deepEqual(await copySeasonsToNextYear(db, 2026), { ok: true, copied: 2 });
    const next = (await listSeasonRanges(db)).filter((range) => range.startsOn.startsWith("2027-"));
    assert.deepEqual(
      next.map((range) => [range.season, range.startsOn, range.endsOn, range.label]),
      [
        ["high", "2027-07-01", "2027-09-01", "Summer"],
        ["high", "2027-12-20", "2028-01-06", "Christmas"],
      ],
    );

    const again = await copySeasonsToNextYear(db, 2026);
    assert.equal(again.ok, false);
    const empty = await copySeasonsToNextYear(db, 2030);
    assert.equal(empty.ok, false);
    assert.equal((await listSeasonRanges(db)).length, 5);
  });

  it("saves the three prices of a room type without touching the rest", async () => {
    const db = await testDb();
    const [before] = await db.select().from(roomTypes).where(eq(roomTypes.id, "std-twin"));
    await updateRoomPrices(db, "std-twin", { priceLow: 700_000, priceShoulder: 800_000, priceHigh: 900_000 });
    const [after] = await db.select().from(roomTypes).where(eq(roomTypes.id, "std-twin"));
    assert.deepEqual([after.priceLow, after.priceShoulder, after.priceHigh], [700_000, 800_000, 900_000]);
    assert.deepEqual({ ...after, priceLow: 0, priceShoulder: 0, priceHigh: 0 }, { ...before, priceLow: 0, priceShoulder: 0, priceHigh: 0 });
  });
});

describe("sample bookings", () => {
  const NOW = new Date("2026-11-13T04:00:00Z");

  it("adds a working set around today once, and removes only those", async () => {
    const db = await testDb();
    const own = await createReservation(
      db,
      {
        query: { checkIn: "2027-03-01", checkOut: "2027-03-03", adults: 2, children: 0 },
        rooms: [{ roomTypeId: "std-king", rateId: "std-king-standard", adults: 2, children: 0 }],
        addOns: [],
        guest: { firstName: "Real", lastName: "Guest" },
        source: "admin",
      },
      NOW,
    );

    const result = await addSampleBookings(db, NOW);
    assert.deepEqual(result, { added: 15, skipped: 0, already: 0 });
    assert.equal(await countSampleBookings(db), 15);

    const rows = await db.select().from(reservations).where(like(reservations.requestId, "sample-%"));
    const shown = rows.map((row) => displayStatus(row, NOW));
    assert.equal(shown.filter((status) => status === "pending").length, 2, "two requests still waiting");
    assert.equal(shown.filter((status) => status === "expired").length, 1);
    assert.equal(shown.filter((status) => status === "cancelled").length, 1);
    assert.equal(rows.filter((row) => row.cancelRequestedAt).length, 1, "one guest asking to cancel");
    assert.ok(rows.some((row) => row.checkIn <= "2026-11-13" && row.checkOut > "2026-11-13"), "someone is staying tonight");
    assert.ok(rows.every((row) => row.email.endsWith("@example.com")), "no sample email can reach a person");
    assert.ok((await db.select().from(payments)).length >= 10);
    assert.equal((await db.select().from(blocks)).length, 1);

    assert.deepEqual(await addSampleBookings(db, NOW), { added: 0, skipped: 0, already: 15 });

    assert.equal(await removeSampleBookings(db), 15);
    assert.equal(await countSampleBookings(db), 0);
    assert.equal((await db.select().from(payments)).length, 0);
    assert.equal((await db.select().from(blocks)).length, 0);
    const left = await db.select().from(reservations);
    assert.deepEqual(
      left.map((row) => row.code),
      [own.code],
    );
  });
});

describe("email in the trial version", () => {
  const saved = { ...process.env };
  const realFetch = globalThis.fetch;
  afterEach(() => {
    process.env = { ...saved };
    globalThis.fetch = realFetch;
  });

  function catchSends() {
    const sent: { to: string[]; subject: string; text: string }[] = [];
    globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      sent.push({
        to: body.personalizations[0].to.map((entry: { email: string }) => entry.email),
        subject: body.subject,
        text: body.content[0].value,
      });
      return new Response(null, { status: 202 });
    }) as typeof fetch;
    return sent;
  }

  it("sends every message only to the trial inbox, saying who it was for", async () => {
    Object.assign(process.env, { BOOKING_TRIAL: "1", BOOKING_TRIAL_EMAIL: "trial@example.com", SENDGRID_API_KEY: "test", CONTACT_FROM_EMAIL: "from@example.com" });
    const sent = catchSends();
    assert.equal(await sendMail({ to: ["guest@example.com"], subject: "Your booking", text: "Hello" }), true);
    assert.deepEqual(sent, [
      { to: ["trial@example.com"], subject: "[Trial] Your booking", text: "Trial version: in the real system this email would go to guest@example.com.\n\nHello" },
    ]);
  });

  it("sends nothing in the trial version without a trial inbox", async () => {
    Object.assign(process.env, { BOOKING_TRIAL: "1", SENDGRID_API_KEY: "test", CONTACT_FROM_EMAIL: "from@example.com" });
    delete process.env.BOOKING_TRIAL_EMAIL;
    const sent = catchSends();
    assert.equal(await sendMail({ to: ["guest@example.com"], subject: "Your booking", text: "Hello" }), true);
    assert.equal(sent.length, 0);
  });

  it("sends to the real address outside the trial version", async () => {
    Object.assign(process.env, { SENDGRID_API_KEY: "test", CONTACT_FROM_EMAIL: "from@example.com" });
    delete process.env.BOOKING_TRIAL;
    const sent = catchSends();
    await sendMail({ to: ["guest@example.com"], subject: "Your booking", text: "Hello" });
    assert.deepEqual(
      sent.map((mail) => [mail.to, mail.subject]),
      [[["guest@example.com"], "Your booking"]],
    );
  });
});
