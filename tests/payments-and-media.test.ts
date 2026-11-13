import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { eq } from "drizzle-orm";

// Xendit is never called for real here: every request goes to the fake fetch below.
process.env.XENDIT_SECRET_KEY = "test-secret-key";
process.env.XENDIT_CALLBACK_TOKEN = "test-callback-token";

import type { Db } from "@/lib/db";
import { media, payments, reservations, roomTypes } from "@/lib/db/schema";
import { assignLanes } from "@/lib/booking/native/engine";
import { addRoomPhoto, removeRoomPhoto } from "@/lib/booking/native/admin-store";
import { deleteMediaIfUnused, getMedia, mediaIdFrom, mediaUrl, saveMedia, sniffImage } from "@/lib/booking/native/media";
import { savePaymentSettings } from "@/lib/booking/native/payment-settings";
import { applyXenditCallback, deletePayment, recordPayment, startOnlinePayment, summarize } from "@/lib/booking/native/payments";
import { calendarLanes, createReservation, getReservation, loadAvailability, type NewReservation } from "@/lib/booking/native/store";
import { buildQuote } from "@/lib/booking/stay";
import type { Availability } from "@/lib/booking/types";
import { callbackTokenMatches, createInvoice, parseCallback } from "@/lib/payments/xendit";
import { testDb } from "./helpers/test-db";

const NOW = new Date("2026-11-12T00:00:00Z");
const DEC = { checkIn: "2026-12-10", checkOut: "2026-12-13", adults: 2, children: 0 };
const GUEST = { firstName: "Ana", lastName: "Test", email: "ana@example.com", phone: "+62 812 0000 0000", country: "ID" };
const URLS = { success: "https://site.test/book/manage/?paid=1", failure: "https://site.test/book/manage/" };

function booking(roomTypeId: string, extra: Partial<NewReservation> = {}): NewReservation {
  return { query: DEC, rooms: [{ roomTypeId, rateId: `${roomTypeId}-standard`, adults: 2, children: 0 }], addOns: [], guest: GUEST, source: "web", ...extra };
}

/** A stand-in for Xendit: remembers what it was sent, answers invoices like the API does. */
function fakeXendit(invoiceStatus = "PAID") {
  const calls: { url: string; method: string; body: Record<string, unknown> | null; auth: string }[] = [];
  const invoices = new Map<string, Record<string, unknown>>();
  const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : null;
    calls.push({ url, method: init?.method ?? "GET", body, auth: String((init?.headers as Record<string, string>)?.Authorization ?? "") });
    if (init?.method === "POST") {
      const id = `inv_${invoices.size + 1}`;
      const invoice = { id, external_id: body!.external_id, status: "PENDING", amount: body!.amount, currency: body!.currency, invoice_url: `https://checkout.example/${id}`, expiry_date: "2026-11-13T00:00:00.000Z" };
      invoices.set(id, invoice);
      return Response.json(invoice);
    }
    const id = decodeURIComponent(url.split("/").pop() ?? "");
    const invoice = invoices.get(id);
    return invoice ? Response.json({ ...invoice, status: invoiceStatus }) : Response.json({ error_code: "INVOICE_NOT_FOUND_ERROR" }, { status: 404 });
  }) as typeof fetch;
  return { fetchImpl, calls, invoices };
}

describe("assignLanes", () => {
  it("puts stays that do not overlap on the same row and others on new rows", () => {
    const lanes = assignLanes(3, [
      { startsOn: "2026-12-10", endsOn: "2026-12-13" },
      { startsOn: "2026-12-11", endsOn: "2026-12-12" },
      { startsOn: "2026-12-13", endsOn: "2026-12-15" },
    ]);
    assert.equal(lanes.length, 3);
    assert.deepEqual(
      lanes.map((lane) => lane.map((item) => item.startsOn)),
      [["2026-12-10", "2026-12-13"], ["2026-12-11"], []],
    );
  });

  it("adds rows past the number of rooms instead of hiding an overbooking", () => {
    const lanes = assignLanes(1, [
      { startsOn: "2026-12-10", endsOn: "2026-12-12" },
      { startsOn: "2026-12-11", endsOn: "2026-12-13" },
    ]);
    assert.equal(lanes.length, 2);
  });
});

describe("deposit rule in the price", () => {
  const availability = (policy?: Availability["depositPolicy"]): Availability => ({
    query: DEC,
    nights: 3,
    currency: "IDR",
    includedTaxRate: 0,
    source: "native",
    addOns: [],
    depositPolicy: policy,
    rooms: [
      {
        roomTypeId: "a",
        name: "A",
        description: "",
        maxGuests: 2,
        photos: [],
        features: [],
        available: 1,
        rates: [{ rateId: "a-standard", name: "Standard Rate", total: 3_000_000, nightly: [{ date: "2026-12-10", rate: 1_000_000 }, { date: "2026-12-11", rate: 1_000_000 }, { date: "2026-12-12", rate: 1_000_000 }] }],
      },
    ],
  });
  const cart = [{ roomTypeId: "a", rateId: "a-standard", adults: 2, children: 0 }];

  it("is the first night without a rule", () => {
    assert.equal(buildQuote(availability(), cart, []).deposit, 1_000_000);
  });
  it("can be a percentage of the total", () => {
    assert.equal(buildQuote(availability({ mode: "percent", percent: 30 }), cart, []).deposit, 900_000);
  });
  it("can be the whole stay", () => {
    assert.equal(buildQuote(availability({ mode: "full" }), cart, []).deposit, 3_000_000);
  });
});

