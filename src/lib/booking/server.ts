import { cloudbedsProvider, cloudbedsConfigured } from "@/lib/cloudbeds/provider";
import { demoAvailability } from "./demo";
import type { Availability, BookingSource, Quote, ReservationRequest, StayQuery } from "./types";

/**
 * Where /book/ gets rooms and makes reservations.
 *
 *   CLOUDBEDS_API_KEY set  -> Cloudbeds (src/lib/cloudbeds/)
 *   otherwise              -> demo data everywhere but the production site (development, Vercel previews), or
 *                             anywhere with BOOKING_DEMO=1
 *   production without it -> none: the API answers 503 and the page offers the Cloudbeds booking page instead
 */
export type BookingProvider = {
  source: BookingSource;
  availability(query: StayQuery): Promise<Availability>;
  /**
   * Creates the reservation; `availability` and `quote` are the server's own fresh pricing of the request. May answer
   * the provider's final total and deposit (Cloudbeds prices extra guests and applies its deposit policy).
   */
  reserve(request: ReservationRequest, availability: Availability, quote: Quote): Promise<{ reservationId: string; total?: number; deposit?: number }>;
};

const demoProvider: BookingProvider = {
  source: "demo",
  availability: async (query) => demoAvailability(query),
  reserve: async () => ({ reservationId: `DEMO-${Math.random().toString(36).slice(2, 8).toUpperCase()}` }),
};

export function bookingProvider(): BookingProvider | null {
  if (cloudbedsConfigured()) return cloudbedsProvider;
  // The same test as isProduction in src/lib/metadata.ts.
  const productionSite = process.env.VERCEL_ENV === "production" || process.env.SITE_ENV === "production";
  if (!productionSite || process.env.BOOKING_DEMO === "1") return demoProvider;
  return null;
}

/** Only the site's own pages may call the booking API (browsers send Origin with every fetch POST). */
export function fromThisSite(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === (request.headers.get("host") ?? new URL(request.url).host);
  } catch {
    return false;
  }
}

/**
 * Small in-memory limiter per client IP. On Vercel each warm instance keeps its own count, so this stops a single
 * script hammering one instance, not a distributed attack (put a Vercel firewall rule or Turnstile in front for that).
 */
const hits = new Map<string, number[]>();

export function rateLimited(request: Request, key: string, max: number, windowMs: number) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  const id = `${key}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(id) ?? []).filter((time) => now - time < windowMs);
  recent.push(now);
  hits.set(id, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > max;
}
