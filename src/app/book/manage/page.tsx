import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Wave from "@/components/home/Wave";
import styles from "@/components/booking/Booking.module.css";
import { contact } from "@/data/contact";
import { databaseConfigured, getDb } from "@/lib/db";
import { checkGuestToken } from "@/lib/booking/native/guest-link";
import { displayStatus, getReservation } from "@/lib/booking/native/store";
import { formatDay, formatMoney, nightsBetween } from "@/lib/booking/stay";
import { findBookingAction, guestCancelAction, messageAction, requestCancelAction } from "./actions";
import manage from "./Manage.module.css";
import "@/styles/redesign/tokens.css";
import "@/styles/redesign/waves.css";
import "../book.css";

/** "Manage my booking": the guest finds a booking with its number and email (or the link in their email). */
export const metadata: Metadata = {
  title: "Manage my booking | Mocean Beach Resort",
  description: "See, cancel or ask about your booking at Mocean Beach Resort.",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

const STATUS = {
  pending: { label: "Request received", tone: manage.pending, text: "We are checking your request. We will email you to confirm it and to arrange the deposit." },
  confirmed: { label: "Confirmed", tone: manage.confirmed, text: "Your booking is confirmed. We look forward to welcoming you." },
  expired: {
    label: "Request expired",
    tone: manage.muted,
    text: "We could not confirm this request in time, so its rooms are no longer held. Message us if you would still like to come.",
  },
  cancelled: { label: "Cancelled", tone: manage.muted, text: "This booking is cancelled." },
} as const;

export default async function ManageBookingPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const code = one(query.code).trim().toUpperCase();
  const token = one(query.t);
  const done = one(query.done);
  const error = one(query.error);
  const available = process.env.BOOKING_PROVIDER?.trim().toLowerCase() === "native" && databaseConfigured();

  const detail = available && code && token ? await getReservation(await getDb(), code) : null;
  const allowed = Boolean(detail?.reservation.email && checkGuestToken(code, detail.reservation.email, token));

  return (
    <div className={styles.app} id="booking-app">
      <section className={styles.hero}>
        <Image className={styles.heroImage} src="/images/uploads/2025/09/Beach-Resort-Header.jpg" alt="" fill priority sizes="100vw" />
        <div className={styles.heroInner}>
          <h1 className={styles.title}>{allowed ? "Your booking" : "Manage my booking"}</h1>
          <p className={styles.lead}>{allowed ? `Booking number ${code}` : "See your booking, cancel it or write to us."}</p>
        </div>
        <Wave edge="bottom" className={styles.heroWave} />
      </section>

      <div className={manage.wrap}>
        {(done || (error && allowed)) && (
          <p className={done ? manage.done : manage.error} role={done ? "status" : "alert"}>
            {done || error}
          </p>
        )}

        {!available ? (
          <section className={manage.card}>
            <h2 className={manage.title}>Questions about your booking?</h2>
            <p>Reply to your booking confirmation email, or message us on WhatsApp with your booking number and we will help you.</p>
            <a className={styles.primaryButton} href={contact.whatsappUrl} target="_blank" rel="noopener">
              Message us on WhatsApp
            </a>
          </section>
        ) : allowed && detail ? (
          <BookingView detail={detail} code={code} token={token} />
        ) : (
          <section className={`${manage.card} ${manage.narrow}`}>
            <h2 className={manage.title}>Find your booking</h2>
            <p className={manage.muted}>Both are in the email we sent when you booked.</p>
            {error && (
              <p className={manage.error} role="alert">
                {error}
              </p>
            )}
            <form action={findBookingAction} className={manage.form}>
              <div className={styles.formField}>
                <label htmlFor="code">Booking number</label>
                <input id="code" name="code" placeholder="MOC-7K2P9X" autoComplete="off" required maxLength={20} defaultValue={code} />
              </div>
              <div className={styles.formField}>
                <label htmlFor="email">Email used for the booking</label>
                <input id="email" name="email" type="email" autoComplete="email" required maxLength={100} />
              </div>
              <button type="submit" className={styles.primaryButton}>
                Find my booking
              </button>
            </form>
            <p className={manage.muted}>
              No email from us? <a href={contact.whatsappUrl} target="_blank" rel="noopener">Message us on WhatsApp</a>.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

type Detail = NonNullable<Awaited<ReturnType<typeof getReservation>>>;

function BookingView({ detail, code, token }: { detail: Detail; code: string; token: string }) {
  const { reservation: r, rooms, extras } = detail;
  const status = displayStatus(r);
  const info = STATUS[status];
  const nights = nightsBetween(r.checkIn, r.checkOut);
  const guests = rooms.reduce((sum, room) => sum + room.adults + room.children, 0);
  const whatsapp = `${contact.whatsappUrl}?${new URLSearchParams({
    text: `Hello Mocean, about my booking ${r.code} (${formatDay(r.checkIn, { weekday: undefined })} to ${formatDay(r.checkOut, { weekday: undefined })}): `,
  })}`;
  const hidden = (
    <>
      <input type="hidden" name="code" value={code} />
      <input type="hidden" name="t" value={token} />
    </>
  );

  return (
    <div className={manage.grid}>
      <section className={manage.card} aria-labelledby="stay-title">
        <div className={manage.head}>
          <h2 className={manage.title} id="stay-title">
            {formatDay(r.checkIn, { weekday: undefined, year: r.checkIn.slice(0, 4) === r.checkOut.slice(0, 4) ? undefined : "numeric" })} to{" "}
            {formatDay(r.checkOut, { weekday: undefined })}
          </h2>
          <span className={`${manage.status} ${info.tone}`}>{info.label}</span>
        </div>
        <p>
          {r.cancelRequestedAt && status === "confirmed"
            ? `You asked to cancel on ${formatDay(r.cancelRequestedAt.toISOString().slice(0, 10), { weekday: undefined })}. We will reply by email about the cancellation and your deposit.`
            : info.text}
        </p>

        <dl className={styles.confirmFacts}>
          <div>
            <dt>Guest</dt>
            <dd>
              {r.firstName} {r.lastName}
            </dd>
          </div>
          <div>
            <dt>Stay</dt>
            <dd>
              {nights} night{nights === 1 ? "" : "s"}, {guests} guest{guests === 1 ? "" : "s"}
            </dd>
          </div>
        </dl>

        <ul className={manage.lines}>
          {rooms.map((room) => (
            <li key={room.id}>
              <span>
                <strong>{room.roomName}</strong>
                <span className={manage.muted}>
                  {room.rateName}, {room.adults} adult{room.adults === 1 ? "" : "s"}
                  {room.children > 0 && `, ${room.children} child${room.children === 1 ? "" : "ren"}`}
                </span>
              </span>
              <span>{formatMoney(room.total)}</span>
            </li>
          ))}
          {extras.map((extra) => (
            <li key={extra.name}>
              <span>
                <strong>{extra.name}</strong>
                {extra.quantity > 1 && <span className={manage.muted}>{extra.quantity} x {formatMoney(extra.unitPrice)}</span>}
              </span>
              <span>{formatMoney(extra.unitPrice * extra.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className={styles.totals}>
          <div className={styles.grandTotal}>
            <dt>Total</dt>
            <dd>{formatMoney(r.total)}</dd>
          </div>
          <div className={styles.deposit}>
            <dt>Deposit to confirm</dt>
            <dd>{formatMoney(r.deposit)}</dd>
          </div>
        </dl>
        <p className={manage.muted}>Tax and service are included. Changing dates or rooms: write to us and we will arrange it.</p>
      </section>

      <div className={manage.side}>
        <section className={manage.card} aria-labelledby="contact-title">
          <h2 className={manage.title} id="contact-title">
            Questions or changes
          </h2>
          <a className={`${styles.primaryButton} ${manage.whatsapp}`} href={whatsapp} target="_blank" rel="noopener">
            Message us on WhatsApp
          </a>
          <form action={messageAction} className={manage.form}>
            {hidden}
            <div className={styles.formField}>
              <label htmlFor="message">Or send us a message</label>
              <textarea id="message" name="message" rows={4} maxLength={2000} placeholder="Pickup time, dive or surf plans, a change of dates" required />
            </div>
            <button type="submit" className={manage.secondary}>
              Send message
            </button>
          </form>
        </section>

        {(status === "pending" || status === "expired") && (
          <section className={manage.card} aria-labelledby="cancel-title">
            <h2 className={manage.title} id="cancel-title">
              Cancel this request
            </h2>
            <p className={manage.muted}>Nothing has been charged yet, so you can cancel it here.</p>
            <form action={guestCancelAction} className={manage.form}>
              {hidden}
              <label className={manage.check}>
                <input type="checkbox" name="sure" required /> Yes, cancel my booking request
              </label>
              <button type="submit" className={manage.danger}>
                Cancel request
              </button>
            </form>
          </section>
        )}

        {status === "confirmed" && !r.cancelRequestedAt && (
          <section className={manage.card} aria-labelledby="cancel-title">
            <h2 className={manage.title} id="cancel-title">
              Cancel this booking
            </h2>
            <p className={manage.muted}>Your booking is confirmed, so we cancel it for you and reply about your deposit.</p>
            <form action={requestCancelAction} className={manage.form}>
              {hidden}
              <div className={styles.formField}>
                <label htmlFor="note">Anything we should know? (optional)</label>
                <textarea id="note" name="note" rows={3} maxLength={1000} />
              </div>
              <label className={manage.check}>
                <input type="checkbox" name="sure" required /> Yes, I want to cancel this booking
              </label>
              <button type="submit" className={manage.danger}>
                Ask to cancel
              </button>
            </form>
          </section>
        )}

        <p className={manage.muted}>
          <Link href="/book/">Make another booking</Link>
        </p>
      </div>
    </div>
  );
}
