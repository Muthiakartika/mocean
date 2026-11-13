"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { endSession, loginBlocked, recordLoginFailure, requireAdmin, startSession } from "@/lib/admin/session";
import { verifyPassword } from "@/lib/admin/password";
import { getDb } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import {
  addBlock,
  addRoomPhoto,
  addSeasonRange,
  copySeasonsToNextYear,
  createAddOn,
  listAddOns,
  listRoomTypes,
  makeCoverPhoto,
  removeBlock,
  removeRoomPhoto,
  removeSeasonRange,
  updateAddOn,
  updateRoomPrices,
  updateRoomType,
} from "@/lib/booking/native/admin-store";
import { addSampleBookings, removeSampleBookings } from "@/lib/booking/native/samples";
import { trialMode } from "@/lib/booking/native/trial";
import { MAX_UPLOAD_BYTES, deleteMediaIfUnused, mediaUrl, saveMedia, sniffImage } from "@/lib/booking/native/media";
import { loadPaymentSettings, savePaymentSettings, type DepositMode } from "@/lib/booking/native/payment-settings";
import { METHOD_LABEL, deletePayment, recordPayment } from "@/lib/booking/native/payments";
import type { PaymentMethod } from "@/lib/db/schema";
import { sendBookingCancelled, sendBookingConfirmed, sendPaymentReceived } from "@/lib/booking/native/emails";
import { saveSettings } from "@/lib/booking/native/settings";
import { cancelReservation, confirmReservation, createReservation, getReservation, saveAdminNotes } from "@/lib/booking/native/store";
import { QuoteError, addDays, formatMoney, nightsBetween, parseDay } from "@/lib/booking/stay";

/**
 * Everything the admin pages do. Each action checks the login itself (requireAdmin): a server action can be called
 * without ever opening the page that holds its form.
 *
 * Results go back to the page in the address: ?done=message or ?error=message (text, shown escaped).
 */

const RATES = "/admin/rates/";
const ROOMS = "/admin/rooms/";
const BLOCKS = "/admin/blocks/";
const GUIDE = "/admin/guide/";
const reservationPath = (code: string) => `/admin/reservations/${encodeURIComponent(code)}/`;

/** A function declaration (not a const), so TypeScript knows the code after a call to it is unreachable. */
function back(path: string, kind: "done" | "error", message: string): never {
  redirect(`${path}${path.includes("?") ? "&" : "?"}${kind}=${encodeURIComponent(message)}`);
}

const text = (form: FormData, name: string, max = 200) => String(form.get(name) ?? "").trim().slice(0, max);
const flag = (form: FormData, name: string) => form.get(name) === "on";

function whole(form: FormData, name: string, min: number, max: number): number | null {
  const raw = text(form, name, 20);
  if (raw === "") return null;
  const value = Number(raw);
  return Number.isInteger(value) && value >= min && value <= max ? value : null;
}

/** A whole amount typed with or without separators ("2,200,000", "2.200.000", "2 200 000"). */
function money(form: FormData, name: string, max = 100_000_000): number | null {
  const raw = text(form, name, 30).replace(/[^\d]/g, "");
  if (raw === "") return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value <= max ? value : null;
}

function decimal(form: FormData, name: string, min: number, max: number): number | null {
  const raw = text(form, name, 20);
  const value = Number(raw);
  return raw !== "" && Number.isFinite(value) && value >= min && value <= max ? value : null;
}

function day(form: FormData, name: string): string | null {
  const raw = text(form, name, 10);
  return parseDay(raw) ? raw : null;
}

// A valid scrypt string that matches no password, so an unknown email takes as long as a wrong password.
const NO_USER_HASH = `scrypt$${"00".repeat(16)}$${"00".repeat(64)}`;

export async function loginAction(form: FormData) {
  const email = text(form, "email").toLowerCase();
  const password = String(form.get("password") ?? "");
  if (await loginBlocked()) back("/admin/login/", "error", "Too many attempts. Wait ten minutes and try again.");

  const [user] = await (await getDb()).select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
  const valid = await verifyPassword(password, user?.passwordHash ?? NO_USER_HASH);
  if (!user || !valid) {
    await recordLoginFailure();
    back("/admin/login/", "error", "Wrong email or password.");
  }
  await startSession(user.id);
  redirect("/admin/");
}

export async function logoutAction() {
  await endSession();
  redirect("/admin/login/");
}

