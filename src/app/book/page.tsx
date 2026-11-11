import type { Metadata } from "next";
import BookingApp from "@/components/booking/BookingApp";
import { contact } from "@/data/contact";
import "@/styles/redesign/tokens.css";
import "@/styles/redesign/waves.css";
import "./book.css";

/** The site's own booking engine on the Cloudbeds API (src/components/booking/, src/app/api/booking/). */
export const metadata: Metadata = {
  title: "Book your stay | Mocean Beach Resort",
  description: "Check which rooms are free at Mocean Beach Resort, West Sumbawa, and book direct.",
  alternates: { canonical: "/book/" },
  // A search tool, not a page for search results.
  robots: { index: false, follow: true },
};

export default function BookPage() {
  return <BookingApp fallbackUrl={contact.cloudbedsUrl} whatsappUrl={contact.whatsappUrl} />;
}
