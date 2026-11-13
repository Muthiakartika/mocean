import Link from "next/link";
import { property } from "@/config/property";
import { getDb } from "@/lib/db";
import { listRoomTypes, listSeasonRanges } from "@/lib/booking/native/admin-store";
import { seasonRuns, type Season } from "@/lib/booking/native/engine";
import { loadSettings } from "@/lib/booking/native/settings";
import { addDays, formatDay, nightsBetween, resortToday } from "@/lib/booking/stay";
import { addSeasonAction, copySeasonsAction, removeSeasonAction, savePricesAction, saveSettingsAction } from "../../actions";
import MoneyInput from "../../money-input";
import { Flash, one } from "../../ui";

const SEASONS: { key: Season; label: string; price: "priceLow" | "priceShoulder" | "priceHigh" }[] = [
  { key: "low", label: "Low season", price: "priceLow" },
  { key: "shoulder", label: "Shoulder season", price: "priceShoulder" },
  { key: "high", label: "High season", price: "priceHigh" },
];
const SEASON_LABEL: Record<Season, string> = { low: "Low", shoulder: "Shoulder", high: "High" };
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const shortDay = (day: string) => formatDay(day, { weekday: undefined });

/**
 * What a night costs: one table of prices per room type and season, the season dates of a year (with a bar of the whole
 * year, so the owner sees at a glance which months are high season), and the long-stay discount, tax and holding time.
 * Room photos and text are on /admin/rooms/.
 */