export async function confirmAction(form: FormData) {
  await requireAdmin();
  const code = text(form, "code");
  const db = await getDb();
  const result = await confirmReservation(db, code);
  if (!result.ok) return back(reservationPath(code), "error", result.message);
  if (!result.changed) return back(reservationPath(code), "done", "This booking was already confirmed.");
  const detail = await getReservation(db, code);
  const sent = detail ? await sendBookingConfirmed(detail, await loadPaymentSettings(db)) : false;
  back(
    reservationPath(code),
    "done",
    sent ? "Booking confirmed and the guest was emailed." : "Booking confirmed. No email went out (no guest address, or email is not set up).",
  );
}

export async function cancelAction(form: FormData) {
  await requireAdmin();
  const code = text(form, "code");
  const db = await getDb();
  const result = await cancelReservation(db, code);
  if (!result.ok) return back(reservationPath(code), "error", result.message);
  if (!result.changed) return back(reservationPath(code), "done", "This booking was already cancelled.");
  let sent = false;
  if (flag(form, "notify")) {
    const detail = await getReservation(db, code);
    sent = detail ? await sendBookingCancelled(detail) : false;
  }
  back(reservationPath(code), "done", sent ? "Booking cancelled and the guest was emailed." : "Booking cancelled. The rooms are for sale again.");
}

export async function notesAction(form: FormData) {
  await requireAdmin();
  const code = text(form, "code");
  await saveAdminNotes(await getDb(), code, text(form, "adminNotes", 2000));
  back(reservationPath(code), "done", "Notes saved.");
}

/** A booking entered by staff (a guest who wrote on WhatsApp). Priced and checked exactly like a website booking. */
export async function createManualAction(form: FormData) {
  await requireAdmin();
  const checkIn = day(form, "checkin");
  const checkOut = day(form, "checkout");
  const base = `/admin/reservations/new/?checkin=${checkIn ?? ""}&checkout=${checkOut ?? ""}&adults=${text(form, "adults", 2)}&children=${text(form, "children", 2)}`;
  if (!checkIn || !checkOut || nightsBetween(checkIn, checkOut) < 1) return back("/admin/reservations/new/", "error", "Choose check-in and check-out dates.");

  const db = await getDb();
  const rooms = [];
  for (const type of await listRoomTypes(db)) {
    const quantity = whole(form, `qty_${type.id}`, 0, 10) ?? 0;
    const rate = text(form, `rate_${type.id}`, 10) === "standard" ? "standard" : "extended";
    for (let n = 0; n < quantity; n++) {
      rooms.push({
        roomTypeId: type.id,
        rateId: `${type.id}-${rate}`,
        adults: whole(form, `adults_${type.id}`, 1, 12) ?? 2,
        children: whole(form, `children_${type.id}`, 0, 8) ?? 0,
      });
    }
  }
  const addOns = [];
  for (const addOn of await listAddOns(db)) {
    const quantity = whole(form, `addon_${addOn.id}`, 0, 20) ?? 0;
    if (quantity > 0) addOns.push({ addOnId: addOn.id, quantity });
  }
  if (rooms.length === 0) return back(base, "error", "Choose at least one room.");

  const firstName = text(form, "firstName", 100);
  const lastName = text(form, "lastName", 100);
  const email = text(form, "email", 100);
  if (!firstName || !lastName) return back(base, "error", "Enter the guest's first and last name.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return back(base, "error", "That email address does not look right.");

  const override = text(form, "total", 12) === "" ? undefined : whole(form, "total", 0, 2_000_000_000);
  if (override === null) return back(base, "error", "Check the price you entered.");

  let created;
  try {
    created = await createReservation(db, {
      query: { checkIn, checkOut, adults: 1, children: 0 },
      rooms,
      addOns,
      guest: { firstName, lastName, email, phone: text(form, "phone", 100), country: text(form, "country", 2).toUpperCase() },
      source: "admin",
      status: text(form, "status", 10) === "pending" ? "pending" : "confirmed",
      totalOverride: override,
      adminNotes: text(form, "adminNotes", 2000),
    });
  } catch (error) {
    if (error instanceof QuoteError) return back(base, "error", `${error.message} Check the dates and rooms again.`);
    throw error;
  }

  let note = "Booking saved.";
  if (created.status === "confirmed" && flag(form, "notify")) {
    const detail = await getReservation(db, created.code);
    note = detail && (await sendBookingConfirmed(detail, await loadPaymentSettings(db))) ? "Booking saved and the guest was emailed." : "Booking saved. No email went out.";
  }
  back(reservationPath(created.code), "done", note);
}

export async function addBlockAction(form: FormData) {
  await requireAdmin();
  const first = day(form, "from");
  const last = day(form, "until");
  const units = whole(form, "units", 1, 100);
  const roomTypeId = text(form, "roomTypeId", 40);
  if (!first || !last || last < first) return back(BLOCKS, "error", "Choose the first and last night to block (the last night can't be before the first).");
  if (!units) return back(BLOCKS, "error", "Enter how many rooms to block.");
  if (!roomTypeId) return back(BLOCKS, "error", "Choose a room type.");
  await addBlock(await getDb(), { roomTypeId, startsOn: first, endsOn: addDays(last, 1), units, reason: text(form, "reason", 200) });
  back(BLOCKS, "done", "Dates blocked.");
}

export async function removeBlockAction(form: FormData) {
  await requireAdmin();
  const id = whole(form, "id", 1, 2_000_000_000);
  if (id) await removeBlock(await getDb(), id);
  back(BLOCKS, "done", "Block removed. The rooms are for sale again.");
}

/** Back to Rooms with one room type opened and in view. */
function backToRoom(id: string, kind: "done" | "error", message: string): never {
  redirect(`${ROOMS}?${new URLSearchParams({ room: id, [kind]: message })}#room-${id}`);
}

export async function saveRoomTypeAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "id", 40);
  const name = text(form, "name", 120);
  const description = text(form, "description", 2000);
  const features = text(form, "features", 2000)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 20);
  const units = whole(form, "units", 0, 100);
  const maxGuests = whole(form, "maxGuests", 1, 20);
  if (!name) return backToRoom(id, "error", "The room type needs a name.");
  if (units === null || !maxGuests) return backToRoom(id, "error", "Check the number of rooms and the most guests in one room.");
  await updateRoomType(await getDb(), id, { name, description, features, units, maxGuests, active: flag(form, "active") });
  backToRoom(id, "done", `${name} saved.`);
}

