"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { checkGuestToken, managePath } from "@/lib/booking/native/guest-link";
import { sendCancelRequested, sendGuestCancelled, sendGuestMessage } from "@/lib/booking/native/emails";
import { cancelByGuest, getReservation, requestCancellation } from "@/lib/booking/native/store";

/**
 * What a guest can do on "Manage my booking" (/book/manage/). Every action checks the booking number and its signed
 * token again: a form can be posted by anyone, so the page having shown the booking proves nothing.
 */

const text = (form: FormData, name: string, max = 200) => String(form.get(name) ?? "").trim().slice(0, max);

/** Few tries per IP and window, kept in memory (per server instance), against guessing booking numbers. */
const tries = new Map<string, number[]>();
async function tooMany(key: string, max: number, windowMs: number) {
  const list = await headers();
  const ip = list.get("x-forwarded-for")?.split(",")[0]?.trim() || list.get("x-real-ip") || "local";
  const id = `${key}:${ip}`;
  const now = Date.now();
  const recent = (tries.get(id) ?? []).filter((time) => now - time < windowMs);
  recent.push(now);
  tries.set(id, recent);
  if (tries.size > 5000) tries.clear();
  return recent.length > max;
}

function back(code: string, token: string, kind: "done" | "error", message: string): never {
  redirect(`/book/manage/?${new URLSearchParams({ code, t: token, [kind]: message })}`);
}

/** The booking behind a posted form, when its token matches; otherwise back to the search form. */
async function verified(form: FormData) {
  const code = text(form, "code", 20).toUpperCase();
  const token = text(form, "t", 64);
  const detail = code ? await getReservation(await getDb(), code) : null;
  if (!detail || !detail.reservation.email || !checkGuestToken(code, detail.reservation.email, token)) {
    redirect(`/book/manage/?${new URLSearchParams({ error: "That link is not valid any more. Find your booking with its number and email." })}`);
  }
  return { code, token, detail };
}

export async function findBookingAction(form: FormData) {
  if (await tooMany("find", 10, 15 * 60_000)) {
    redirect(`/book/manage/?${new URLSearchParams({ error: "Too many tries. Wait a few minutes, or message us on WhatsApp." })}`);
  }
  const code = text(form, "code", 20).toUpperCase();
  const email = text(form, "email", 100).toLowerCase();
  const detail = code && email ? await getReservation(await getDb(), code) : null;
  if (!detail || detail.reservation.email.trim().toLowerCase() !== email) {
    redirect(`/book/manage/?${new URLSearchParams({ error: "We couldn't find a booking with that number and email. Check both, they are in your booking email." })}`);
  }
  redirect(managePath(detail.reservation.code, detail.reservation.email));
}

export async function guestCancelAction(form: FormData) {
  const { code, token } = await verified(form);
  if (form.get("sure") !== "on") back(code, token, "error", "Tick the box to confirm that you want to cancel.");
  const db = await getDb();
  const result = await cancelByGuest(db, code);
  if (!result.ok) back(code, token, "error", result.message);
  if (result.changed) {
    const detail = await getReservation(db, code);
    if (detail) await sendGuestCancelled(detail);
  }
  back(code, token, "done", "Your booking request is cancelled. Nothing was charged.");
}

export async function requestCancelAction(form: FormData) {
  const { code, token } = await verified(form);
  if (form.get("sure") !== "on") back(code, token, "error", "Tick the box to confirm that you want to cancel.");
  const db = await getDb();
  const result = await requestCancellation(db, code, text(form, "note", 1000));
  if (!result.ok) back(code, token, "error", result.message);
  if (result.changed) {
    const detail = await getReservation(db, code);
    if (detail) await sendCancelRequested(detail);
  }
  back(code, token, "done", "We received your cancellation request and will reply by email about your deposit.");
}

export async function messageAction(form: FormData) {
  const { code, token, detail } = await verified(form);
  if (await tooMany("message", 5, 60 * 60_000)) back(code, token, "error", "You sent several messages already. Please message us on WhatsApp.");
  const message = text(form, "message", 2000);
  if (message.length < 2) back(code, token, "error", "Write your message first.");
  const sent = await sendGuestMessage(detail, message);
  back(code, token, sent ? "done" : "error", sent ? "Message sent. We'll answer by email." : "Your message didn't go through. Please message us on WhatsApp.");
}
