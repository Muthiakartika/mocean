"use client";

import { formatDay, formatMoney } from "@/lib/booking/stay";
import type { Availability, CartRoom, Quote } from "@/lib/booking/types";
import { Stepper } from "./Stepper";
import styles from "./Booking.module.css";

type Props = {
  availability: Availability;
  cart: CartRoom[];
  quote: Quote | null;
  /** Rooms can be changed (rooms and extras steps); read-only once the guest is filling in details. */
  editable: boolean;
  onRemove: (index: number) => void;
  onGuests: (index: number, adults: number, children: number) => void;
  action?: { label: string; onClick: () => void; disabled?: boolean; busy?: boolean };
};

/** "Your stay": dates, chosen rooms with their guests, extras, total with tax and service, and the deposit. */
export default function StaySummary({ availability, cart, quote, editable, onRemove, onGuests, action }: Props) {
  const { query, nights, currency } = availability;
  const placedAdults = cart.reduce((sum, room) => sum + room.adults, 0);
  const placedChildren = cart.reduce((sum, room) => sum + room.children, 0);
  const missing = query.adults + query.children - placedAdults - placedChildren;

  return (
    <section className={styles.summary} aria-label="Your stay">
      <h2 className={styles.summaryTitle}>Your stay</h2>
      <p className={styles.summaryDates}>
        {formatDay(query.checkIn, { year: undefined })} <span aria-hidden="true">→</span>
        <span className="sr-only"> to </span> {formatDay(query.checkOut)}
        <span className={styles.summaryNights}>{nights === 1 ? "1 night" : `${nights} nights`}</span>
      </p>

      {cart.length === 0 ? (
        <p className={styles.summaryEmpty}>Add a room to start your booking.</p>
      ) : (
        <ul className={styles.summaryRooms}>
          {cart.map((item, index) => {
            const room = availability.rooms.find((offer) => offer.roomTypeId === item.roomTypeId);
            const rate = room?.rates.find((offer) => offer.rateId === item.rateId);
            if (!room || !rate) return null;
            return (
              <li key={`${item.rateId}-${index}`} className={styles.summaryRoom}>
                <div className={styles.summaryRoomHead}>
                  <span>
                    <span className={styles.summaryRoomName}>{room.name}</span>
                    <span className={styles.summaryRate}>{rate.name}</span>
                  </span>
                  <span className={styles.summaryAmount}>{formatMoney(rate.total, currency)}</span>
                </div>
                {editable ? (
                  <div className={styles.summaryGuests}>
                    <Stepper
                      compact
                      label="Adults"
                      value={item.adults}
                      min={1}
                      max={room.maxGuests - item.children}
                      onChange={(value) => onGuests(index, value, item.children)}
                    />
                    <Stepper
                      compact
                      label="Children"
                      value={item.children}
                      min={0}
                      max={room.maxGuests - item.adults}
                      onChange={(value) => onGuests(index, item.adults, value)}
                    />
                    <button type="button" className={styles.removeButton} onClick={() => onRemove(index)}>
                      Remove
                    </button>
                  </div>
                ) : (
                  <span className={styles.summaryRate}>
                    {item.adults} {item.adults === 1 ? "adult" : "adults"}
                    {item.children > 0 && `, ${item.children} ${item.children === 1 ? "child" : "children"}`}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {cart.length > 0 && missing > 0 && (
        <p className={styles.summaryNote} role="status">
          {missing === 1 ? "1 guest" : `${missing} guests`} of your search {missing === 1 ? "has" : "have"} no room yet. Add
          another room or more guests to a room.
        </p>
      )}

      {quote && cart.length > 0 && (
        <>
          {quote.lines.length > cart.length && (
            <ul className={styles.summaryExtras}>
              {quote.lines.slice(cart.length).map((line) => (
                <li key={line.label}>
                  <span>
                    {line.label}
                    {line.detail && <span className={styles.summaryRate}>{line.detail}</span>}
                  </span>
                  <span className={styles.summaryAmount}>{formatMoney(line.amount, currency)}</span>
                </li>
              ))}
            </ul>
          )}
          <dl className={styles.totals}>
            <div>
              <dt>Subtotal</dt>
              <dd>{formatMoney(quote.net, currency)}</dd>
            </div>
            <div>
              <dt>Tax and service</dt>
              <dd>{formatMoney(quote.taxes, currency)}</dd>
            </div>
            <div className={styles.grandTotal}>
              <dt>Total</dt>
              <dd>{formatMoney(quote.total, currency)}</dd>
            </div>
            <div className={styles.deposit}>
              <dt>Deposit to confirm</dt>
              <dd>{formatMoney(quote.deposit, currency)}</dd>
            </div>
          </dl>
        </>
      )}

      {action && (
        <button
          type="button"
          className={styles.primaryButton}
          onClick={action.onClick}
          disabled={action.disabled || action.busy}
          aria-busy={action.busy}
        >
          {action.busy ? "Please wait" : action.label}
        </button>
      )}
    </section>
  );
}
