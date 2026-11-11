import { bookingProvider, rateLimited } from "@/lib/booking/server";
import { checkQuery, queryFromParams } from "@/lib/booking/stay";
import { contact } from "@/data/contact";

/**
 * GET /api/booking/availability/?checkin=2026-12-10&checkout=2026-12-13&adults=2&children=0[&promo=CODE]
 * Rooms free for the stay with their rates and the extras, from Cloudbeds (see src/lib/booking/server.ts).
 * Answers Availability (src/lib/booking/types.ts) or { message } with 4xx/5xx.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (rateLimited(request, "availability", 60, 60_000)) {
    return Response.json({ message: "Too many searches in a short time. Wait a minute and try again." }, { status: 429 });
  }

  const query = queryFromParams(new URL(request.url).searchParams);
  const problem = query ? checkQuery(query) : "Choose your check-in and check-out dates.";
  if (!query || problem) return Response.json({ message: problem }, { status: 400 });

  const provider = bookingProvider();
  if (!provider) {
    return Response.json(
      { message: "Online booking on this page isn't available right now.", fallbackUrl: contact.cloudbedsUrl },
      { status: 503 },
    );
  }

  try {
    const availability = await provider.availability(query);
    return Response.json(availability, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[booking] availability failed:", error);
    return Response.json(
      { message: "We couldn't load the rooms just now. Please try again in a moment.", fallbackUrl: contact.cloudbedsUrl },
      { status: 502 },
    );
  }
}
