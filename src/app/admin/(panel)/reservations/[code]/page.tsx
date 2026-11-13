import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { property } from "@/config/property";
import { METHOD_LABEL, summarize } from "@/lib/booking/native/payments";
import { displayStatus, getReservation } from "@/lib/booking/native/store";
import { resortToday } from "@/lib/booking/stay";
import { cancelAction, confirmAction, deletePaymentAction, notesAction, recordPaymentAction } from "../../../actions";
import MoneyInput from "../../../money-input";
import { Flash, PaymentBadge, StatusBadge, money, one, resortTime, stayLabel } from "../../../ui";

export default async function ReservationPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ code }, query] = await Promise.all([params, searchParams]);
  const detail = await getReservation(await getDb(), decodeURIComponent(code));
  if (!detail) notFound();
  const { reservation: r, rooms, extras } = detail;
  const status = displayStatus(r);
  const pay = summarize(r, detail.payments);
  const payState = pay.depositDue > 0 ? { tone: "pending", label: pay.paid > 0 ? "Deposit partly paid" : "Deposit not paid" } : pay.balance > 0 ? { tone: "confirmed", label: "Deposit paid" } : { tone: "confirmed", label: "Paid in full" };

  return (
    <>
      <p className="adm-small">
        <Link href="/admin/reservations/">Back to bookings</Link>
      </p>
      <div className="adm-head">
        <div>
          <h1>
            {r.code} <StatusBadge row={r} />
          </h1>
          <p className="adm-muted">
            {r.source === "admin" ? "Entered by staff" : "Made on the website"} on {resortTime(r.createdAt)} (resort time)
            {status === "pending" && r.expiresAt && <> · holds its rooms until {resortTime(r.expiresAt)}</>}
            {status === "expired" && <> · the hold ended, the rooms are for sale again</>}
          </p>
        </div>
      </div>

      <Flash done={one(query.done)} error={one(query.error)} />

      {r.cancelRequestedAt && r.status === "confirmed" && (
        <section className="adm-card adm-callout" aria-labelledby="cancel-request">
          <h2 id="cancel-request">The guest asked to cancel</h2>
          <p>
            On {resortTime(r.cancelRequestedAt)} (resort time), from their booking page. The booking still holds its rooms. Settle the
            deposit with the guest, then cancel it below.
          </p>
          {r.cancelRequestNote ? <blockquote className="adm-quote">{r.cancelRequestNote}</blockquote> : <p className="adm-muted">No note from the guest.</p>}
          <a className="adm-btn adm-btn--danger" href="#cancel">
            Go to cancel
          </a>
        </section>
      )}

      {(status === "pending" || status === "expired") && (
        <section className="adm-card">
          <h2>{status === "expired" ? "Request expired" : "Waiting for your answer"}</h2>
          <p>
            {status === "expired"
              ? "Confirming works only while the rooms are still free."
              : "Confirming emails the guest (when they gave an address). Cancelling puts the rooms back on sale."}
          </p>
          <form action={confirmAction}>
            <input type="hidden" name="code" value={r.code} />
            <button className="adm-btn" type="submit">
              Confirm booking
            </button>
          </form>
        </section>
      )}

      <div className="adm-grid">
        <section className="adm-card">
          <h2>Stay</h2>
          <dl className="adm-dl">
            <dt>Dates</dt>
            <dd>{stayLabel(r.checkIn, r.checkOut)}</dd>
            {r.arrivalTime && (
              <>
                <dt>Arrival time</dt>
                <dd>{r.arrivalTime}</dd>
              </>
            )}
            <dt>Total</dt>
            <dd>
              {money(r.total)} <span className="adm-muted adm-small">(tax and service included)</span>
            </dd>
            <dt>Deposit</dt>
            <dd>{money(r.deposit)}</dd>
          </dl>
        </section>

        <section className="adm-card">
          <h2>Guest</h2>
          <dl className="adm-dl">
            <dt>Name</dt>
            <dd>
              {r.firstName} {r.lastName}
            </dd>
            <dt>Email</dt>
            <dd>{r.email ? <a href={`mailto:${r.email}`}>{r.email}</a> : <span className="adm-muted">none</span>}</dd>
            <dt>Phone</dt>
            <dd>{r.phone || <span className="adm-muted">none</span>}</dd>
            <dt>Country</dt>
            <dd>{r.country || <span className="adm-muted">none</span>}</dd>
            {r.notes && (
              <>
                <dt>Requests</dt>
                <dd>{r.notes}</dd>
              </>
            )}
          </dl>
        </section>
      </div>

      <section className="adm-card" id="payments" aria-labelledby="payments-title">
        <div className="adm-pay-head">
          <h2 id="payments-title">Payments</h2>
          {r.status !== "cancelled" && <span className={`adm-badge adm-badge--${payState.tone}`}>{payState.label}</span>}
        </div>
        <dl className="adm-pay-sum">
          <div>
            <dt>Total</dt>
            <dd>{money(r.total)}</dd>
          </div>
          <div>
            <dt>Deposit</dt>
            <dd>{money(r.deposit)}</dd>
          </div>
          <div>
            <dt>Paid</dt>
            <dd>{money(pay.paid)}</dd>
          </div>
          <div>
            <dt>Still to pay</dt>
            <dd>{money(pay.balance)}</dd>
          </div>
        </dl>
        {pay.openOnline && (
          <p className="adm-muted adm-small">
            The guest opened an online payment page for {money(pay.openOnline.amount)}
            {pay.openOnline.expiresAt && <>, open until {resortTime(pay.openOnline.expiresAt)}</>}. It is recorded here by itself when paid.
          </p>
        )}

        {detail.payments.length > 0 && (
          <div className="adm-scroll">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>How</th>
                  <th>Status</th>
                  <th className="adm-num">Amount</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {detail.payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{resortTime(payment.paidAt ?? payment.createdAt)}</td>
                    <td>
                      {METHOD_LABEL[payment.method]}
                      {(payment.channel || payment.note) && <div className="adm-muted adm-small">{[payment.channel, payment.note].filter(Boolean).join(" · ")}</div>}
                    </td>
                    <td>
                      <PaymentBadge status={payment.status} />
                    </td>
                    <td className="adm-num">{money(payment.amount)}</td>
                    <td className="adm-num">
                      {payment.method !== "xendit" && (
                        <form action={deletePaymentAction}>
                          <input type="hidden" name="code" value={r.code} />
                          <input type="hidden" name="id" value={payment.id} />
                          <button className="adm-btn adm-btn--quiet adm-btn--sm" type="submit" title="Remove a payment entered by mistake">
                            Remove
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {r.status !== "cancelled" && (
          <details className="adm-record" open={pay.paid === 0 && status !== "expired"}>
            <summary>Record a payment received</summary>
            <form action={recordPaymentAction} className="adm-stack">
              <input type="hidden" name="code" value={r.code} />
              <div className="adm-fields">
                <div>
                  <label htmlFor="pay-amount">Amount received</label>
                  <MoneyInput id="pay-amount" name="amount" defaultValue={pay.depositDue > 0 ? pay.depositDue : pay.balance || undefined} currency={property.currency} />
                </div>
                <div>
                  <label htmlFor="pay-method">How</label>
                  <select id="pay-method" name="method" defaultValue="bank">
                    <option value="bank">Bank transfer</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card at the resort</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="pay-day">Received on</label>
                  <input id="pay-day" name="paidOn" type="date" defaultValue={resortToday()} required />
                </div>
                <div>
                  <label htmlFor="pay-note">
                    Note <span className="adm-label-hint">optional</span>
                  </label>
                  <input id="pay-note" name="note" type="text" maxLength={500} placeholder="e.g. transfer slip on WhatsApp" />
                </div>
              </div>
              <div className="adm-actions">
                {r.status === "pending" && (
                  <label className="adm-check">
                    <input type="checkbox" name="confirm" defaultChecked /> Confirm the booking
                  </label>
                )}
                <label className="adm-check">
                  <input type="checkbox" name="notify" defaultChecked={Boolean(r.email)} disabled={!r.email} /> Email the guest a receipt
                </label>
                <button className="adm-btn" type="submit">
                  Record payment
                </button>
              </div>
            </form>
          </details>
        )}
      </section>

      <section className="adm-card">
        <h2>Rooms and extras</h2>
        <div className="adm-scroll">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Guests</th>
                <th className="adm-num">Price</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id}>
                  <td>
                    {room.roomName}
                    <div className="adm-muted adm-small">{room.rateName}</div>
                  </td>
                  <td>
                    {room.adults} adult{room.adults === 1 ? "" : "s"}
                    {room.children > 0 && `, ${room.children} child${room.children === 1 ? "" : "ren"}`}
                  </td>
                  <td className="adm-num">{money(room.total)}</td>
                </tr>
              ))}
              {extras.map((extra, index) => (
                <tr key={index}>
                  <td>{extra.name}</td>
                  <td>{extra.quantity > 1 ? `x ${extra.quantity}` : ""}</td>
                  <td className="adm-num">{money(extra.unitPrice * extra.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="adm-card">
        <h2>Staff notes</h2>
        <p className="adm-muted adm-small">Only staff see this. The guest never does.</p>
        <form action={notesAction}>
          <input type="hidden" name="code" value={r.code} />
          <label htmlFor="adminNotes" className="adm-small">
            Notes
          </label>
          <textarea id="adminNotes" name="adminNotes" defaultValue={r.adminNotes} maxLength={2000} />
          <div className="adm-actions">
            <button className="adm-btn adm-btn--quiet" type="submit">
              Save notes
            </button>
          </div>
        </form>
      </section>

      {r.status !== "cancelled" && (
        <section className="adm-card" id="cancel">
          <h2>Cancel this booking</h2>
          <details open={Boolean(r.cancelRequestedAt)}>
            <summary className="adm-small">Show cancel options</summary>
            <form action={cancelAction}>
              <input type="hidden" name="code" value={r.code} />
              <p>The rooms go back on sale at once. A cancelled booking can&apos;t be switched back on; make a new booking instead.</p>
              <label className="adm-check">
                <input type="checkbox" name="notify" defaultChecked /> Email the guest that the booking was cancelled
              </label>
              <div className="adm-actions">
                <button className="adm-btn adm-btn--danger" type="submit">
                  Yes, cancel booking {r.code}
                </button>
              </div>
            </form>
          </details>
        </section>
      )}
    </>
  );
}
