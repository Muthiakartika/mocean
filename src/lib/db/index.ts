import path from "node:path";
import { mkdir } from "node:fs/promises";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { property } from "@/config/property";
import * as schema from "./schema";

/**
 * The booking system's database.
 *
 *   DATABASE_URL set  -> that Postgres (Neon on Vercel). Create the tables once with `npm run db:setup`.
 *   not set           -> development only: a Postgres in a folder (node_modules/.cache/<slug>-pglite, the slug from
 *                        src/config/property.ts; no install, no account), created and filled with the starting data on
 *                        first use. To start over, delete that folder. Production without DATABASE_URL fails.
 *
 * Everything else takes a `Db`, so tests pass an in-memory one.
 */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

/** The Postgres drivers load lazily, and the connection is shared across hot reloads in development. */
const shared = globalThis as unknown as { __bookingDb?: Promise<Db> };

export function getDb(): Promise<Db> {
  shared.__bookingDb ??= open().catch((error) => {
    delete shared.__bookingDb;
    throw error;
  });
  return shared.__bookingDb;
}

/** True when a database is available (DATABASE_URL, or any environment that is not production). */
export function databaseConfigured() {
  return Boolean(process.env.DATABASE_URL) || process.env.NODE_ENV !== "production";
}

async function open(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const [{ drizzle }, { default: postgres }] = await Promise.all([import("drizzle-orm/postgres-js"), import("postgres")]);
    // prepare: false because Neon's pooled address (pgbouncer) does not keep prepared statements between queries.
    return drizzle(postgres(url, { prepare: false, max: 5 }), { schema });
  }
  if (process.env.NODE_ENV === "production") throw new Error("DATABASE_URL is not set.");
  return openLocal();
}

async function openLocal(): Promise<Db> {
  const [{ PGlite }, { drizzle }, { migrate }, { seedDatabase }, { seedDevAdmin }] = await Promise.all([
    import("@electric-sql/pglite"),
    import("drizzle-orm/pglite"),
    import("drizzle-orm/pglite/migrator"),
    import("./seed"),
    import("./dev-admin"),
  ]);
  // Not inside the project folders: PGlite writes files on every query, and Turbopack's file watcher would take each
  // write for a source change and reload the page in a loop. node_modules is not watched.
  const dir = path.join(process.cwd(), "node_modules", ".cache", `${property.slug}-pglite`);
  await mkdir(dir, { recursive: true });
  const db = drizzle(new PGlite(dir), { schema });
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  await seedDatabase(db as unknown as Db);
  await seedDevAdmin(db as unknown as Db);
  return db as unknown as Db;
}
