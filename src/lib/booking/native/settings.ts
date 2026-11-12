import { settings as settingsTable } from "@/lib/db/schema";
import type { Db } from "@/lib/db";

/**
 * Values the owner can change in /admin/rates/. Stored one row per key (table `settings`); a key that was never saved has
 * the default below.
 */
export type NativeSettings = {
  /** Tax and service already inside the prices (0.221: a price is 122.1% of its net amount). */
  includedTaxRate: number;
  /** Stays of this many nights or more get the extended-stay rate. */
  extendedStayMinNights: number;
  /** Percentage off every night of the extended-stay rate; 0 switches the rate off. */
  extendedStayDiscountPct: number;
  /** A pending request holds its rooms this long; after that the rooms are for sale again. */
  pendingHoldHours: number;
  /** Confirm every booking from the website at once, without waiting for the resort. */
  autoConfirm: boolean;
};

/**
 * Tax rate and discount are what the Cloudbeds booking page showed on 2026-11-11 (22.1% inclusive; "Extended Stay -
 * Three Nights or More" 5% under the standard rate). The owner should confirm them.
 */
export const SETTING_DEFAULTS: NativeSettings = {
  includedTaxRate: 0.221,
  extendedStayMinNights: 3,
  extendedStayDiscountPct: 5,
  pendingHoldHours: 24,
  autoConfirm: false,
};

export async function loadSettings(db: Db): Promise<NativeSettings> {
  const rows = await db.select().from(settingsTable);
  const result: Record<string, unknown> = { ...SETTING_DEFAULTS };
  for (const row of rows) {
    const fallback = (SETTING_DEFAULTS as Record<string, unknown>)[row.key];
    // Ignore a stored value of the wrong type instead of breaking every search.
    if (fallback !== undefined && typeof row.value === typeof fallback) result[row.key] = row.value;
  }
  return result as NativeSettings;
}

export async function saveSettings(db: Db, patch: Partial<NativeSettings>) {
  for (const [key, value] of Object.entries(patch)) {
    if (!(key in SETTING_DEFAULTS) || value === undefined) continue;
    await db.insert(settingsTable).values({ key, value }).onConflictDoUpdate({ target: settingsTable.key, set: { value } });
  }
}
