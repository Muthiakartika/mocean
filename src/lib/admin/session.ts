import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { property } from "@/config/property";
import { getDb } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";

/**
 * Login of the resort's staff for /admin/.
 *
 * A signed cookie (HMAC-SHA256 with ADMIN_SESSION_SECRET) holds the admin's id and an expiry; every request also checks
 * that the admin still exists. Pages AND server actions both call requireAdmin(): a layout alone does not protect an
 * action, because actions can be called directly.
 */

const COOKIE = `${property.slug}_admin`;
const LIFETIME_MS = 12 * 3_600_000;

function secret(): string {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (value && value.length >= 32) return value;
  if (process.env.NODE_ENV === "production") throw new Error("ADMIN_SESSION_SECRET (at least 32 characters) is not set.");
  return "development-only-secret-never-use-in-production";
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

export function makeToken(id: number, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ id, exp: now + LIFETIME_MS })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** The admin id inside a token, or null when it is forged, malformed or expired. */
export function readToken(token: string | undefined, now = Date.now()): number | null {
  const [payload, signature] = (token ?? "").split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const { id, exp } = JSON.parse(Buffer.from(payload, "base64url").toString()) as { id?: unknown; exp?: unknown };
    return typeof id === "number" && typeof exp === "number" && exp > now ? id : null;
  } catch {
    return null;
  }
}

export type Admin = { id: number; email: string };

export async function getAdmin(): Promise<Admin | null> {
  const id = readToken((await cookies()).get(COOKIE)?.value);
  if (id === null) return null;
  const [user] = await (await getDb()).select({ id: adminUsers.id, email: adminUsers.email }).from(adminUsers).where(eq(adminUsers.id, id)).limit(1);
  return user ?? null;
}

export async function requireAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login/");
  return admin;
}

export async function startSession(id: number) {
  (await cookies()).set(COOKIE, makeToken(id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: LIFETIME_MS / 1000,
  });
}

export async function endSession() {
  (await cookies()).delete({ name: COOKIE, path: "/admin" });
}

/**
 * Failed logins per client IP, kept in memory: it slows a script guessing passwords against one server instance (on
 * Vercel each warm instance counts for itself). The passwords are scrypt-hashed, so every guess is also slow.
 */
const failures = new Map<string, number[]>();
const WINDOW_MS = 10 * 60_000;
const MAX_FAILURES = 8;

async function clientId() {
  const list = await headers();
  return list.get("x-forwarded-for")?.split(",")[0]?.trim() || list.get("x-real-ip") || "local";
}

export async function loginBlocked(): Promise<boolean> {
  const now = Date.now();
  const recent = (failures.get(await clientId()) ?? []).filter((time) => now - time < WINDOW_MS);
  return recent.length >= MAX_FAILURES;
}

export async function recordLoginFailure() {
  const id = await clientId();
  const now = Date.now();
  failures.set(id, [...(failures.get(id) ?? []).filter((time) => now - time < WINDOW_MS), now]);
  if (failures.size > 2000) failures.clear();
}
