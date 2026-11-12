import Link from "next/link";
import { getDb } from "@/lib/db";
import { loadReport, shiftMonth } from "@/lib/booking/native/reports";
import { formatMoney, parseDay, resortToday } from "@/lib/booking/stay";
import { MonthBars, RankBars, type MonthPoint } from "../../charts";
import { ArrivalIcon, BedIcon, CalendarIcon, RatesIcon } from "../../icons";
import { Ring, one } from "../../ui";

const MONTHS = 12;
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const whole = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const monthName = (month: string, style: "short" | "long") =>
  new Intl.DateTimeFormat("en-US", { month: style, ...(style === "long" ? { year: "numeric" } : {}), timeZone: "UTC" }).format(parseDay(`${month}-01`)!);
const plural = (count: number, word: string) => `${whole.format(count)} ${word}${count === 1 ? "" : "s"}`;

/** Guests, booking value and occupancy over twelve months (the last six and the next six by default). */
export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const thisMonth = resortToday().slice(0, 7);
  const asked = one((await searchParams).from);
  const first = /^\d{4}-(0[1-9]|1[0-2])$/.test(asked) ? asked : shiftMonth(thisMonth, -5);
  const last = shiftMonth(first, MONTHS - 1);
  const report = await loadReport(await getDb(), first, MONTHS);
  const { totals } = report;

  const point = (month: (typeof report.months)[number], value: number, detail: string[]): MonthPoint => ({
    label: monthName(month.month, "long"),
    short: monthName(month.month, "short"),
    value,
    ahead: month.month > thisMonth,
    detail,
  });
  const guests = report.months.map((month) => point(month, month.guests, [plural(month.guests, "guest"), plural(month.arrivals, "booking")]));
  const value = report.months.map((month) =>
    point(month, month.value, [formatMoney(month.value), month.arrivals ? `${formatMoney(month.value / month.arrivals)} per booking` : "No bookings"]),
  );
  const occupancy = report.months.map((month) => {
    const share = month.capacity ? (month.roomNights / month.capacity) * 100 : 0;
    return point(month, share, [`${whole.format(share)}% of room nights`, `${month.roomNights} of ${month.capacity} room nights`]);
  });
  const averageGuests = totals.guests / MONTHS;
  const occupancyShare = totals.capacity ? totals.roomNights / totals.capacity : 0;
  const countryName = new Intl.DisplayNames(["en"], { type: "region" });

  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Reports</h1>
          <p className="adm-muted">
            Confirmed bookings from {monthName(first, "long")} to {monthName(last, "long")}. Guests and value count in the month the guests arrive.
          </p>
        </div>
        <div className="adm-actions" style={{ marginTop: 0 }}>
          <Link className="adm-btn adm-btn--quiet" href={`/admin/reports/?from=${shiftMonth(first, -6)}`}>
            Earlier
          </Link>
          <Link className="adm-btn adm-btn--quiet" href="/admin/reports/">
            Around today
          </Link>
          <Link className="adm-btn adm-btn--quiet" href={`/admin/reports/?from=${shiftMonth(first, 6)}`}>
            Later
          </Link>
        </div>
      </div>

      <div className="adm-stats">
        <div className="adm-stat">
          <span className="adm-stat-icon adm-tint-0">
            <ArrivalIcon />
          </span>
          <span className="adm-stat-value">{totals.guests}</span>
          <span className="adm-stat-label">
            Guests arriving <span className="adm-stat-sub">{whole.format(averageGuests)} a month on average</span>
          </span>
        </div>
        <div className="adm-stat">
          <span className="adm-stat-icon adm-tint-1">
            <RatesIcon />
          </span>
          <span className="adm-stat-value adm-stat-value--money">IDR {compact.format(totals.value)}</span>
          <span className="adm-stat-label">
            Booking value{" "}
            {totals.bookings > 0 && <span className="adm-stat-sub">{formatMoney(totals.value / totals.bookings)} per booking</span>}
          </span>
        </div>
        <div className="adm-stat">
          <span className="adm-stat-icon adm-tint-2">
            <CalendarIcon />
          </span>
          <span className="adm-stat-value">
            {totals.bookings ? whole.format(totals.nights / totals.bookings) : 0}
            <span className="adm-stat-of"> nights</span>
          </span>
          <span className="adm-stat-label">
            Average stay <span className="adm-stat-sub">{plural(totals.bookings, "booking")}</span>
          </span>
        </div>
        <div className="adm-stat adm-stat--ring">
          <Ring value={occupancyShare} label={`${Math.round(occupancyShare * 100)}% of room nights booked`} />
          <span className="adm-stat-value">
            {totals.roomNights}
            <span className="adm-stat-of">/{totals.capacity}</span>
          </span>
          <span className="adm-stat-label">
            Room nights booked <span className="adm-stat-sub">{whole.format(occupancyShare * 100)}% of all room nights</span>
          </span>
        </div>
      </div>

      <section className="adm-card" aria-labelledby="chart-guests">
        <div className="adm-card-head">
          <h2 id="chart-guests">Guests arriving per month</h2>
        </div>
        <MonthBars
          id="guests"
          title="Guests arriving per month"
          points={guests}
          axis={(tick) => whole.format(tick)}
          average={{ value: averageGuests, label: `Average ${whole.format(averageGuests)}` }}
        />
      </section>

      <section className="adm-card" aria-labelledby="chart-value">
          <div className="adm-card-head">
            <h2 id="chart-value">Booking value per month</h2>
          </div>
          <MonthBars id="value" title="Booking value per month, IDR" points={value} axis={(tick) => compact.format(tick)} />
          <p className="adm-muted adm-small">IDR, tax and service included. What the bookings are worth, not money received yet.</p>
      </section>
      <section className="adm-card" aria-labelledby="chart-occupancy">
          <div className="adm-card-head">
            <h2 id="chart-occupancy">Occupancy per month</h2>
          </div>
          <MonthBars id="occupancy" title="Occupancy per month, percent of room nights" points={occupancy} axis={(tick) => `${whole.format(tick)}%`} />
          <p className="adm-muted adm-small">Room nights booked out of all rooms times the days of the month.</p>
      </section>

      <div className="adm-grid">
        <section className="adm-card" aria-labelledby="by-room">
          <div className="adm-card-head">
            <h2 id="by-room">
              <BedIcon /> Room nights per room type
            </h2>
          </div>
          <RankBars rows={report.roomTypes.map((row) => ({ label: row.name, value: row.roomNights, display: whole.format(row.roomNights) }))} empty="No confirmed stays in these months." />
        </section>
        <section className="adm-card" aria-labelledby="by-country">
          <div className="adm-card-head">
            <h2 id="by-country">Where guests come from</h2>
          </div>
          <RankBars
            rows={report.countries.slice(0, 8).map((row) => ({
              label: row.code === "??" ? "Not given" : (countryName.of(row.code) ?? row.code),
              value: row.guests,
              display: plural(row.guests, "guest"),
            }))}
            empty="No confirmed arrivals in these months."
          />
        </section>
      </div>

      <section className="adm-card">
        <details>
          <summary>The figures as a table</summary>
          <div className="adm-scroll" style={{ marginTop: 14 }}>
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th className="adm-num">Bookings</th>
                  <th className="adm-num">Guests</th>
                  <th className="adm-num">Booking value</th>
                  <th className="adm-num">Room nights</th>
                  <th className="adm-num">Occupancy</th>
                </tr>
              </thead>
              <tbody>
                {report.months.map((month) => (
                  <tr key={month.month}>
                    <td>
                      {monthName(month.month, "long")}
                      {month.month > thisMonth && <span className="adm-muted adm-small"> (booked so far)</span>}
                    </td>
                    <td className="adm-num">{month.arrivals}</td>
                    <td className="adm-num">{month.guests}</td>
                    <td className="adm-num">{formatMoney(month.value)}</td>
                    <td className="adm-num">
                      {month.roomNights} / {month.capacity}
                    </td>
                    <td className="adm-num">{month.capacity ? whole.format((month.roomNights / month.capacity) * 100) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>
    </>
  );
}
