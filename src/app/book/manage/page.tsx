import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Wave from "@/components/home/Wave";
import styles from "@/components/booking/Booking.module.css";
import TrialNote from "@/components/booking/TrialNote";
import { property } from "@/config/property";
import { trialMode } from "@/lib/booking/native/trial";
import { databaseConfigured, getDb } from "@/lib/db";
import { checkGuestToken } from "@/lib/booking/native/guest-link";
import { displayStatus, getReservation } from "@/lib/booking/native/store";
import { formatDay, formatMoney, nightsBetween } from "@/lib/booking/stay";
import { loadPaymentSettings, type PaymentSettings } from "@/lib/booking/native/payment-settings";
import { amountToPay, payOptions, summarize } from "@/lib/booking/native/payments";
import { findBookingAction, guestCancelAction, messageAction, payOnlineAction, requestCancelAction } from "./actions";
import manage from "./Manage.module.css";
import "@/styles/redesign/tokens.css";
import "@/styles/redesign/waves.css";
import "../book.css";

/** "Manage my booking": the guest finds a booking with its number and email (or the link in their email). */
export const metadata: Metadata = {
  title: `Manage my booking | ${property.name}`,
  description: `See, cancel or ask about your booking at ${property.name}.`,
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

  const db = available ? await getDb() : null;
  const detail = db && code && token ? await getReservation(db, code) : null;
  const allowed = Boolean(detail?.reservation.email && checkGuestToken(code, detail.reservation.email, token));
  const paymentSettings = allowed && db ? await loadPaymentSettings(db) : null;

  return (
    <div className={styles.app} id="booking-app">
      <section className={styles.hero}>
        <Image className={styles.heroImage} src={property.images.hero} alt="" fill priority sizes="100vw" />
        <div className={styles.heroInner}>
          <h1 className={styles.title}>{allowed ? "Your booking" : "Manage my booking"}</h1>
          <p className={styles.lead}>{allowed ? `Booking number ${code}` : "See your booking, cancel it or write to us."}</p>
          {trialMode() && <TrialNote />}
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
            <a className={styles.primaryButton} href={property.whatsappUrl} target="_blank" rel="noopener">
              Message us on WhatsApp
            </a>
          </section>
        ) : allowed && detail ? (
          <BookingView detail={detail} code={code} token={token} payment={paymentSettings} paidReturn={one(query.paid) === "1"} />
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
                <input id="code" name="code" placeholder={`${property.bookingCodePrefix}-7K2P9X`} autoComplete="off" required maxLength={20} defaultValue={code} />
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
              No email from us? <a href={property.whatsappUrl} target="_blank" rel="noopener">Message us on WhatsApp</a>.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

type Detail = NonNullable<Awaited<ReturnType<typeof getReservation>>>;

function BookingView({
  detail,
  code,
  token,
  payment,
  paidReturn,
}: {
  detail: Detail;
  code: string;
  token: string;
  payment: PaymentSettings | null;
  paidReturn: boolean;
}) {
  const { reservation: r, rooms, extras } = detail;
  const status = displayStatus(r);
  const info = STATUS[status];
  const summary = summarize(r, detail.payments);
  const due = amountToPay(r, summary);
  const options = payment ? payOptions(payment) : { online: false, bank: false };
  const showPay = due > 0 && (options.online || options.bank);
  const nights = nightsBetween(r.checkIn, r.checkOut);
  const guests = rooms.reduce((sum, room) => sum + room.adults + room.children, 0);
  const whatsapp = `${property.whatsappUrl}?${new URLSearchParams({
    text: `Hello ${property.shortName}, about my booking ${r.code} (${formatDay(r.checkIn, { weekday: undefined })} to ${formatDay(r.checkOut, { weekday: undefined })}): `,
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
          {summary.paid > 0 && (
            <>
              <div>
                <dt>Paid</dt>
                <dd>{formatMoney(summary.paid)}</dd>
              </div>
              <div>
                <dt>Still to pay</dt>
                <dd>{formatMoney(summary.balance)}</dd>
              </div>
            </>
          )}
        </dl>
        <p className={manage.muted}>Tax and service are included. Changing dates or rooms: write to us and we will arrange it.</p>
      </section>

      <div className={manage.side}>
        {paidReturn && summary.paid === 0 && status !== "cancelled" && (
          <p className={manage.done} role="status">
            Thank you. We are waiting for the payment provider to confirm your payment; refresh this page in a minute to see it.
          </p>
        )}
        {showPay && payment && (
          <section className={`${manage.card} ${manage.pay}`} aria-labelledby="pay-title">
            <h2 className={manage.title} id="pay-title">
              {summary.depositDue > 0 ? (status === "pending" ? "Pay the deposit to confirm" : "Pay the deposit") : "Pay the rest"}
            </h2>
            <p className={manage.payAmount}>{formatMoney(due)}</p>
            {options.online && (
              <form action={payOnlineAction} className={manage.form}>
                <input type="hidden" name="code" value={code} />
                <input type="hidden" name="t" value={token} />
                <button type="submit" className={styles.primaryButton}>
                  Pay online
                </button>
                <p className={manage.muted}>You choose how to pay on the next page, a payment page by Xendit.</p>
              </form>
            )}
            {options.bank && (
              <div className={manage.bank}>
                <p className={manage.bankLead}>{options.online ? "Or pay by bank transfer" : "Pay by bank transfer"}</p>
                <dl>
                  <div>
                    <dt>Bank</dt>
                    <dd>{payment.bankName}</dd>
                  </div>
                  <div>
                    <dt>Account name</dt>
                    <dd>{payment.bankAccountName}</dd>
                  </div>
                  <div>
                    <dt>Account number</dt>
                    <dd className={manage.copyable}>{payment.bankAccountNumber}</dd>
                  </div>
                  <div>
                    <dt>Reference</dt>
                    <dd className={manage.copyable}>{r.code}</dd>
                  </div>
                </dl>
                {payment.bankNote && <p className={manage.muted}>{payment.bankNote}</p>}
                <p className={manage.muted}>We confirm the transfer here and by email once it arrives.</p>
              </div>
            )}
          </section>
        )}

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
              <textarea id="message" name="message" rows={4} maxLength={2000} placeholder={property.copy.messagePlaceholder} required />
            </div>
            <button type="submit" className={manage.secondary}>
              Send message
            </button>
          </form>
        </section>

        {/* Once money came in, cancelling means settling it: the guest writes to the resort instead (Questions or changes). */}
        {(status === "pending" || status === "expired") && summary.paid === 0 && (
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
