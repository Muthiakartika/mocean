import type { Metadata } from "next";
import BookingApp from "@/components/booking/BookingApp";
import { property } from "@/config/property";
import { trialMode } from "@/lib/booking/native/trial";
import "@/styles/redesign/tokens.css";
import "@/styles/redesign/waves.css";
import "./book.css";

/**
 * The site's own booking engine (src/components/booking/, src/app/api/booking/), on the property's own database or the
 * Cloudbeds API (src/lib/booking/server.ts). What it says about the property comes from src/config/property.ts.
 */
export const metadata: Metadata = {
  title: `Book your stay | ${property.name}`,
  description: `Check which rooms are free at ${property.name}, ${property.region}, and book direct.`,
  alternates: { canonical: "/book/" },
  // A search tool, not a page for search results.
  robots: { index: false, follow: true },
};

export default function BookPage() {
  return <BookingApp trial={trialMode()} />;
}
