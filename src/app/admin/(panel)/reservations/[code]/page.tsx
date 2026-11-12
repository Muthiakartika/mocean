import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { displayStatus, getReservation } from "@/lib/booking/native/store";
import { cancelAction, confirmAction, notesAction } from "../../../actions";
import { Flash, StatusBadge, money, one, resortTime, stayLabel } from "../../../ui";

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
