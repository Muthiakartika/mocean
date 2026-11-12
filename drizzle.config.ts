import { defineConfig } from "drizzle-kit";

/** `npm run db:generate` writes SQL migrations to ./drizzle from src/lib/db/schema.ts. */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
});
