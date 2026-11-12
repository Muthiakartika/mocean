import Link from "next/link";
import { getDb } from "@/lib/db";
import { loadAvailability } from "@/lib/booking/native/store";
import { checkQuery, resortToday } from "@/lib/booking/stay";
import { createManualAction } from "../../../actions";
import { Flash, money, one } from "../../../ui";

/**
 * A booking entered by staff, e.g. for a guest who wrote on WhatsApp. It is priced from the same rates and checked
 * against the same free rooms as a website booking, so it can't double-book a room.
 */
export default async function NewBooking({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const checkIn = one(query.checkin);
  const checkOut = one(query.checkout);

  let problem = "";
  let availability = null;
  if (checkIn && checkOut) {
    problem = checkQuery({ checkIn, checkOut, adults: 1, children: 0 }) ?? "";
    if (!problem) availability = await loadAvailability(await getDb(), { checkIn, checkOut, adults: 1, children: 0 });
  }

  return (
    <>
      <p className="adm-small">
        <Link href="/admin/reservations/">Back to bookings</Link>
      </p>
      <div className="adm-head">
        <div>
          <h1>New booking</h1>
          <p className="adm-muted">1. Choose the dates. 2. Choose rooms and enter the guest.</p>
        </div>
      </div>

      <Flash error={one(query.error) || problem} done={one(query.done)} />

      <form method="get" className="adm-card">
        <div className="adm-fields">
          <div>
            <label htmlFor="checkin">Check-in</label>
            <input id="checkin" name="checkin" type="date" min={resortToday()} defaultValue={checkIn} required />
          </div>
          <div>
            <label htmlFor="checkout">Check-out</label>
            <input id="checkout" name="checkout" type="date" min={resortToday()} defaultValue={checkOut} required />
          </div>
          <div>
            <button className="adm-btn" type="submit">
              Show free rooms
            </button>
          </div>
        </div>
      </form>

      {availability && (
        <form action={createManualAction}>
          <input type="hidden" name="checkin" value={availability.query.checkIn} />
          <input type="hidden" name="checkout" value={availability.query.checkOut} />

          <section className="adm-card">
            <h2>
              Rooms free for {availability.nights} night{availability.nights === 1 ? "" : "s"}
            </h2>
            {availability.rooms.length === 0 ? (
              <p className="adm-muted">Nothing is free for these dates.</p>
            ) : (
              <div className="adm-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Room type</th>
                      <th>How many</th>
                      <th>Rate</th>
                      <th>Adults per room</th>
                      <th>Children per room</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availability.rooms.map((room) => (
                      <tr key={room.roomTypeId}>
                        <td>
                          {room.name}
                          <div className="adm-muted adm-small">
                            {room.available} free · up to {room.maxGuests} guests
                          </div>
                        </td>
                        <td>
                          <input aria-label={`${room.name}: how many`} name={`qty_${room.roomTypeId}`} type="number" min={0} max={room.available} defaultValue={0} />
                        </td>
                        <td>
                          <select aria-label={`${room.name}: rate`} name={`rate_${room.roomTypeId}`}>
                            {room.rates.map((rate) => (
                              <option key={rate.rateId} value={rate.rateId.endsWith("-extended") ? "extended" : "standard"}>
                                {rate.name}: {money(rate.total)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input aria-label={`${room.name}: adults`} name={`adults_${room.roomTypeId}`} type="number" min={1} max={room.maxGuests} defaultValue={Math.min(2, room.maxGuests)} />
                        </td>
                        <td>
                          <input aria-label={`${room.name}: children`} name={`children_${room.roomTypeId}`} type="number" min={0} max={room.maxGuests - 1} defaultValue={0} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {availability.addOns.length > 0 && (
            <section className="adm-card">
              <h2>Extras</h2>
              <div className="adm-fields">
                {availability.addOns.map((addOn) => (
                  <div key={addOn.id}>
                    <label htmlFor={`addon_${addOn.id}`}>
                      {addOn.name} ({money(addOn.price)})
                    </label>
                    <input id={`addon_${addOn.id}`} name={`addon_${addOn.id}`} type="number" min={0} max={20} defaultValue={0} />
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="adm-card">
            <h2>Guest</h2>
            <div className="adm-fields">
              <div>
                <label htmlFor="firstName">First name</label>
                <input id="firstName" name="firstName" type="text" required />
              </div>
              <div>
                <label htmlFor="lastName">Last name</label>
                <input id="lastName" name="lastName" type="text" required />
              </div>
              <div>
                <label htmlFor="email">Email (optional)</label>
                <input id="email" name="email" type="email" />
              </div>
              <div>
                <label htmlFor="phone">Phone / WhatsApp (optional)</label>
                <input id="phone" name="phone" type="text" />
              </div>
              <div>
                <label htmlFor="country">Country code (optional)</label>
                <input id="country" name="country" type="text" maxLength={2} placeholder="ID" />
              </div>
            </div>
          </section>

          <section className="adm-card">
            <h2>Booking</h2>
            <div className="adm-fields">
              <div>
                <label htmlFor="status">Status</label>
                <select id="status" name="status" defaultValue="confirmed">
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending (holds the rooms for the usual hold time)</option>
                </select>
              </div>
              <div>
                <label htmlFor="total">Total price in IDR (optional)</label>
                <input id="total" name="total" type="number" min={0} step={1} placeholder="Leave empty for the website price" />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label htmlFor="adminNotes">Staff notes (optional)</label>
              <textarea id="adminNotes" name="adminNotes" maxLength={2000} />
            </div>
            <div className="adm-actions">
              <label className="adm-check">
                <input type="checkbox" name="notify" defaultChecked /> Email the guest the confirmation (confirmed bookings with an email address)
              </label>
            </div>
            <div className="adm-actions">
              <button className="adm-btn" type="submit">
                Save booking
              </button>
            </div>
          </section>
        </form>
      )}
    </>
  );
}
