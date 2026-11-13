import { asc, desc, eq } from "drizzle-orm";
import type { Db } from "@/lib/db";
import { addOns, blocks, roomTypes, seasonRanges } from "@/lib/db/schema";

/** What the admin pages edit besides reservations: room types and prices, season dates, blocks and extras. */

export const listRoomTypes = (db: Db) => db.select().from(roomTypes).orderBy(asc(roomTypes.sort), asc(roomTypes.name));
export const listSeasonRanges = (db: Db) => db.select().from(seasonRanges).orderBy(asc(seasonRanges.startsOn));
export const listAddOns = (db: Db) => db.select().from(addOns).orderBy(asc(addOns.sort), asc(addOns.name));

export async function listBlocks(db: Db) {
  return db
    .select({ block: blocks, roomName: roomTypes.name })
    .from(blocks)
    .innerJoin(roomTypes, eq(blocks.roomTypeId, roomTypes.id))
    .orderBy(desc(blocks.startsOn));
}

export async function updateRoomType(
  db: Db,
  id: string,
  patch: {
    name: string;
    description: string;
    features: string[];
    units: number;
    maxGuests: number;
    active: boolean;
  },
) {
  await db.update(roomTypes).set(patch).where(eq(roomTypes.id, id));
}

/** The three prices per night of one room type (the Prices page saves all room types at once). */
export async function updateRoomPrices(db: Db, id: string, prices: { priceLow: number; priceShoulder: number; priceHigh: number }) {
  await db
    .update(roomTypes)
    .set({ priceLow: prices.priceLow, priceShoulder: prices.priceShoulder, priceHigh: prices.priceHigh })
    .where(eq(roomTypes.id, id));
}

async function photosOf(db: Db, id: string): Promise<string[] | null> {
  const [row] = await db.select({ photos: roomTypes.photos }).from(roomTypes).where(eq(roomTypes.id, id)).limit(1);
  return row ? row.photos : null;
}

/** Adds a photo at the end of a room type's photos (the first one is the one guests see on the room's card). */
export async function addRoomPhoto(db: Db, id: string, url: string): Promise<boolean> {
  const photos = await photosOf(db, id);
  if (!photos) return false;
  await db.update(roomTypes).set({ photos: [...photos.filter((photo) => photo !== url), url] }).where(eq(roomTypes.id, id));
  return true;
}

export async function removeRoomPhoto(db: Db, id: string, url: string) {
  const photos = await photosOf(db, id);
  if (!photos) return;
  await db.update(roomTypes).set({ photos: photos.filter((photo) => photo !== url) }).where(eq(roomTypes.id, id));
}

/** Moves a photo to the front: the photo on the room's card on the booking page. */
export async function makeCoverPhoto(db: Db, id: string, url: string) {
  const photos = await photosOf(db, id);
  if (!photos || !photos.includes(url)) return;
  await db.update(roomTypes).set({ photos: [url, ...photos.filter((photo) => photo !== url)] }).where(eq(roomTypes.id, id));
}

export const addSeasonRange = (db: Db, range: { season: "shoulder" | "high"; startsOn: string; endsOn: string; label: string }) =>
  db.insert(seasonRanges).values(range);
export const removeSeasonRange = (db: Db, id: number) => db.delete(seasonRanges).where(eq(seasonRanges.id, id));

/** The same day one year later (29 February becomes 1 March). */
export function nextYearDay(day: string): string {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(Date.UTC(year + 1, month - 1, date)).toISOString().slice(0, 10);
}

/**
 * Copies the season ranges that start in `year` to the same dates one year later, so the owner only has to adjust
 * what moves (Christmas stays, Easter and Lunar New Year do not). Refused when the next year has season dates already.
 */
export async function copySeasonsToNextYear(db: Db, year: number): Promise<{ ok: true; copied: number } | { ok: false; message: string }> {
  const all = await listSeasonRanges(db);
  const startsIn = (range: { startsOn: string }, y: number) => range.startsOn.startsWith(`${y}-`);
  const source = all.filter((range) => startsIn(range, year));
  if (source.length === 0) return { ok: false, message: `${year} has no season dates to copy.` };
  if (all.some((range) => startsIn(range, year + 1))) {
    return { ok: false, message: `${year + 1} already has season dates. Remove them first, or add the missing dates one by one.` };
  }
  await db.insert(seasonRanges).values(
    source.map((range) => ({ season: range.season, startsOn: nextYearDay(range.startsOn), endsOn: nextYearDay(range.endsOn), label: range.label })),
  );
  return { ok: true, copied: source.length };
}

export const addBlock = (db: Db, block: { roomTypeId: string; startsOn: string; endsOn: string; units: number; reason: string }) =>
  db.insert(blocks).values(block);
export const removeBlock = (db: Db, id: number) => db.delete(blocks).where(eq(blocks.id, id));

export const updateAddOn = (db: Db, id: string, patch: { name: string; price: number; active: boolean }) =>
  db.update(addOns).set(patch).where(eq(addOns.id, id));

export async function createAddOn(db: Db, add: { name: string; price: number }) {
  const slug = add.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "extra";
  const existing = new Set((await db.select({ id: addOns.id }).from(addOns)).map((row) => row.id));
  let id = slug;
  for (let n = 2; existing.has(id); n++) id = `${slug}-${n}`;
  const sort = existing.size + 1;
  await db.insert(addOns).values({ id, name: add.name, price: add.price, sort });
}
