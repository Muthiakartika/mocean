/**
 * Trial version of the booking system: a copy that runs beside the property's current booking engine so the owner and
 * staff can try it with real rooms and prices before deciding to switch (docs/booking-native.md, "Trial version").
 *
 *   BOOKING_TRIAL=1          the admin and the guest pages say it is a trial, and staff can add and remove sample
 *                            bookings (src/lib/booking/native/samples.ts).
 *   BOOKING_TRIAL_EMAIL      every email the system writes goes only here (comma-separated), marked "[Trial]" and
 *                            naming who would have received it. Not set: no email is sent at all.
 *
 * Set them on the trial deployment only (e.g. Vercel, Preview, the branch of the trial), never on the live site.
 */
export function trialMode(): boolean {
  return process.env.BOOKING_TRIAL === "1";
}

export function trialInbox(): string[] {
  return (process.env.BOOKING_TRIAL_EMAIL ?? "")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);
}
