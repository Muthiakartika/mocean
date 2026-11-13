import { startingAddOns, startingRoomTypes } from "@/config/property-rooms";
import { addOns, roomTypes } from "./schema";
import type { Db } from "./index";

/**
 * Puts the property's starting rooms and extras (src/config/property-rooms.ts) into the database.
 * Safe to run again: rows that exist are left alone.
 */
export async function seedDatabase(db: Db) {
  await db.insert(roomTypes).values(startingRoomTypes).onConflictDoNothing();
  await db.insert(addOns).values(startingAddOns).onConflictDoNothing();
}
