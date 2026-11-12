/**
 * Creates a login for /admin/ in the real Postgres, or resets the password of an existing one.
 *
 *   npm run admin:create -- owner@example.com            makes a random password and prints it once
 *   npm run admin:create -- owner@example.com "my-pass"  uses that password (at least 10 characters)
 *
 * Reads DATABASE_URL from the environment or .env.local. Run `npm run db:setup` first.
 */
import { randomBytes } from "node:crypto";

async function main() {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // No .env.local: the variables come from the environment.
  }
  const [email, given] = process.argv.slice(2);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('Usage: npm run admin:create -- <email> ["password"]');
    process.exit(1);
  }
  if (given && given.length < 10) {
    console.error("Use a password of at least 10 characters.");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error("Set DATABASE_URL in .env.local or the environment first (this script is for the real database).");
    process.exit(1);
  }

  const [{ getDb }, { adminUsers }, { hashPassword }] = await Promise.all([
    import("../src/lib/db"),
    import("../src/lib/db/schema"),
    import("../src/lib/admin/password"),
  ]);
  const password = given || randomBytes(12).toString("base64url");
  const passwordHash = await hashPassword(password);
  const db = await getDb();
  await db
    .insert(adminUsers)
    .values({ email: email.toLowerCase(), passwordHash })
    .onConflictDoUpdate({ target: adminUsers.email, set: { passwordHash } });

  console.log(`Login ready for ${email.toLowerCase()}.`);
  if (!given) console.log(`Password (shown once, store it somewhere safe): ${password}`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
