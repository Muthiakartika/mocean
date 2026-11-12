import { count } from "drizzle-orm";
import { hashPassword } from "@/lib/admin/password";
import { adminUsers } from "./schema";
import type { Db } from "./index";

/**
 * A login for the LOCAL development database only (the PGlite folder in node_modules/.cache, see src/lib/db/index.ts), so /admin/
 * can be opened without setting anything up. It is never created in a real Postgres: there the owner's login is made
 * with `npm run admin:create`.
 */
export const DEV_ADMIN = { email: "dev@mocean.local", password: "mocean-dev-only" } as const;

export async function seedDevAdmin(db: Db) {
  const [{ total }] = await db.select({ total: count() }).from(adminUsers);
  if (total > 0) return;
  await db.insert(adminUsers).values({ email: DEV_ADMIN.email, passwordHash: await hashPassword(DEV_ADMIN.password) });
}
