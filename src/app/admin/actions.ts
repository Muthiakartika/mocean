"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { endSession, loginBlocked, recordLoginFailure, requireAdmin, startSession } from "@/lib/admin/session";
import { verifyPassword } from "@/lib/admin/password";
import { getDb } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import {
  addBlock,
  addSeasonRange,
  createAddOn,
  listAddOns,
  listRoomTypes,
  removeBlock,
  removeSeasonRange,
  updateAddOn,
  updateRoomType,
} from "@/lib/booking/native/admin-store";
import { sendBookingCancelled, sendBookingConfirmed } from "@/lib/booking/native/emails";
import { saveSettings } from "@/lib/booking/native/settings";
import { cancelReservation, confirmReservation, createReservation, getReservation, saveAdminNotes } from "@/lib/booking/native/store";
import { QuoteError, addDays, nightsBetween, parseDay } from "@/lib/booking/stay";

/**
 * Everything the admin pages do. Each action checks the login itself (requireAdmin): a server action can be called
 * without ever opening the page that holds its form.
 *
 * Results go back to the page in the address: ?done=message or ?error=message (text, shown escaped).
 */

const RATES = "/admin/rates/";
const BLOCKS = "/admin/blocks/";
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
  const sent = detail ? await sendBookingConfirmed(detail) : false;
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
    note = detail && (await sendBookingConfirmed(detail)) ? "Booking saved and the guest was emailed." : "Booking saved. No email went out.";
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

export async function saveRoomTypeAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "id", 40);
  const units = whole(form, "units", 0, 100);
  const maxGuests = whole(form, "maxGuests", 1, 20);
  const priceLow = whole(form, "priceLow", 0, 100_000_000);
  const priceShoulder = whole(form, "priceShoulder", 0, 100_000_000);
  const priceHigh = whole(form, "priceHigh", 0, 100_000_000);
  if (units === null || !maxGuests || priceLow === null || priceShoulder === null || priceHigh === null) {
    return back(RATES, "error", "Check the numbers for that room type: whole numbers only.");
  }
  await updateRoomType(await getDb(), id, { units, maxGuests, priceLow, priceShoulder, priceHigh, active: flag(form, "active") });
  back(RATES, "done", "Room type saved.");
}

export async function addSeasonAction(form: FormData) {
  await requireAdmin();
  const first = day(form, "from");
  const last = day(form, "until");
  const season = text(form, "season", 10);
  if (season !== "shoulder" && season !== "high") return back(RATES, "error", "Choose shoulder or high season.");
  if (!first || !last || last < first) return back(RATES, "error", "Choose the first and last day of the season (the last day can't be before the first).");
  await addSeasonRange(await getDb(), { season, startsOn: first, endsOn: addDays(last, 1), label: text(form, "label", 60) });
  back(RATES, "done", "Season dates added.");
}

export async function removeSeasonAction(form: FormData) {
  await requireAdmin();
  const id = whole(form, "id", 1, 2_000_000_000);
  if (id) await removeSeasonRange(await getDb(), id);
  back(RATES, "done", "Season dates removed.");
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
  const price = whole(form, "price", 0, 100_000_000);
  const name = text(form, "name", 100);
  if (price === null || !name) return back(RATES, "error", "An extra needs a name and a price.");
  await updateAddOn(await getDb(), text(form, "id", 60), { name, price, active: flag(form, "active") });
  back(RATES, "done", "Extra saved.");
}

export async function createAddOnAction(form: FormData) {
  await requireAdmin();
  const price = whole(form, "price", 0, 100_000_000);
  const name = text(form, "name", 100);
  if (price === null || !name) return back(RATES, "error", "A new extra needs a name and a price.");
  await createAddOn(await getDb(), { name, price });
  back(RATES, "done", "Extra added.");
}
