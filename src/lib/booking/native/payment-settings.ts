import { like } from "drizzle-orm";
import type { Db } from "@/lib/db";
import { settings as settingsTable } from "@/lib/db/schema";
import type { DepositPolicy } from "@/lib/booking/types";

/**
 * How guests pay, set by the owner in /admin/payments/. Stored in the `settings` table under keys "payment.<name>";
 * a key never saved has the default below. Secrets (the Xendit keys) are never here: they are environment variables.
 */
export type DepositMode = "first-night" | "percent" | "full";

export type PaymentSettings = {
  /** What a guest pays to confirm: the first night of each room, a percentage of the total, or everything. */
  depositMode: DepositMode;
  depositPercent: number;
  /** Bank transfer details shown to guests (booking page, emails). */
  bankEnabled: boolean;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  /** Extra words under the account, e.g. what to write as the transfer's note. */
  bankNote: string;
  /** Offer the Xendit payment page (works only when the Xendit keys are set on the server). */
  onlineEnabled: boolean;
};

export const PAYMENT_DEFAULTS: PaymentSettings = {
  depositMode: "first-night",
  depositPercent: 30,
  bankEnabled: false,
  bankName: "",
  bankAccountName: "",
  bankAccountNumber: "",
  bankNote: "",
  onlineEnabled: false,
};

const PREFIX = "payment.";

export async function loadPaymentSettings(db: Db): Promise<PaymentSettings> {
  const rows = await db.select().from(settingsTable).where(like(settingsTable.key, `${PREFIX}%`));
  const result: Record<string, unknown> = { ...PAYMENT_DEFAULTS };
  for (const row of rows) {
    const key = row.key.slice(PREFIX.length);
    const fallback = (PAYMENT_DEFAULTS as Record<string, unknown>)[key];
    if (fallback !== undefined && typeof row.value === typeof fallback) result[key] = row.value;
  }
  if (!["first-night", "percent", "full"].includes(result.depositMode as string)) result.depositMode = PAYMENT_DEFAULTS.depositMode;
  return result as PaymentSettings;
}

export async function savePaymentSettings(db: Db, patch: Partial<PaymentSettings>) {
  for (const [name, value] of Object.entries(patch)) {
    if (!(name in PAYMENT_DEFAULTS) || value === undefined) continue;
    const key = `${PREFIX}${name}`;
    await db.insert(settingsTable).values({ key, value }).onConflictDoUpdate({ target: settingsTable.key, set: { value } });
  }
}

/** What the booking page and the server use to work out the deposit (src/lib/booking/stay.ts, buildQuote). */
export function depositPolicy(settings: PaymentSettings): DepositPolicy {
  return settings.depositMode === "percent" ? { mode: "percent", percent: settings.depositPercent } : { mode: settings.depositMode };
}

/** Bank transfer can be offered only with an account to send money to. */
export function bankReady(settings: PaymentSettings): boolean {
  return settings.bankEnabled && Boolean(settings.bankName && settings.bankAccountName && settings.bankAccountNumber);
}