export default async function PricesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const db = await getDb();
  const [types, seasons, settings] = await Promise.all([listRoomTypes(db), listSeasonRanges(db), loadSettings(db)]);
  const currency = property.currency;

  const today = resortToday();
  const thisYear = Number(today.slice(0, 4));
  const asked = Number(one(query.year));
  const year = Number.isInteger(asked) && asked >= 2000 && asked <= 2100 ? asked : thisYear;
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year + 1}-01-01`;

  const runs = seasonRuns(year, seasons);
  const nightsOf = (season: Season) => runs.filter((run) => run.season === season).reduce((sum, run) => sum + run.days, 0);
  const shown = seasons.filter((range) => range.startsOn < yearEnd && range.endsOn > yearStart);
  const canCopy = seasons.some((range) => range.startsOn.startsWith(`${year}-`)) && !seasons.some((range) => range.startsOn.startsWith(`${year + 1}-`));
  const monthDays = MONTHS.map((_, index) => nightsBetween(`${year}-${String(index + 1).padStart(2, "0")}-01`, index === 11 ? yearEnd : `${year}-${String(index + 2).padStart(2, "0")}-01`));
  const todayAt = today.startsWith(`${year}-`) ? nightsBetween(yearStart, today) : null;
  const daysInYear = nightsBetween(yearStart, yearEnd);

  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Prices</h1>
          <p className="adm-muted">
            A night costs the price of its season. Prices are per room per night for two guests, in {currency}, with breakfast, tax and service included.
            New prices apply to new searches at once; bookings already made keep their price.
          </p>
        </div>
      </div>
      <Flash done={one(query.done)} error={one(query.error)} />

      {seasons.length === 0 && (
        <p className="adm-flash adm-flash--warn" role="note">
          No season dates are set, so every night is priced as low season. Add the high and shoulder season dates under Seasons.
        </p>
      )}

      <section className="adm-card" aria-labelledby="prices-title" id="prices">
        <div className="adm-section-head">
          <h2 id="prices-title">Price per night</h2>
          <p className="adm-muted">Change any price, then press Save prices once.</p>
        </div>
        <form action={savePricesAction}>
          <table className="adm-price-table">
            <thead>
              <tr>
                <th scope="col">Room type</th>
                {SEASONS.map((season) => (
                  <th scope="col" key={season.key}>
                    <span className={`adm-season-dot adm-season-dot--${season.key}`} aria-hidden="true" />
                    {season.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {types.map((type) => (
                <tr key={type.id} id={`price-${type.id}`}>
                  <th scope="row">
                    <span className="adm-price-room">
                      <span className="adm-room-thumb">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {type.photos[0] ? <img src={type.photos[0]} alt="" loading="lazy" /> : <span>No photo</span>}
                      </span>
                      <span className="adm-room-title">
                        <strong>{type.name}</strong>
                        <span className="adm-muted">
                          {type.units} room{type.units === 1 ? "" : "s"}
                          {type.active ? "" : " · hidden from the website"}
                        </span>
                      </span>
                    </span>
                  </th>
                  {SEASONS.map((season) => (
                    <td key={season.key}>
                      <label className="adm-price-label" htmlFor={`${season.key}-${type.id}`}>
                        <span className={`adm-season-dot adm-season-dot--${season.key}`} aria-hidden="true" />
                        {season.label}
                        <span className="sr-only">, {type.name}</span>
                      </label>
                      <MoneyInput id={`${season.key}-${type.id}`} name={`${season.key}-${type.id}`} defaultValue={type[season.price]} currency={currency} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="adm-actions">
            <button className="adm-btn" type="submit">
              Save prices
            </button>
          </div>
        </form>
      </section>

      <section className="adm-card" aria-labelledby="seasons-title" id="seasons">
        <div className="adm-season-head">
          <div>
            <h2 id="seasons-title">Seasons in {year}</h2>
            <p className="adm-muted">Add the dates of high and shoulder season. Every other night is low season. Where two ranges overlap, high season wins.</p>
          </div>
          <nav className="adm-year-nav" aria-label="Year">
            <Link className="adm-btn adm-btn--quiet adm-btn--sm" href={`/admin/rates/?year=${year - 1}#seasons`}>
              ‹ {year - 1}
            </Link>
            {year !== thisYear && (
              <Link className="adm-btn adm-btn--quiet adm-btn--sm" href="/admin/rates/#seasons">
                This year
              </Link>
            )}
            <Link className="adm-btn adm-btn--quiet adm-btn--sm" href={`/admin/rates/?year=${year + 1}#seasons`}>
              {year + 1} ›
            </Link>
          </nav>
        </div>

        <div className="adm-year">
          <div className="adm-year-track" aria-hidden="true">
            {runs.map((run) => (
              <span
                key={run.startsOn}
                className={`adm-year-run adm-year-run--${run.season}`}
                style={{ flexGrow: run.days }}
                title={`${SEASON_LABEL[run.season]} season: ${shortDay(run.startsOn)} to ${shortDay(addDays(run.endsOn, -1))}`}
              >
                {run.days >= 24 && <span>{SEASON_LABEL[run.season]}</span>}
              </span>
            ))}
            {todayAt !== null && <span className="adm-year-today" style={{ left: `${((todayAt + 0.5) / daysInYear) * 100}%` }} title="Today" />}
          </div>
          <div className="adm-year-months" aria-hidden="true">
            {MONTHS.map((month, index) => (
              <span key={month} style={{ flexGrow: monthDays[index] }}>
                {month}
              </span>
            ))}
          </div>
          <ul className="adm-year-sum">
            {SEASONS.map((season) => (
              <li key={season.key}>
                <span className={`adm-season-dot adm-season-dot--${season.key}`} aria-hidden="true" />
                <strong>{season.label}</strong> {nightsOf(season.key)} nights
              </li>
            ))}
          </ul>
        </div>

        {shown.length === 0 ? (
          <p className="adm-muted">No high or shoulder season dates in {year} yet, so every night of {year} is low season.</p>
        ) : (
          <div className="adm-scroll">
            <table>
              <thead>
                <tr>
                  <th>Season</th>
                  <th>First night</th>
                  <th>Last night</th>
                  <th className="adm-num">Nights</th>
                  <th>Label</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {shown.map((range) => (
                  <tr key={range.id}>
                    <td>
                      <span className={`adm-season-tag adm-season-tag--${range.season}`}>{SEASON_LABEL[range.season]}</span>
                    </td>
                    <td>{shortDay(range.startsOn)}</td>
                    <td>{shortDay(addDays(range.endsOn, -1))}</td>
                    <td className="adm-num">{nightsBetween(range.startsOn, range.endsOn)}</td>
                    <td>{range.label}</td>
                    <td>
                      <form action={removeSeasonAction}>
                        <input type="hidden" name="id" value={range.id} />
                        <input type="hidden" name="year" value={year} />
                        <button className="adm-btn adm-btn--quiet adm-btn--sm" type="submit">
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

        {canCopy && (
          <form action={copySeasonsAction} className="adm-season-copy">
            <input type="hidden" name="year" value={year} />
            <p className="adm-muted adm-small">{year + 1} has no season dates yet. Start from the same dates as {year}, then adjust what moves.</p>
            <button className="adm-btn adm-btn--quiet" type="submit">
              Copy {year}&apos;s dates to {year + 1}
            </button>
          </form>
        )}

        <form action={addSeasonAction} className="adm-season-add">
          <h3>Add season dates</h3>
          <input type="hidden" name="year" value={year} />
          <div className="adm-fields">
            <div>
              <label htmlFor="season">Season</label>
              <select id="season" name="season" defaultValue="high">
                <option value="high">High season</option>
                <option value="shoulder">Shoulder season</option>
              </select>
            </div>
            <div>
              <label htmlFor="season-from">First night</label>
              <input id="season-from" name="from" type="date" required />
            </div>
            <div>
              <label htmlFor="season-until">Last night</label>
              <input id="season-until" name="until" type="date" required />
            </div>
            <div>
              <label htmlFor="season-label">
                Label <span className="adm-label-hint">optional, e.g. Christmas</span>
              </label>
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
          {property.settingsNote && (
            <p className="adm-muted adm-small" style={{ marginTop: 10 }}>
              {property.settingsNote}
            </p>
          )}
          <div className="adm-actions">
            <button className="adm-btn" type="submit">
              Save settings
            </button>
          </div>
        </form>
      </section>

      <p className="adm-muted adm-small">
        Photos, descriptions and the number of rooms are on <Link href="/admin/rooms/">Rooms</Link>.
      </p>
    </>
  );
}
