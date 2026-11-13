import { databaseConfigured, getDb } from "@/lib/db";
import { sendPaymentReceived } from "@/lib/booking/native/emails";
import { applyXenditCallback } from "@/lib/booking/native/payments";
import { getReservation } from "@/lib/booking/native/store";
import { callbackTokenMatches, parseCallback, xenditConfigured } from "@/lib/payments/xendit";

/**
 * POST /api/payments/xendit/: Xendit's invoice callback (paid or expired). Set this address in the Xendit Dashboard
 * (Settings > Webhooks, invoices). Every callback must carry the account's verification token in x-callback-token
 * (XENDIT_CALLBACK_TOKEN); a paid callback is then checked against Xendit's API before anything is recorded
 * (applyXenditCallback). Xendit retries anything that is not a 2xx, so an error here means "try again later".
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!xenditConfigured() || !databaseConfigured()) return Response.json({ ok: false }, { status: 503 });
  if (!callbackTokenMatches(request.headers.get("x-callback-token"))) return Response.json({ ok: false }, { status: 401 });

  const callback = parseCallback(await request.json().catch(() => null));
  if (!callback) return Response.json({ ok: false, message: "Not an invoice callback." }, { status: 400 });

  const db = await getDb();
  try {
    const result = await applyXenditCallback(db, callback);
    if (result.kind === "paid") {
      const detail = await getReservation(db, result.code);
      if (detail) {
        await sendPaymentReceived(detail, {
          amount: result.amount,
          how: `online${callback.paymentChannel || callback.paymentMethod ? `, ${callback.paymentChannel || callback.paymentMethod}` : ""}`,
          confirmed: result.confirmed,
          problem: result.problem,
        });
      }
    } else if (result.kind === "ignored") {
      console.info(`[payments] Xendit callback ignored (${result.reason}): ${callback.externalId}`);
    }
    return Response.json({ ok: true });
  } catch (error) {
    // Xendit sends it again later (it retries up to six times).
    console.error("[payments] Xendit callback failed:", error);
    return Response.json({ ok: false }, { status: 500 });
  }
}