describe("photos", () => {
  it("knows images by their first bytes", () => {
    assert.equal(sniffImage(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])), "image/jpeg");
    assert.equal(sniffImage(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), "image/png");
    assert.equal(sniffImage(new Uint8Array([...Buffer.from("RIFF"), 0, 0, 0, 0, ...Buffer.from("WEBP")])), "image/webp");
    assert.equal(sniffImage(new Uint8Array(Buffer.from("<svg onload=alert(1)>"))), null);
  });

  it("stores a photo, gives it to a room, and deletes it only when no room shows it", async () => {
    const db = await testDb();
    const bytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4]);
    const url = mediaUrl(await saveMedia(db, bytes, "image/jpeg"));
    const id = mediaIdFrom(url)!;
    assert.deepEqual((await getMedia(db, id))!.bytes, bytes);

    assert.equal(await addRoomPhoto(db, "dlx-king", url), true);
    assert.equal(await addRoomPhoto(db, "dlx-queen", url), true);
    await removeRoomPhoto(db, "dlx-king", url);
    await deleteMediaIfUnused(db, url);
    assert.ok(await getMedia(db, id), "still on the Deluxe Queen");

    await removeRoomPhoto(db, "dlx-queen", url);
    await deleteMediaIfUnused(db, url);
    assert.equal(await getMedia(db, id), null);
    assert.equal(await addRoomPhoto(db, "no-such-room", url), false);
  });

  it("never treats a site image address as an upload", () => {
    assert.equal(mediaIdFrom("/images/uploads/2025/09/Standard-room.jpg"), null);
    assert.equal(mediaIdFrom("/media/../../etc/passwd"), null);
  });
});

describe("payments recorded by staff", () => {
  it("adds up what was paid and what is still due", async () => {
    const db = await testDb();
    const made = await createReservation(db, booking("std-king"), NOW);
    const recorded = await recordPayment(db, { code: made.code, amount: 1_000_000, method: "bank", paidOn: "2026-11-12", note: "slip on WhatsApp" });
    assert.equal(recorded.ok, true);
    const detail = (await getReservation(db, made.code))!;
    const summary = summarize(detail.reservation, detail.payments, NOW);
    assert.equal(summary.paid, 1_000_000);
    assert.equal(summary.depositDue, made.deposit - 1_000_000);
    assert.equal(summary.balance, made.total - 1_000_000);

    assert.equal(await deletePayment(db, made.code, detail.payments[0].id), true);
    assert.equal(summarize(detail.reservation, (await getReservation(db, made.code))!.payments, NOW).paid, 0);
  });

  it("takes the deposit rule into new bookings", async () => {
    const db = await testDb();
    await savePaymentSettings(db, { depositMode: "percent", depositPercent: 30 });
    assert.deepEqual((await loadAvailability(db, DEC, NOW)).depositPolicy, { mode: "percent", percent: 30 });
    const made = await createReservation(db, booking("std-twin"), NOW);
    assert.equal(made.deposit, Math.round(made.total * 0.3));
  });
});

