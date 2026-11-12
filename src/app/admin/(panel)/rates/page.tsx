import { getDb } from "@/lib/db";
import { listAddOns, listRoomTypes, listSeasonRanges } from "@/lib/booking/native/admin-store";
import { loadSettings } from "@/lib/booking/native/settings";
import { addDays, formatDay } from "@/lib/booking/stay";
import { addSeasonAction, createAddOnAction, removeSeasonAction, saveAddOnAction, saveRoomTypeAction, saveSettingsAction } from "../../actions";
import { Flash, one } from "../../ui";

/** Room types and nightly prices, season dates, long-stay discount, hold time and extras. */
export default async function RatesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const db = await getDb();
  const [types, seasons, addOns, settings] = await Promise.all([listRoomTypes(db), listSeasonRanges(db), listAddOns(db), loadSettings(db)]);

  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Rooms and rates</h1>
          <p className="adm-muted">
            Prices are per night for two guests, in rupiah, with breakfast, tax and service included. Changes apply to new searches at once; bookings
            that already exist keep the price they were made at.
          </p>
        </div>
      </div>
      <Flash done={one(query.done)} error={one(query.error)} />

      {seasons.length === 0 && (
        <p className="adm-flash adm-flash--warn" role="note">
          No season dates are set, so every night is priced as low season. Add the shoulder and high season dates below before guests use the booking page.
        </p>
      )}

      <section className="adm-card" aria-labelledby="types">
        <h2 id="types">Room types</h2>
        {types.map((type) => (
          <form key={type.id} action={saveRoomTypeAction} className="adm-card" style={{ background: "#fafbfc" }}>
            <input type="hidden" name="id" value={type.id} />
            <h3 style={{ margin: "0 0 10px", fontSize: 15 }}>{type.name}</h3>
            <div className="adm-fields">
              <div>
                <label htmlFor={`units-${type.id}`}>Rooms</label>
                <input id={`units-${type.id}`} name="units" type="number" min={0} defaultValue={type.units} required />
              </div>
              <div>
                <label htmlFor={`guests-${type.id}`}>Max guests</label>
                <input id={`guests-${type.id}`} name="maxGuests" type="number" min={1} defaultValue={type.maxGuests} required />
              </div>
              <div>
                <label htmlFor={`low-${type.id}`}>Low season</label>
                <input id={`low-${type.id}`} name="priceLow" type="number" min={0} step={1} defaultValue={type.priceLow} required />
              </div>
              <div>
                <label htmlFor={`shoulder-${type.id}`}>Shoulder season</label>
                <input id={`shoulder-${type.id}`} name="priceShoulder" type="number" min={0} step={1} defaultValue={type.priceShoulder} required />
              </div>
              <div>
                <label htmlFor={`high-${type.id}`}>High season</label>
                <input id={`high-${type.id}`} name="priceHigh" type="number" min={0} step={1} defaultValue={type.priceHigh} required />
              </div>
              <div>
                <label className="adm-check">
                  <input type="checkbox" name="active" defaultChecked={type.active} /> Offered on the website
                </label>
              </div>
              <div>
                <button className="adm-btn" type="submit">
                  Save
                </button>
              </div>
            </div>
          </form>
        ))}
      </section>

      <section className="adm-card" aria-labelledby="seasons">
        <h2 id="seasons">Season dates</h2>
        <p className="adm-muted">Any night that is in no range below is low season. Where a shoulder and a high range overlap, high season wins.</p>
        {seasons.length > 0 && (
          <div className="adm-scroll" style={{ marginBottom: 16 }}>
            <table>
              <thead>
                <tr>
                  <th>Season</th>
                  <th>First day</th>
                  <th>Last day</th>
                  <th>Label</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {seasons.map((range) => (
                  <tr key={range.id}>
                    <td>{range.season}</td>
                    <td>{formatDay(range.startsOn)}</td>
                    <td>{formatDay(addDays(range.endsOn, -1))}</td>
                    <td>{range.label}</td>
                    <td>
                      <form action={removeSeasonAction}>
                        <input type="hidden" name="id" value={range.id} />
                        <button className="adm-btn adm-btn--quiet" type="submit">
                          Remove
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <form action={addSeasonAction}>
          <div className="adm-fields">
            <div>
              <label htmlFor="season">Season</label>
              <select id="season" name="season" defaultValue="high">
                <option value="high">High season</option>
                <option value="shoulder">Shoulder season</option>
              </select>
            </div>
            <div>
              <label htmlFor="season-from">First day</label>
              <input id="season-from" name="from" type="date" required />
            </div>
            <div>
              <label htmlFor="season-until">Last day</label>
              <input id="season-until" name="until" type="date" required />
            </div>
            <div>
              <label htmlFor="season-label">Label (optional)</label>
              <input id="season-label" name="label" type="text" maxLength={60} />
            </div>
            <div>
              <button className="adm-btn" type="submit">
                Add dates
              </button>
            </div>
          </div>
        </form>
      </section>

      <section className="adm-card" aria-labelledby="settings">
        <h2 id="settings">Discount, tax and holding time</h2>
        <form action={saveSettingsAction}>
          <div className="adm-fields">
            <div>
              <label htmlFor="extendedStayMinNights">Long-stay rate from (nights)</label>
              <input id="extendedStayMinNights" name="extendedStayMinNights" type="number" min={1} max={30} defaultValue={settings.extendedStayMinNights} required />
            </div>
            <div>
              <label htmlFor="extendedStayDiscountPct">Long-stay discount (%, 0 = off)</label>
              <input id="extendedStayDiscountPct" name="extendedStayDiscountPct" type="number" min={0} max={100} step="0.1" defaultValue={settings.extendedStayDiscountPct} required />
            </div>
            <div>
              <label htmlFor="taxPercent">Tax and service inside the prices (%)</label>
              <input id="taxPercent" name="taxPercent" type="number" min={0} max={100} step="0.1" defaultValue={Number((settings.includedTaxRate * 100).toFixed(2))} required />
            </div>
            <div>
              <label htmlFor="pendingHoldHours">A request holds its rooms for (hours)</label>
              <input id="pendingHoldHours" name="pendingHoldHours" type="number" min={1} max={720} defaultValue={settings.pendingHoldHours} required />
            </div>
          </div>
          <div className="adm-actions">
            <label className="adm-check">
              <input type="checkbox" name="autoConfirm" defaultChecked={settings.autoConfirm} /> Confirm website bookings at once, without waiting for staff
            </label>
          </div>
          <p className="adm-muted adm-small" style={{ marginTop: 10 }}>
            The 5% long-stay discount from 3 nights and the 22.1% tax and service are what the Cloudbeds booking page showed on 2026-11-11. Check them
            against the resort&apos;s own figures.
          </p>
          <div className="adm-actions">
            <button className="adm-btn" type="submit">
              Save settings
            </button>
          </div>
        </form>
      </section>

      <section className="adm-card" aria-labelledby="extras">
        <h2 id="extras">Extras (transfers)</h2>
        {addOns.map((addOn) => (
          <form key={addOn.id} action={saveAddOnAction} style={{ marginBottom: 12 }}>
            <input type="hidden" name="id" value={addOn.id} />
            <div className="adm-fields">
              <div>
                <label htmlFor={`addon-name-${addOn.id}`}>Name</label>
                <input id={`addon-name-${addOn.id}`} name="name" type="text" defaultValue={addOn.name} required />
              </div>
              <div>
                <label htmlFor={`addon-price-${addOn.id}`}>Price</label>
                <input id={`addon-price-${addOn.id}`} name="price" type="number" min={0} step={1} defaultValue={addOn.price} required />
              </div>
              <div>
                <label className="adm-check">
                  <input type="checkbox" name="active" defaultChecked={addOn.active} /> Offered
                </label>
              </div>
              <div>
                <button className="adm-btn adm-btn--quiet" type="submit">
                  Save
                </button>
              </div>
            </div>
          </form>
        ))}
        <form action={createAddOnAction}>
          <h3 style={{ margin: "16px 0 10px", fontSize: 15 }}>Add an extra</h3>
          <div className="adm-fields">
            <div>
              <label htmlFor="new-addon-name">Name</label>
              <input id="new-addon-name" name="name" type="text" required />
            </div>
            <div>
              <label htmlFor="new-addon-price">Price</label>
              <input id="new-addon-price" name="price" type="number" min={0} step={1} required />
            </div>
            <div>
              <button className="adm-btn" type="submit">
                Add extra
              </button>
            </div>
          </div>
        </form>
      </section>
    </>
  );
}
