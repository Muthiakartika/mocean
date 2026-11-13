import { randomInt } from "node:crypto";
import { and, desc, eq, ne } from "drizzle-orm";
import { property } from "@/config/property";
import type { Db } from "@/lib/db";
import { payments, reservations, type PaymentMethod, type PaymentRow, type ReservationRow } from "@/lib/db/schema";
import { createInvoice, getInvoice, xenditConfigured, type InvoiceCallback } from "@/lib/payments/xendit";
import { bankReady, type PaymentSettings } from "./payment-settings";
import { confirmReservation, displayStatus } from "./store";

/**
 * Money for reservations: what was paid, what is still due, payments staff record (bank transfer, cash), and online
 * payment through a Xendit payment page. A paid Xendit payment on a request that is still waiting confirms it.
 */

export type PaymentSummary = {
  /** Sum of the paid payments. */
  paid: number;
  /** Part of the deposit still to pay (0 once it is covered). */
  depositDue: number;
  /** Part of the total still to pay. */
  balance: number;
  /** An online payment page that is open and not paid yet, if any. */
  openOnline: PaymentRow | null;
};

export function summarize(reservation: Pick<ReservationRow, "total" | "deposit">, rows: PaymentRow[], now = new Date()): PaymentSummary {
  const paid = rows.filter((row) => row.status === "paid").reduce((sum, row) => sum + row.amount, 0);
  return {
    paid,
    depositDue: Math.max(0, reservation.deposit - paid),
    balance: Math.max(0, reservation.total - paid),
    openOnline: rows.find((row) => row.method === "xendit" && row.status === "pending" && (!row.expiresAt || row.expiresAt > now)) ?? null,
  };
}

/** What the guest can be asked to pay with right now. */
export function payOptions(settings: PaymentSettings): { online: boolean; bank: boolean } {
  return { online: settings.onlineEnabled && xenditConfigured(), bank: bankReady(settings) };
}

/** What a guest can still pay for this booking: nothing for a cancelled one or an expired request. */
export function amountToPay(reservation: ReservationRow, summary: PaymentSummary, now = new Date()): number {
  const status = displayStatus(reservation, now);
  if (status === "cancelled" || status === "expired") return 0;
  return summary.depositDue > 0 ? summary.depositDue : summary.balance;
}

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  bank: "Bank transfer",
  cash: "Cash",
  card: "Card at the resort",
  xendit: "Online (Xendit)",
  other: "Other",
};

async function reservationByCode(db: Db, code: string) {
  const [row] = await db.select().from(reservations).where(eq(reservations.code, code.trim().toUpperCase())).limit(1);
  return row ?? null;
}

export async function listPayments(db: Db, reservationId: string) {
  return db.select().from(payments).where(eq(payments.reservationId, reservationId)).orderBy(payments.createdAt, payments.id);
}

/** A payment staff received outside the website (bank transfer, cash, card at the desk). */
export async function recordPayment(
  db: Db,
  input: { code: string; amount: number; method: Exclude<PaymentMethod, "xendit">; paidOn: string; note: string },
): Promise<{ ok: true; reservation: ReservationRow } | { ok: false; message: string }> {
  const reservation = await reservationByCode(db, input.code);
  if (!reservation) return { ok: false, message: "No booking with that number." };
  if (!Number.isSafeInteger(input.amount) || input.amount <= 0) return { ok: false, message: "Enter the amount received." };
  await db.insert(payments).values({
    reservationId: reservation.id,
    amount: input.amount,
    method: input.method,
    status: "paid",
    // Midday UTC keeps the day the same in every time zone the resort could be in.
    paidAt: new Date(`${input.paidOn}T12:00:00Z`),
    note: input.note.trim().slice(0, 500),
  });
  return { ok: true, reservation };
}

/** Removes a payment staff entered by mistake. Online payments are the provider's record and stay. */
export async function deletePayment(db: Db, code: string, id: number): Promise<boolean> {
  const reservation = await reservationByCode(db, code);
  if (!reservation) return false;
  const removed = await db
    .delete(payments)
    .where(and(eq(payments.id, id), eq(payments.reservationId, reservation.id), ne(payments.method, "xendit")))
    .returning({ id: payments.id });
  return removed.length > 0;
}

export async function recentPayments(db: Db, limit = 25) {
  return db
    .select({ payment: payments, code: reservations.code, firstName: reservations.firstName, lastName: reservations.lastName })
    .from(payments)
    .innerJoin(reservations, eq(payments.reservationId, reservations.id))
    .orderBy(desc(payments.createdAt), desc(payments.id))
    .limit(limit);
}

