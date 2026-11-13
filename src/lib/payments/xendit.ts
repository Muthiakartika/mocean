import { timingSafeEqual } from "node:crypto";

/**
 * Xendit Invoice API: a hosted payment page for one amount (the guest picks how to pay there), and a callback when it
 * is paid or expires. Plain fetch, no SDK.
 *
 *   XENDIT_SECRET_KEY      secret API key (Xendit Dashboard > Settings > API Keys). A test key makes test payments only.
 *   XENDIT_CALLBACK_TOKEN  webhook verification token (Dashboard > Settings > Webhooks). Xendit sends it with every
 *                          callback in the x-callback-token header; a callback without it is refused.
 *
 * Sources (checked 2026-11-13): authentication and the callback header from docs.xendit.co (API reference "Quick setup",
 * "Integration security"). The JSON field names below come from the official xendit-node SDK 7.0.0 (its generated models
 * CreateInvoiceRequest, Invoice, InvoiceCallback, InvoiceStatus), because Xendit's own invoice reference pages did not
 * load. Not confirmed anywhere: the unit of invoice_duration (seconds in the SDK's example). Try a test payment before
 * going live (docs/booking-native.md).
 */

const API = "https://api.xendit.co";

export type InvoiceStatus = "PENDING" | "PAID" | "SETTLED" | "EXPIRED";

export type Invoice = {
  id: string;
  externalId: string;
  status: InvoiceStatus | string;
  amount: number;
  currency: string;
  invoiceUrl: string;
  expiryDate: string | null;
};

export type CreateInvoice = {
  externalId: string;
  amount: number;
  currency: string;
  description: string;
  /** How long the page stays payable, in seconds (see above). */
  durationSeconds: number;
  payerEmail?: string;
  givenNames?: string;
  surname?: string;
  /** Where Xendit sends the guest back to. These pages only show a message: the callback is what records a payment. */
  successRedirectUrl: string;
  failureRedirectUrl: string;
};

type Fetch = typeof fetch;

export function xenditConfigured(): boolean {
  return Boolean(process.env.XENDIT_SECRET_KEY && process.env.XENDIT_CALLBACK_TOKEN);
}

function authorization(): string {
  const key = process.env.XENDIT_SECRET_KEY;
  if (!key) throw new Error("XENDIT_SECRET_KEY is not set.");
  // Basic auth: the secret key is the user name, the password is empty (note the colon).
  return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
}

function toInvoice(json: Record<string, unknown>): Invoice {
  return {
    id: String(json.id ?? ""),
    externalId: String(json.external_id ?? ""),
    status: String(json.status ?? ""),
    amount: Number(json.amount ?? 0),
    currency: String(json.currency ?? ""),
    invoiceUrl: String(json.invoice_url ?? ""),
    expiryDate: typeof json.expiry_date === "string" ? json.expiry_date : null,
  };
}

async function call(path: string, init: RequestInit, fetchImpl: Fetch): Promise<Record<string, unknown>> {
  const response = await fetchImpl(`${API}${path}`, {
    ...init,
    headers: { Authorization: authorization(), "Content-Type": "application/json", ...init.headers },
    signal: AbortSignal.timeout(15_000),
  });
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(`Xendit answered ${response.status}: ${String(body.error_code ?? "")} ${String(body.message ?? "")}`.trim());
  }
  return body;
}

export async function createInvoice(input: CreateInvoice, fetchImpl: Fetch = fetch): Promise<Invoice> {
  const customer = input.givenNames || input.payerEmail ? { given_names: input.givenNames, surname: input.surname, email: input.payerEmail } : undefined;
  const invoice = toInvoice(
    await call(
      "/v2/invoices",
      {
        method: "POST",
        body: JSON.stringify({
          external_id: input.externalId,
          amount: input.amount,
          currency: input.currency,
          description: input.description,
          invoice_duration: input.durationSeconds,
          payer_email: input.payerEmail,
          customer,
          success_redirect_url: input.successRedirectUrl,
          failure_redirect_url: input.failureRedirectUrl,
        }),
      },
      fetchImpl,
    ),
  );
  if (!invoice.id || !invoice.invoiceUrl) throw new Error("Xendit did not return a payment page.");
  return invoice;
}

/** Reads an invoice back from Xendit: the callback's word is checked against Xendit itself before money is recorded. */
export async function getInvoice(id: string, fetchImpl: Fetch = fetch): Promise<Invoice> {
  return toInvoice(await call(`/v2/invoices/${encodeURIComponent(id)}`, { method: "GET" }, fetchImpl));
}

/** True only when a token is configured and the callback carries exactly that token (compared in constant time). */
export function callbackTokenMatches(given: string | null): boolean {
  const expected = process.env.XENDIT_CALLBACK_TOKEN;
  if (!expected || !given) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** The fields of an invoice callback this system uses (snake_case as sent). */
export type InvoiceCallback = {
  id: string;
  externalId: string;
  status: string;
  amount: number;
  paidAmount: number | null;
  paidAt: string | null;
  paymentMethod: string;
  paymentChannel: string;
  currency: string;
};

export function parseCallback(raw: unknown): InvoiceCallback | null {
  if (!raw || typeof raw !== "object") return null;
  const json = raw as Record<string, unknown>;
  if (typeof json.id !== "string" || typeof json.external_id !== "string" || typeof json.status !== "string") return null;
  return {
    id: json.id,
    externalId: json.external_id,
    status: json.status,
    amount: Number(json.amount ?? 0),
    paidAmount: json.paid_amount === undefined || json.paid_amount === null ? null : Number(json.paid_amount),
    paidAt: typeof json.paid_at === "string" ? json.paid_at : null,
    paymentMethod: typeof json.payment_method === "string" ? json.payment_method : "",
    paymentChannel: typeof json.payment_channel === "string" ? json.payment_channel : "",
    currency: typeof json.currency === "string" ? json.currency : "",
  };
}
