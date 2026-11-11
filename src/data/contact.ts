/**
 * Booking and contact destinations used across the site.
 * These are copied exactly from the original — do not change them (PRD §7.2).
 */
export const SITE_URL = "https://moceanbeachresort.com";

export const contact = {
  /** Cloudbeds booking engine (property code yPrE1K). */
  cloudbedsUrl: "https://us2.cloudbeds.com/reservation/yPrE1K",
  whatsappUrl: "https://wa.me/6282144191647",
  phoneDisplay: "+62 821-4419-1647",
  /** Same number for tel: links and structured data (E.164). */
  phoneE164: "+6282144191647",
  /** Short form, shown in the header strip and the footer. */
  address: "Pantai Moro, West Sumbawa, Indonesia",
  /**
   * Postal address as listed on the resort's Google Business Profile ("Mocean Beach Resort", checked 2026-11-11). Local
   * search matches name, address and phone across the site, the profile and directories, so this one is used in the
   * footer and the structured data.
   */
  postalAddress: {
    street: "Jl. Tano Kertasari, Tua Nanga",
    locality: "Poto Tano",
    regency: "West Sumbawa",
    region: "West Nusa Tenggara",
    regionSchema: "Nusa Tenggara Barat",
    postalCode: "84454",
    country: "Indonesia",
    countryCode: "ID",
  },
  /** Google Maps place of the resort (its Business Profile). */
  mapsUrl: "https://maps.google.com/?cid=9781918641660082954",
  /** Pin of the Business Profile. */
  geo: { latitude: -8.6739397, longitude: 116.7670435 },
  facebookUrl: "https://www.facebook.com/MoceanDiveResort",
  instagramUrl: "https://www.instagram.com/moceanresort/",
  /** Google Maps embed shown in the footer ("We Are Here") and on several pages. */
  mapEmbedUrl:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3944.1833073542616!2d116.76704219999999!3d-8.6741111!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2dcc43fe6d2ce551%3A0x87c05b2d81ebbb0a!2sMocean%20Resort%20and%20Dive!5e0!3m2!1sen!2sid!4v1748483767960!5m2!1sen!2sid",
} as const;