/** The whole price table of the Prices page at once: three prices per room type (low-<id>, shoulder-<id>, high-<id>). */
export async function savePricesAction(form: FormData) {
  await requireAdmin();
  const db = await getDb();
  const changes: { id: string; priceLow: number; priceShoulder: number; priceHigh: number }[] = [];
  for (const type of await listRoomTypes(db)) {
    if (!form.has(`low-${type.id}`)) continue;
    const priceLow = money(form, `low-${type.id}`);
    const priceShoulder = money(form, `shoulder-${type.id}`);
    const priceHigh = money(form, `high-${type.id}`);
    if (!priceLow || !priceShoulder || !priceHigh) return back(RATES, "error", `Enter all three prices for ${type.name}. Nothing was saved.`);
    changes.push({ id: type.id, priceLow, priceShoulder, priceHigh });
  }
  for (const change of changes) await updateRoomPrices(db, change.id, change);
  back(RATES, "done", "Prices saved. New searches on the booking page use them at once.");
}

/**
 * Called from the browser (rates/photos.tsx) with a photo already shrunk there; answers instead of redirecting, so the
 * page can upload several photos in a row.
 */
export async function uploadRoomPhotoAction(form: FormData): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  const id = text(form, "roomTypeId", 40);
  const file = form.get("photo");
  if (!(file instanceof Blob) || file.size === 0) return { ok: false, message: "Choose a photo first." };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, message: "That photo is too large (4 MB at most)." };
  const bytes = Buffer.from(await file.arrayBuffer());
  const type = sniffImage(bytes);
  if (!type) return { ok: false, message: "That file is not a JPEG, PNG or WebP photo." };
  const db = await getDb();
  const url = mediaUrl(await saveMedia(db, bytes, type));
  if (!(await addRoomPhoto(db, id, url))) {
    await deleteMediaIfUnused(db, url);
    return { ok: false, message: "That room type no longer exists." };
  }
  return { ok: true, message: "Photo added." };
}

export async function removeRoomPhotoAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "roomTypeId", 40);
  const url = text(form, "url", 500);
  const db = await getDb();
  await removeRoomPhoto(db, id, url);
  await deleteMediaIfUnused(db, url);
  backToRoom(id, "done", "Photo removed.");
}

