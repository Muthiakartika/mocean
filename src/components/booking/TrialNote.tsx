import { property } from "@/config/property";
import styles from "./Booking.module.css";

/** Under the title of /book/ and /book/manage/ in the trial version (BOOKING_TRIAL=1): nothing booked here is real. */
export default function TrialNote() {
  const real = property.fallbackBooking;
  return (
    <p className={styles.trialNote}>
      <strong>Trial version.</strong> Bookings made here are not real.
      {real && (
        <>
          {" "}
          To book a stay, use{" "}
          <a href={real.url} rel="noopener">
            {real.label}
          </a>
          .
        </>
      )}
    </p>
  );
}
