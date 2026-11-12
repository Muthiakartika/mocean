import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * The guest's own link to "Manage my booking" (/book/manage/): the booking number plus a signature of the number and
 * the guest's email. Only someone who has the email (the confirmation mail) or types both the number and the email can
 * open a booking, and the link keeps working without a login.
 *
 *   BOOKING_LINK_SECRET   random, at least 32 characters (falls back to ADMIN_SESSION_SECRET; required in production)
 *   BOOKING_SITE_URL      optional address used in emails, e.g. https://moceanbeachresort.com
 */

function secret(): string {
  for (const value of [process.env.BOOKING_LINK_SECRET, process.env.ADMIN_SESSION_SECRET]) {
    if (value && value.length >= 32) return value;
  }
  if (process.env.NODE_ENV === "production") throw new Error("BOOKING_LINK_SECRET (at least 32 characters) is not set.");
  return "development-only-booking-link-secret";
}

const normalise = (code: string, email: string) => `${code.trim().toUpperCase()}|${email.trim().toLowerCase()}`;

export function guestToken(code: string, email: string): string {
  return createHmac("sha256", secret()).update(normalise(code, email)).digest("base64url").slice(0, 32);
}

export function checkGuestToken(code: string, email: string, token: string): boolean {
  const expected = Buffer.from(guestToken(code, email));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** Where the site runs, for links in emails: BOOKING_SITE_URL, else the Vercel deployment, else the local dev server. */
export function siteOrigin(): string {
  const configured = process.env.BOOKING_SITE_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  if (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT || 3012}`;
}

/** Path of the guest's page (relative), e.g. for the booking page's confirmation step. */
export function managePath(code: string, email: string): string {
  return `/book/manage/?${new URLSearchParams({ code: code.trim().toUpperCase(), t: guestToken(code, email) })}`;
}

export function manageUrl(code: string, email: string): string {
  return `${siteOrigin()}${managePath(code, email)}`;
}