export async function coverRoomPhotoAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "roomTypeId", 40);
  await makeCoverPhoto(await getDb(), id, text(form, "url", 500));
  backToRoom(id, "done", "Cover photo changed. Guests see it first on the booking page.");
}

/** Back to Prices, showing the year that was just changed. */
function backToSeasons(year: string | null, kind: "done" | "error", message: string): never {
  redirect(`${RATES}?${new URLSearchParams({ ...(year ? { year } : {}), [kind]: message })}#seasons`);
}

export async function addSeasonAction(form: FormData) {
  await requireAdmin();
  const first = day(form, "from");
  const last = day(form, "until");
  const season = text(form, "season", 10);
  const shown = text(form, "year", 4) || null;
  if (season !== "shoulder" && season !== "high") return backToSeasons(shown, "error", "Choose shoulder or high season.");
  if (!first || !last || last < first) {
    return backToSeasons(shown, "error", "Choose the first and last day of the season (the last day can't be before the first).");
  }
  await addSeasonRange(await getDb(), { season, startsOn: first, endsOn: addDays(last, 1), label: text(form, "label", 60) });
  backToSeasons(first.slice(0, 4), "done", "Season dates added.");
}

export async function removeSeasonAction(form: FormData) {
  await requireAdmin();
  const id = whole(form, "id", 1, 2_000_000_000);
  if (id) await removeSeasonRange(await getDb(), id);
  backToSeasons(text(form, "year", 4) || null, "done", "Season dates removed.");
}

export async function copySeasonsAction(form: FormData) {
  await requireAdmin();
  const year = whole(form, "year", 2000, 2100);
  if (!year) return backToSeasons(null, "error", "Choose a year to copy.");
  const result = await copySeasonsToNextYear(await getDb(), year);
  if (!result.ok) return backToSeasons(String(year + 1), "error", result.message);
  const ranges = `${result.copied} season range${result.copied === 1 ? "" : "s"}`;
  backToSeasons(String(year + 1), "done", `${ranges} copied to ${year + 1}. Check the dates: holidays move from year to year.`);
}

export async function saveSettingsAction(form: FormData) {
  await requireAdmin();
  const taxPercent = decimal(form, "taxPercent", 0, 100);
  const minNights = whole(form, "extendedStayMinNights", 1, 30);
  const discount = decimal(form, "extendedStayDiscountPct", 0, 100);
  const holdHours = whole(form, "pendingHoldHours", 1, 720);
  if (taxPercent === null || !minNights || discount === null || !holdHours) return back(RATES, "error", "Check the settings: every field needs a number.");
  await saveSettings(await getDb(), {
    includedTaxRate: taxPercent / 100,
    extendedStayMinNights: minNights,
    extendedStayDiscountPct: discount,
    pendingHoldHours: holdHours,
    autoConfirm: flag(form, "autoConfirm"),
  });
  back(RATES, "done", "Settings saved.");
}

export async function saveAddOnAction(form: FormData) {
  await requireAdmin();
  const price = money(form, "price");
  const name = text(form, "name", 100);
  if (price === null || !name) return back(ROOMS, "error", "An extra needs a name and a price.");
  await updateAddOn(await getDb(), text(form, "id", 60), { name, price, active: flag(form, "active") });
  back(ROOMS, "done", "Extra saved.");
}

const PAYMENTS = "/admin/payments/";

export async function savePaymentSettingsAction(form: FormData) {
  await requireAdmin();
  const section = text(form, "section", 20);
  const db = await getDb();
  if (section === "deposit") {
    const mode = text(form, "depositMode", 20) as DepositMode;
    if (!["first-night", "percent", "full"].includes(mode)) return back(PAYMENTS, "error", "Choose how the deposit is worked out.");
    const percent = whole(form, "depositPercent", 1, 100);
    if (mode === "percent" && percent === null) return back(PAYMENTS, "error", "Enter the deposit percentage, from 1 to 100.");
    await savePaymentSettings(db, { depositMode: mode, ...(percent !== null ? { depositPercent: percent } : {}) });
    return back(PAYMENTS, "done", "Deposit rule saved. It applies to new bookings.");
  }
  if (section === "bank") {
    const enabled = flag(form, "bankEnabled");
    const bankName = text(form, "bankName", 80);
    const bankAccountName = text(form, "bankAccountName", 120);
    const bankAccountNumber = text(form, "bankAccountNumber", 40);
    if (enabled && (!bankName || !bankAccountName || !bankAccountNumber)) {
      return back(PAYMENTS, "error", "To offer bank transfer, fill in the bank, the account name and the account number.");
    }
    await savePaymentSettings(db, { bankEnabled: enabled, bankName, bankAccountName, bankAccountNumber, bankNote: text(form, "bankNote", 300) });
    return back(PAYMENTS, "done", enabled ? "Bank transfer details saved. Guests see them on their booking page and in emails." : "Bank transfer saved, switched off.");
  }
  if (section === "online") {
    await savePaymentSettings(db, { onlineEnabled: flag(form, "onlineEnabled") });
    return back(PAYMENTS, "done", flag(form, "onlineEnabled") ? "Online payment switched on." : "Online payment switched off.");
  }
  back(PAYMENTS, "error", "Nothing to save.");
}

