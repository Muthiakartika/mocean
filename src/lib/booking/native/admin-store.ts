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
  patch: { units: number; maxGuests: number; priceLow: number; priceShoulder: number; priceHigh: number; active: boolean },
) {
  await db.update(roomTypes).set(patch).where(eq(roomTypes.id, id));
}

export const addSeasonRange = (db: Db, range: { season: "shoulder" | "high"; startsOn: string; endsOn: string; label: string }) =>
  db.insert(seasonRanges).values(range);
export const removeSeasonRange = (db: Db, id: number) => db.delete(seasonRanges).where(eq(seasonRanges.id, id));

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