const REFERENCE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** How long a payment page stays open, in seconds (Xendit's invoice_duration). */
const PAGE_SECONDS = 24 * 3600;

/**
 * Opens a Xendit payment page for what the guest still owes (the deposit, or the rest after it), or reuses one that is
 * still open for the same amount. Answers the page to send the guest to.
 */
export async function startOnlinePayment(
  db: Db,
  code: string,
  urls: { success: string; failure: string },
  now = new Date(),
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  if (!xenditConfigured()) return { ok: false, message: "Online payment isn't available right now. Please pay by bank transfer or message us." };
  const reservation = await reservationByCode(db, code);
  if (!reservation) return { ok: false, message: "We couldn't find this booking." };
  const rows = await listPayments(db, reservation.id);
  const summary = summarize(reservation, rows, now);
  const amount = amountToPay(reservation, summary, now);
  if (amount <= 0) {
    const status = displayStatus(reservation, now);
    return { ok: false, message: status === "expired" ? "This request expired. Message us to book these dates again." : "There is nothing left to pay for this booking." };
  }

  // A page opened a moment ago for the same amount is reused (a double click, or the guest came back).
  const open = summary.openOnline;
  if (open && open.amount === amount && open.checkoutUrl && (!open.expiresAt || open.expiresAt.getTime() > now.getTime() + 10 * 60_000)) {
    return { ok: true, url: open.checkoutUrl };
  }

  const reference = `${reservation.code}-${Array.from({ length: 6 }, () => REFERENCE_ALPHABET[randomInt(REFERENCE_ALPHABET.length)]).join("")}`;
  const [row] = await db
    .insert(payments)
    .values({ reservationId: reservation.id, amount, method: "xendit", status: "pending", reference })
    .returning();
  try {
    const invoice = await createInvoice(
      {
        externalId: reference,
        amount,
        currency: property.currency,
        description: `${summary.depositDue > 0 ? "Deposit" : "Payment"} for booking ${reservation.code} at ${property.name}`,
        durationSeconds: PAGE_SECONDS,
        payerEmail: reservation.email || undefined,
        givenNames: reservation.firstName,
        surname: reservation.lastName,
        successRedirectUrl: urls.success,
        failureRedirectUrl: urls.failure,
      },
      fetchImpl,
    );
    await db
      .update(payments)
      .set({
        providerId: invoice.id,
        checkoutUrl: invoice.invoiceUrl,
        expiresAt: invoice.expiryDate ? new Date(invoice.expiryDate) : new Date(now.getTime() + PAGE_SECONDS * 1000),
      })
      .where(eq(payments.id, row.id));
    return { ok: true, url: invoice.invoiceUrl };
  } catch (error) {
    console.error("[payments] Xendit invoice failed:", error);
    await db.update(payments).set({ status: "failed", note: "The payment page could not be opened." }).where(eq(payments.id, row.id));
    return { ok: false, message: "The payment page could not be opened just now. Please try again in a moment, or pay by bank transfer." };
  }
}

export type CallbackResult =
  | { kind: "ignored"; reason: string }
  | { kind: "expired"; code: string }
  | { kind: "already-paid"; code: string }
  | { kind: "paid"; code: string; amount: number; confirmed: boolean; problem?: string };

/**
 * A Xendit invoice callback, after its token was checked. A "paid" callback is believed only once Xendit itself, asked
 * for the same invoice, says it is paid; then the payment is recorded once (a repeated callback changes nothing) and a
 * waiting request is confirmed.
 */
export async function applyXenditCallback(db: Db, callback: InvoiceCallback, now = new Date(), fetchImpl: typeof fetch = fetch): Promise<CallbackResult> {
  const [payment] = await db.select().from(payments).where(eq(payments.reference, callback.externalId)).limit(1);
  if (!payment || payment.method !== "xendit") return { kind: "ignored", reason: "unknown external_id" };
  if (payment.providerId && payment.providerId !== callback.id) return { kind: "ignored", reason: "invoice id does not match" };
  const [reservation] = await db.select().from(reservations).where(eq(reservations.id, payment.reservationId)).limit(1);
  if (!reservation) return { kind: "ignored", reason: "reservation gone" };

  if (callback.status === "EXPIRED") {
    await db.update(payments).set({ status: "expired" }).where(and(eq(payments.id, payment.id), eq(payments.status, "pending")));
    return { kind: "expired", code: reservation.code };
  }
  if (callback.status !== "PAID" && callback.status !== "SETTLED") return { kind: "ignored", reason: `status ${callback.status}` };
  if (payment.status === "paid") return { kind: "already-paid", code: reservation.code };

  const invoice = await getInvoice(callback.id, fetchImpl);
  if (!["PAID", "SETTLED"].includes(invoice.status) || invoice.externalId !== payment.reference) {
    return { kind: "ignored", reason: `Xendit reports ${invoice.status} for this invoice` };
  }
  if (invoice.currency && invoice.currency !== property.currency) return { kind: "ignored", reason: `currency ${invoice.currency}` };

  const amount = Math.round(callback.paidAmount ?? invoice.amount);
  // Only one of two callbacks arriving together records the payment.
  const updated = await db
    .update(payments)
    .set({
      status: "paid",
      amount,
      providerId: callback.id,
      channel: [callback.paymentMethod, callback.paymentChannel].filter(Boolean).join(" · ").slice(0, 80),
      paidAt: callback.paidAt ? new Date(callback.paidAt) : now,
    })
    .where(and(eq(payments.id, payment.id), ne(payments.status, "paid")))
    .returning({ id: payments.id });
  if (updated.length === 0) return { kind: "already-paid", code: reservation.code };

  let confirmed = false;
  let problem: string | undefined;
  if (reservation.status === "pending") {
    if (amount < payment.amount) {
      problem = `The guest paid ${amount} of the ${payment.amount} asked, so the booking was not confirmed automatically.`;
    } else {
      const result = await confirmReservation(db, reservation.code, now);
      if (result.ok) confirmed = result.changed;
      else problem = result.message;
    }
  } else if (reservation.status === "cancelled") {
    problem = "This booking was already cancelled when the payment came in: refund it or rebook the guest.";
  }
  return { kind: "paid", code: reservation.code, amount, confirmed, problem };
}