describe("Xendit", () => {
  it("sends the invoice with the documented field names and Basic auth", async () => {
    const xendit = fakeXendit();
    await createInvoice(
      { externalId: "MOC-1-ABC", amount: 500_000, currency: "IDR", description: "Deposit", durationSeconds: 86_400, payerEmail: "a@example.com", givenNames: "Ana", surname: "Test", successRedirectUrl: URLS.success, failureRedirectUrl: URLS.failure },
      xendit.fetchImpl,
    );
    const [call] = xendit.calls;
    assert.equal(call.url, "https://api.xendit.co/v2/invoices");
    assert.equal(call.auth, `Basic ${Buffer.from("test-secret-key:").toString("base64")}`);
    for (const key of ["external_id", "amount", "currency", "description", "invoice_duration", "payer_email", "customer", "success_redirect_url", "failure_redirect_url"]) {
      assert.ok(key in call.body!, `${key} is sent`);
    }
  });

  it("checks the callback token in constant time and refuses anything else", () => {
    assert.equal(callbackTokenMatches("test-callback-token"), true);
    assert.equal(callbackTokenMatches("test-callback-tokeN"), false);
    assert.equal(callbackTokenMatches(null), false);
    assert.equal(parseCallback({ id: "x" }), null);
  });

  it("opens one payment page for the deposit and reuses it on a second click", async () => {
    const db = await testDb();
    await savePaymentSettings(db, { onlineEnabled: true });
    const made = await createReservation(db, booking("dlx-king"), NOW);
    const xendit = fakeXendit();
    const first = await startOnlinePayment(db, made.code, URLS, NOW, xendit.fetchImpl);
    const second = await startOnlinePayment(db, made.code, URLS, NOW, xendit.fetchImpl);
    assert.equal(first.ok && second.ok && first.url === second.url, true);
    assert.equal(xendit.calls.length, 1);
    assert.equal(xendit.calls[0].body!.amount, made.deposit);
    const rows = await db.select().from(payments).where(eq(payments.reservationId, made.id));
    assert.equal(rows.length, 1);
    assert.equal(rows[0].status, "pending");
  });

  it("records a paid callback once, after asking Xendit, and confirms the waiting request", async () => {
    const db = await testDb();
    const made = await createReservation(db, booking("dlx-queen"), NOW);
    const xendit = fakeXendit("PAID");
    await startOnlinePayment(db, made.code, URLS, NOW, xendit.fetchImpl);
    const [row] = await db.select().from(payments).where(eq(payments.reservationId, made.id));
    const callback = parseCallback({ id: row.providerId, external_id: row.reference, status: "PAID", amount: row.amount, paid_amount: row.amount, paid_at: "2026-11-12T03:00:00.000Z", payment_method: "BANK_TRANSFER", payment_channel: "BCA", currency: "IDR" })!;

    const result = await applyXenditCallback(db, callback, NOW, xendit.fetchImpl);
    assert.equal(result.kind, "paid");
    assert.equal(result.kind === "paid" && result.confirmed, true);
    const [after] = await db.select().from(reservations).where(eq(reservations.id, made.id));
    assert.equal(after.status, "confirmed");
    assert.equal((await db.select().from(payments).where(eq(payments.id, row.id)))[0].status, "paid");

    // Xendit retries: the second one changes nothing.
    assert.equal((await applyXenditCallback(db, callback, NOW, xendit.fetchImpl)).kind, "already-paid");
  });

  it("does not record a payment Xendit itself does not report as paid", async () => {
    const db = await testDb();
    const made = await createReservation(db, booking("dlx-twin"), NOW);
    const xendit = fakeXendit("PENDING");
    await startOnlinePayment(db, made.code, URLS, NOW, xendit.fetchImpl);
    const [row] = await db.select().from(payments).where(eq(payments.reservationId, made.id));
    const forged = parseCallback({ id: row.providerId, external_id: row.reference, status: "PAID", amount: row.amount, currency: "IDR" })!;
    assert.equal((await applyXenditCallback(db, forged, NOW, xendit.fetchImpl)).kind, "ignored");
    assert.equal((await db.select().from(payments).where(eq(payments.id, row.id)))[0].status, "pending");
    const [still] = await db.select().from(reservations).where(eq(reservations.id, made.id));
    assert.equal(still.status, "pending");
  });

  it("ignores unknown invoices and marks expired pages", async () => {
    const db = await testDb();
    const made = await createReservation(db, booking("std-king"), NOW);
    const xendit = fakeXendit();
    await startOnlinePayment(db, made.code, URLS, NOW, xendit.fetchImpl);
    const [row] = await db.select().from(payments).where(eq(payments.reservationId, made.id));
    assert.equal((await applyXenditCallback(db, parseCallback({ id: "inv_x", external_id: "OTHER-1", status: "PAID" })!, NOW, xendit.fetchImpl)).kind, "ignored");
    assert.equal((await applyXenditCallback(db, parseCallback({ id: row.providerId, external_id: row.reference, status: "EXPIRED" })!, NOW, xendit.fetchImpl)).kind, "expired");
    assert.equal((await db.select().from(payments).where(eq(payments.id, row.id)))[0].status, "expired");
  });
});

describe("calendarLanes", () => {
  it("draws each stay and block on a row of its room type", async () => {
    const db: Db = await testDb();
    const one = await createReservation(db, booking("std-king"), NOW);
    await createReservation(db, booking("std-king", { query: { ...DEC, checkIn: "2026-12-11", checkOut: "2026-12-12" } }), NOW);
    const board = await calendarLanes(db, "2026-12-09", "2026-12-16", NOW);
    const king = board.types.find((type) => type.id === "std-king")!;
    assert.equal(king.lanes.length, 2);
    assert.deepEqual(
      king.lanes.map((lane) => lane.items.map((item) => (item.kind === "stay" ? item.code : "block"))),
      [[one.code], [king.lanes[1].items[0].kind === "stay" ? king.lanes[1].items[0].code : ""]],
    );
    assert.equal(board.days.length, 7);
    const untouched = (await db.select().from(roomTypes).where(eq(roomTypes.id, "std-king")))[0];
    assert.equal(untouched.units, 2);
    assert.equal((await db.select().from(media)).length, 0);
  });
});
