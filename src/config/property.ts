import { contact } from "@/data/contact";

/**
 * What the booking system (/book/, /book/manage/, /admin/ and its emails) needs to know about the property it runs for.
 *
 * The booking code itself names no property: to run it for another one, this file and property-rooms.ts (the starting
 * rooms and extras) are what change. What is still tied to this site besides them is listed in docs/booking-native.md
 * ("Using it for another property").
 *
 * Plain values only, and safe for the browser (the booking page imports this file): secrets are environment variables
 * (.env.example), never values here.
 */
export type PropertyConfig = {
  /** Full name: page titles, emails, the sender name of emails. */
  name: string;
  /** Short name: "Hello Mocean" in the guest's WhatsApp message, the admin's label for screen readers. */
  shortName: string;
  /** Where it is, in a few words: the sign-off of emails, page descriptions. */
  region: string;
  /** The line under the title of the booking page. */
  locationLine: string;

  /**
   * Currency code shown with every price ("IDR 2,200,000"). Prices are stored and shown as whole amounts: a currency
   * that needs cents is not supported yet.
   */
  currency: string;
  /** IANA time zone of the property. It decides which day is "today" and the times staff see in the admin. */
  timeZone: string;
  /** Booking numbers are this prefix, a dash and six characters: MOC-7K2P9X. Capital letters. */
  bookingCodePrefix: string;
  /**
   * Technical name, lowercase letters only: the admin's login cookie, the search kept in the guest's browser, the folder
   * of the local development database. Changing it signs staff out and starts an empty local database.
   */
  slug: string;

  /** Opened by every "message us on WhatsApp" link. */
  whatsappUrl: string;
  /** Another place to book, offered when the booking page cannot answer. Leave out when there is none. */
  fallbackBooking?: { url: string; label: string };

  images: {
    /** White logo, on the admin's dark sidebar and login. */
    logoWhite: { src: string; width: number; height: number };
    /** Photo behind the title of /book/ and /book/manage/: a wide banner. */
    hero: string;
    /** Photo that fills the staff login: tall enough for a whole screen (a banner crop gets blurry). Default: `hero`. */
    login?: string;
  };

  copy: {
    /** Second sentence of the hint shown on /book/ before the guest has searched. Leave out for none. */
    searchHint?: string;
    /** Example text in "Requests for the resort" on the booking form. */
    requestsPlaceholder: string;
    /** Example text in "send us a message" on Manage my booking. */
    messagePlaceholder: string;
  };

  /**
   * Starting values of what staff change in /admin/rates/ (they apply until a value is saved there):
   * tax and service inside the prices (0.221: a price is 122.1% of its net amount), from how many nights the long-stay
   * rate applies and its discount in percent (0 switches it off), how many hours a request holds its rooms, and whether
   * website bookings are confirmed at once.
   */
  settingDefaults: {
    includedTaxRate: number;
    extendedStayMinNights: number;
    extendedStayDiscountPct: number;
    pendingHoldHours: number;
    autoConfirm: boolean;
  };
  /** A note for staff under those settings in the admin, e.g. where the starting values came from. */
  settingsNote?: string;
};

export const property: PropertyConfig = {
  name: "Mocean Beach Resort",
  shortName: "Mocean",
  region: "West Sumbawa",
  locationLine: "Pantai Moro, West Sumbawa",

  currency: "IDR",
  // WITA, UTC+8, no daylight saving time.
  timeZone: "Asia/Makassar",
  bookingCodePrefix: "MOC",
  slug: "mocean",

  whatsappUrl: contact.whatsappUrl,
  // The site's "Book Now" buttons still go here too.
  fallbackBooking: { url: contact.cloudbedsUrl, label: "our Cloudbeds page" },

  images: {
    logoWhite: { src: "/images/uploads/2025/02/Mocean-FULL-Logo_White-1024x578.png", width: 1024, height: 578 },
    hero: "/images/uploads/2025/09/Beach-Resort-Header.jpg",
    // The same pool view as the banner, uncropped (1920 x 1050).
    login: "/images/uploads/2025/06/Slider-mocean-3.jpg",
  },

  copy: {
    searchHint: "Booking direct for three nights or more gets a discount.",
    requestsPlaceholder: "Pickup from Poto Tano, dive or surf plans, dietary needs",
    messagePlaceholder: "Pickup time, dive or surf plans, a change of dates",
  },

  // Tax rate and discount are what the Cloudbeds booking page showed on 2026-11-11 (22.1% inclusive; "Extended Stay -
  // Three Nights or More" 5% under the standard rate). The owner should confirm them.
  settingDefaults: {
    includedTaxRate: 0.221,
    extendedStayMinNights: 3,
    extendedStayDiscountPct: 5,
    pendingHoldHours: 24,
    autoConfirm: false,
  },
  settingsNote:
    "The 5% long-stay discount from 3 nights and the 22.1% tax and service are what the Cloudbeds booking page showed on 2026-11-11. Check them against the resort's own figures.",
};
