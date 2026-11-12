import Link from "next/link";
import { getDb } from "@/lib/db";
import { calendarUsage } from "@/lib/booking/native/store";
import { parseDay, resortToday } from "@/lib/booking/stay";
import { one } from "../../ui";

const pad = (value: number) => String(value).padStart(2, "0");

function shiftMonth(month: string, by: number) {
  const [year, number] = month.split("-").map(Number);
  const index = year * 12 + (number - 1) + by;
  return `${Math.floor(index / 12)}-${pad((index % 12) + 1)}`;
}

/** Free rooms per room type per day. Colour: all free, some free, none free. "b" marks rooms blocked by staff. */
export default async function CalendarPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const today = resortToday();
  const asked = one(await searchParams.then((query) => query.month));
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(asked) ? asked : today.slice(0, 7);
  const from = `${month}-01`;
  const to = `${shiftMonth(month, 1)}-01`;
  const calendar = await calendarUsage(await getDb(), from, to);
  const title = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(parseDay(from)!);

  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Calendar: {title}</h1>
          <p className="adm-muted">Rooms still free each night, per room type. A night is counted on the day a guest sleeps there.</p>
        </div>
        <div className="adm-actions" style={{ marginTop: 0 }}>
          <Link className="adm-btn adm-btn--quiet" href={`/admin/calendar/?month=${shiftMonth(month, -1)}`}>
            Previous month
          </Link>
          <Link className="adm-btn adm-btn--quiet" href="/admin/calendar/">
            This month
          </Link>
          <Link className="adm-btn adm-btn--quiet" href={`/admin/calendar/?month=${shiftMonth(month, 1)}`}>
            Next month
          </Link>
        </div>
      </div>

      <section className="adm-card">
        <div className="adm-scroll">
          <table className="adm-cal">
            <thead>
              <tr>
                <th scope="col">Room type</th>
                {calendar.days.map((day) => (
                  <th key={day} scope="col" className={day === today ? "adm-cal-today" : undefined}>
                    {Number(day.slice(8))}
                    <div className="adm-muted">{new Intl.DateTimeFormat("en-US", { weekday: "narrow", timeZone: "UTC" }).format(parseDay(day)!)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {calendar.types.map((type) => (
                <tr key={type.id}>
                  <td>
                    {type.name}
                    <div className="adm-muted adm-small">{type.units} room{type.units === 1 ? "" : "s"}</div>
                  </td>
                  {type.perDay.map((cell) => (
                    <td
                      key={cell.day}
                      className={`${cell.free === 0 ? "adm-cal-full" : cell.free < type.units ? "adm-cal-some" : "adm-cal-free"}${cell.day === today ? " adm-cal-today" : ""}`}
                      title={`${cell.day}: ${cell.booked} booked, ${cell.blocked} blocked, ${cell.free} free`}
                    >
                      {cell.free}
                      {cell.blocked > 0 && <sup>b</sup>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="adm-muted adm-small" style={{ marginTop: 12, marginBottom: 0 }}>
          Teal: all rooms free. Amber: some free. Red: none free. Navy outline: today. Open <Link href="/admin/reservations/">Bookings</Link> to see who is staying.
        </p>
      </section>
    </>
  );
}
