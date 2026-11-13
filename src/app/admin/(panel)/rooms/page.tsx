import Link from "next/link";
import { property } from "@/config/property";
import { getDb } from "@/lib/db";
import { listAddOns, listRoomTypes } from "@/lib/booking/native/admin-store";
import { formatMoney } from "@/lib/booking/stay";
import { createAddOnAction, saveAddOnAction, saveRoomTypeAction } from "../../actions";
import { ChevronDownIcon } from "../../icons";
import MoneyInput from "../../money-input";
import { Flash, one } from "../../ui";
import { PhotoTile, PhotoUpload } from "./photos";

/**
 * What guests see of each room type (photos, name, description, features), how many rooms there are, and the extras
 * (transfers). Prices per season are on the Prices page (/admin/rates/). Each room type is a panel that opens; after a
 * save the page comes back with that panel open (?room=<id>).
 */
export default async function RoomsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const openRoom = one(query.room);
  const db = await getDb();
  const [types, addOns] = await Promise.all([listRoomTypes(db), listAddOns(db)]);
  const currency = property.currency;

  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Rooms</h1>
          <p className="adm-muted">
            What guests see of each room on the booking page, and how many rooms there are. Prices are on <Link href="/admin/rates/">Prices</Link>.
          </p>
        </div>
      </div>
      <Flash done={one(query.done)} error={one(query.error)} />

      <section className="adm-card" aria-labelledby="types">
        <div className="adm-section-head">
          <h2 id="types">Room types</h2>
          <p className="adm-muted">Open a room to change its photos, its text and how many rooms there are.</p>
        </div>
        <div className="adm-rooms">
          {types.map((type) => {
            const cover = type.photos[0];
            const low = Math.min(type.priceLow, type.priceShoulder, type.priceHigh);
            return (
              <details key={type.id} id={`room-${type.id}`} className="adm-room" open={openRoom === type.id}>
                <summary className="adm-room-summary">
                  <span className="adm-room-thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {cover ? <img src={cover} alt="" loading="lazy" /> : <span>No photo</span>}
                  </span>
                  <span className="adm-room-title">
                    <strong>{type.name}</strong>
                    <span className="adm-muted">
                      {type.units} room{type.units === 1 ? "" : "s"} · up to {type.maxGuests} guest{type.maxGuests === 1 ? "" : "s"} · {type.photos.length} photo
                      {type.photos.length === 1 ? "" : "s"}
                    </span>
                  </span>
                  <span className="adm-room-price">
                    from {formatMoney(low)}
                    <small>per night</small>
                  </span>
                  <span className={`adm-badge ${type.active ? "adm-badge--confirmed" : "adm-badge--cancelled"}`}>{type.active ? "On the website" : "Hidden"}</span>
                  <ChevronDownIcon className="adm-icon adm-room-chevron" />
                </summary>

                <div className="adm-room-body">
                  <div className="adm-room-photos">
                    <h3>Photos</h3>
                    <p className="adm-muted adm-small">The cover is the photo guests see on the room&apos;s card; the others show under &quot;Room details&quot;.</p>
                    <ul className="adm-photo-grid">
                      {type.photos.map((url, index) => (
                        <PhotoTile key={url} roomTypeId={type.id} url={url} index={index} roomName={type.name} />
                      ))}
                      <li>
                        <PhotoUpload roomTypeId={type.id} roomName={type.name} />
                      </li>
                    </ul>
                  </div>

                  <form action={saveRoomTypeAction} className="adm-room-form">
                    <input type="hidden" name="id" value={type.id} />
                    <h3>Details</h3>
                    <div className="adm-room-grid">
                      <div className="adm-span-2">
                        <label htmlFor={`name-${type.id}`}>Name</label>
                        <input id={`name-${type.id}`} name="name" type="text" maxLength={120} defaultValue={type.name} required />
                      </div>
                      <div className="adm-span-2">
                        <label htmlFor={`description-${type.id}`}>Description</label>
                        <textarea id={`description-${type.id}`} name="description" rows={4} maxLength={2000} defaultValue={type.description} />
                      </div>
                      <div className="adm-span-2">
                        <label htmlFor={`features-${type.id}`}>
                          Features <span className="adm-label-hint">one per line</span>
                        </label>
                        <textarea id={`features-${type.id}`} name="features" rows={4} maxLength={2000} defaultValue={type.features.join("\n")} />
                      </div>
                      <div>
                        <label htmlFor={`units-${type.id}`}>Rooms of this type</label>
                        <input id={`units-${type.id}`} name="units" type="number" min={0} max={100} defaultValue={type.units} required />
                      </div>
                      <div>
                        <label htmlFor={`guests-${type.id}`}>Most guests in one room</label>
                        <input id={`guests-${type.id}`} name="maxGuests" type="number" min={1} max={20} defaultValue={type.maxGuests} required />
                      </div>
                    </div>
                    <p className="adm-muted adm-small adm-room-note">
                      Prices per night: <Link href={`/admin/rates/#price-${type.id}`}>change them on Prices</Link>.
                    </p>

                    <div className="adm-actions">
                      <label className="adm-check">
                        <input type="checkbox" name="active" defaultChecked={type.active} /> Offered on the website
                      </label>
                      <button className="adm-btn" type="submit">
                        Save {type.name}
                      </button>
                    </div>
                  </form>
                </div>
              </details>
            );
          })}
        </div>
      </section>

      <section className="adm-card" aria-labelledby="extras-title" id="extras">
        <div className="adm-section-head">
          <h2 id="extras-title">Extras (transfers)</h2>
          <p className="adm-muted">Offered to guests after they choose their rooms.</p>
        </div>
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
                <MoneyInput id={`addon-price-${addOn.id}`} name="price" defaultValue={addOn.price} currency={currency} />
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
              <MoneyInput id="new-addon-price" name="price" currency={currency} />
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
