/**
 * Creates the booking system's tables in the real Postgres and adds the starting data (room types, transfers).
 * Safe to run again: new migrations are applied, rows that exist are left alone.
 *
 *   npm run db:setup
 *
 * Reads DATABASE_URL_UNPOOLED (preferred: schema changes want a direct connection, which Neon's Vercel integration
 * also provides) or DATABASE_URL, from the environment or .env.local. The local development database needs none of this:
 * it sets itself up (src/lib/db/index.ts).
 */
import path from "node:path";
import type { Db } from "../src/lib/db";

async function main() {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // No .env.local: the variables come from the environment.
  }
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) {
    console.error("Set DATABASE_URL (or DATABASE_URL_UNPOOLED) in .env.local or the environment first.");
    process.exit(1);
  }

  const [{ drizzle }, { migrate }, { default: postgres }, schema, { seedDatabase }] = await Promise.all([
    import("drizzle-orm/postgres-js"),
    import("drizzle-orm/postgres-js/migrator"),
    import("postgres"),
    import("../src/lib/db/schema"),
    import("../src/lib/db/seed"),
  ]);
  const client = postgres(url, { max: 1, prepare: false });
  try {
    const db = drizzle(client, { schema });
    await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
    await seedDatabase(db as unknown as Db);
    console.log("Database ready: tables are up to date and the starting data is in.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
