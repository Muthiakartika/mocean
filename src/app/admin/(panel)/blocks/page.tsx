import { getDb } from "@/lib/db";
import { listBlocks, listRoomTypes } from "@/lib/booking/native/admin-store";
import { addDays, formatDay, resortToday } from "@/lib/booking/stay";
import { addBlockAction, removeBlockAction } from "../../actions";
import { Flash, one } from "../../ui";

/** Taking rooms out of sale (repairs, owner use, rooms sold somewhere else). Guests can't book blocked nights. */
export default async function BlocksPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const db = await getDb();
  const [blocks, types] = await Promise.all([listBlocks(db), listRoomTypes(db)]);
  const today = resortToday();

  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Block dates</h1>
          <p className="adm-muted">Rooms you block can&apos;t be booked on the website. Blocking does not cancel bookings that already exist.</p>
        </div>
      </div>
      <Flash done={one(query.done)} error={one(query.error)} />

      <section className="adm-card">
        <h2>Block rooms</h2>
        <form action={addBlockAction}>
          <div className="adm-fields">
            <div>
              <label htmlFor="roomTypeId">Room type</label>
              <select id="roomTypeId" name="roomTypeId" required>
                {types.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} ({type.units})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="from">First night</label>
              <input id="from" name="from" type="date" min={today} required />
            </div>
            <div>
              <label htmlFor="until">Last night</label>
              <input id="until" name="until" type="date" min={today} required />
            </div>
            <div>
              <label htmlFor="units">How many rooms</label>
              <input id="units" name="units" type="number" min={1} defaultValue={1} required />
            </div>
            <div>
              <label htmlFor="reason">Reason (optional)</label>
              <input id="reason" name="reason" type="text" maxLength={200} />
            </div>
          </div>
          <div className="adm-actions">
            <button className="adm-btn" type="submit">
              Block these nights
            </button>
          </div>
        </form>
      </section>

      <section className="adm-card">
        <h2>Blocked now and later</h2>
        {blocks.length === 0 ? (
          <p className="adm-muted">No dates are blocked.</p>
        ) : (
          <div className="adm-scroll">
            <table>
              <thead>
                <tr>
                  <th>Room type</th>
                  <th>Nights</th>
                  <th>Rooms</th>
                  <th>Reason</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {blocks.map(({ block, roomName }) => (
                  <tr key={block.id}>
                    <td>{roomName}</td>
                    <td>
                      {formatDay(block.startsOn)} to {formatDay(addDays(block.endsOn, -1))}
                      {block.endsOn <= today && <span className="adm-muted adm-small"> (past)</span>}
                    </td>
                    <td>{block.units}</td>
                    <td>{block.reason}</td>
                    <td>
                      <form action={removeBlockAction}>
                        <input type="hidden" name="id" value={block.id} />
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
      </section>
    </>
  );
}