/** Money staff received outside the website. Can confirm the booking and email the guest a receipt. */
export async function recordPaymentAction(form: FormData) {
  await requireAdmin();
  const code = text(form, "code", 20);
  const amount = money(form, "amount", 2_000_000_000);
  const method = text(form, "method", 10) as PaymentMethod;
  const paidOn = day(form, "paidOn");
  if (!amount) return back(reservationPath(code), "error", "Enter the amount received.");
  if (!["bank", "cash", "card", "other"].includes(method)) return back(reservationPath(code), "error", "Choose how the money came in.");
  if (!paidOn) return back(reservationPath(code), "error", "Choose the day the money came in.");
  const db = await getDb();
  const result = await recordPayment(db, { code, amount, method: method as Exclude<PaymentMethod, "xendit">, paidOn, note: text(form, "note", 500) });
  if (!result.ok) return back(reservationPath(code), "error", result.message);

  let confirmed = false;
  let problem = "";
  if (flag(form, "confirm") && result.reservation.status === "pending") {
    const change = await confirmReservation(db, code);
    if (change.ok) confirmed = change.changed;
    else problem = change.message;
  }
  let emailed = false;
  if (flag(form, "notify")) {
    const detail = await getReservation(db, code);
    if (detail) emailed = await sendPaymentReceived(detail, { amount, how: METHOD_LABEL[method].toLowerCase(), confirmed, problem: problem || undefined });
  }
  const parts = [`${formatMoney(amount)} recorded.`, confirmed ? "The booking is confirmed." : "", problem ? `Not confirmed: ${problem}` : "", emailed ? "The guest was emailed." : ""];
  back(reservationPath(code), problem ? "error" : "done", parts.filter(Boolean).join(" "));
}

export async function deletePaymentAction(form: FormData) {
  await requireAdmin();
  const code = text(form, "code", 20);
  const id = whole(form, "id", 1, 2_000_000_000);
  const removed = id ? await deletePayment(await getDb(), code, id) : false;
  back(reservationPath(code), removed ? "done" : "error", removed ? "Payment removed." : "That payment could not be removed (online payments stay on record).");
}

export async function createAddOnAction(form: FormData) {
  await requireAdmin();
  const price = money(form, "price");
  const name = text(form, "name", 100);
  if (price === null || !name) return back(ROOMS, "error", "A new extra needs a name and a price.");
  await createAddOn(await getDb(), { name, price });
  back(ROOMS, "done", "Extra added.");
}

/** Trial version only: fills the system with sample bookings, or takes them out again. */
export async function addSamplesAction() {
  await requireAdmin();
  if (!trialMode()) return back(GUIDE, "error", "Sample bookings are only for the trial version.");
  const result = await addSampleBookings(await getDb());
  if (result.already) return back(GUIDE, "error", `The ${result.already} sample bookings are already there. Remove them first to start again.`);
  const skipped = result.skipped ? ` ${result.skipped} could not be added because their rooms were taken.` : "";
  back(GUIDE, "done", `${result.added} sample bookings added.${skipped} Open Today, Bookings or Calendar to see them.`);
}

export async function removeSamplesAction() {
  await requireAdmin();
  if (!trialMode()) return back(GUIDE, "error", "Sample bookings are only for the trial version.");
  const removed = await removeSampleBookings(await getDb());
  back(GUIDE, "done", removed ? `${removed} sample bookings removed. Bookings you made yourself are still there.` : "There were no sample bookings to remove.");
}
