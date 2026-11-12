import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import type { Db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { seedDatabase } from "@/lib/db/seed";

/** A fresh in-memory Postgres (PGlite) with the real migrations and the starting data, for one test file. */
export async function testDb(): Promise<Db> {
  const db = drizzle(new PGlite(), { schema });
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  const typed = db as unknown as Db;
  await seedDatabase(typed);
  return typed;
}
