import Link from "next/link";
import { getDb } from "@/lib/db";
import { calendarLanes, type CalendarBlock, type CalendarStay } from "@/lib/booking/native/store";
import { addDays, formatDay, nightsBetween, parseDay, resortToday } from "@/lib/booking/stay";
import { AlertIcon } from "../../icons";
import { one } from "../../ui";

/**
 * Who stays where: one row per room of each type, each stay a bar with the guest's name from the check-in night to the
 * last night before check-out (like the Cloudbeds calendar). Two weeks or four, moved with Earlier / Later / Today.
 * A bar opens its booking; a grey bar is a block and opens Block dates.
 */
const VIEWS = { "2w": 14, "4w": 28 } as const;
type View = keyof typeof VIEWS;

const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" });
const monthName = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });

export default async function CalendarPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const today = resortToday();
  const view: View = one(query.view) === "4w" ? "4w" : "2w";
  const length = VIEWS[view];
  const asked = one(query.from);
  const from = parseDay(asked) ? asked : today;
  const to = addDays(from, length);
  const board = await calendarLanes(await getDb(), from, to);

  const link = (start: string, nextView: View = view) => {
    const params = new URLSearchParams();
    if (start !== today) params.set("from", start);
    if (nextView !== "2w") params.set("view", nextView);
    const text = params.toString();
    return `/admin/calendar/${text ? `?${text}` : ""}`;
  };
  const last = addDays(to, -1);
  const range = `${formatDay(from, { weekday: undefined, year: from.slice(0, 4) === last.slice(0, 4) ? undefined : "numeric" })} to ${formatDay(last, { weekday: undefined })}`;
  const totalRooms = board.types.reduce((sum, type) => sum + type.units, 0);

  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Calendar</h1>
          <p className="adm-muted">{range}</p>
        </div>
        <div className="adm-board-nav">
          <nav className="adm-tabs" aria-label="How many weeks">
            <Link href={link(from, "2w")} aria-current={view === "2w" ? "page" : undefined}>
              2 weeks
            </Link>
            <Link href={link(from, "4w")} aria-current={view === "4w" ? "page" : undefined}>
              4 weeks
            </Link>
          </nav>
          <div className="adm-board-steps">
            <Link className="adm-btn adm-btn--quiet adm-btn--sm" href={link(addDays(from, -length))}>
              Earlier
            </Link>
            <Link className="adm-btn adm-btn--quiet adm-btn--sm" href={link(today)} aria-current={from === today ? "page" : undefined}>
              Today
            </Link>
            <Link className="adm-btn adm-btn--quiet adm-btn--sm" href={link(addDays(from, length))}>
              Later
            </Link>
          </div>
          <form method="get" className="adm-board-jump">
            {view !== "2w" && <input type="hidden" name="view" value={view} />}
            <label htmlFor="from" className="sr-only">
              Show from
            </label>
            <input id="from" name="from" type="date" defaultValue={from} required />
            <button className="adm-btn adm-btn--quiet adm-btn--sm" type="submit">
              Go
            </button>
          </form>
        </div>
      </div>

      <section className="adm-card adm-board-card">
        <ul className="adm-board-legend" aria-label="What the colours mean">
          <li>
            <span className="adm-board-key adm-board-key--confirmed" aria-hidden="true" />
            Confirmed stay
          </li>
          <li>
            <span className="adm-board-key adm-board-key--pending" aria-hidden="true" />
            Request waiting for you
          </li>
          <li>
            <span className="adm-board-key adm-board-key--block" aria-hidden="true" />
            Blocked (not for sale)
          </li>
          <li>
            <AlertIcon className="adm-board-alert" />
            Guest asked to cancel
          </li>
        </ul>

        {totalRooms === 0 ? (
          <p className="adm-muted">No rooms yet. Add them in Rooms and rates.</p>
        ) : (
          <div className="adm-board-scroll">
            <div className={`adm-board adm-board--${view}`} style={{ "--days": length } as React.CSSProperties}>
              <div className="adm-board-row adm-board-head" aria-hidden="true">
                <div className="adm-board-label" />
                <div className="adm-board-track">
                  {board.days.map((day, index) => {
                    const date = parseDay(day)!;
                    const showMonth = index === 0 || day.endsWith("-01");
                    return (
                      <div key={day} className={dayClass(day, today, "adm-board-day")}>
                        <span className="adm-board-wd">{showMonth ? monthName.format(date) : weekday.format(date)}</span>
                        <span className="adm-board-dn">{Number(day.slice(8))}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {board.types.map((type) => (
                <div key={type.id} className="adm-board-type">
                  <div className="adm-board-typehead">
                    <span className="adm-board-typename">{type.name}</span>
                    <span className="adm-muted">
                      {type.units} room{type.units === 1 ? "" : "s"}
                      {!type.active && " · not offered on the website"}
                    </span>
                  </div>
                  {type.lanes.map((lane, index) => (
                    <div key={index} className={`adm-board-row${lane.overflow ? " adm-board-row--over" : ""}`}>
                      <div className="adm-board-label">{lane.overflow ? "Over capacity" : `Room ${index + 1}`}</div>
                      <div className="adm-board-track">
                        {board.days.map((day, column) => (
                          <span key={day} className={dayClass(day, today, "adm-board-cell")} style={{ gridColumn: column + 1 }} />
                        ))}
                        {lane.items.map((item, itemIndex) => (
                          <Bar key={`${item.kind}-${item.kind === "stay" ? item.code : item.id}-${itemIndex}`} item={item} from={from} to={to} days={length} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="adm-muted adm-small adm-board-note">
          A bar runs from the check-in night to the last night before check-out. &quot;Room 1, 2…&quot; are rows of this calendar, not room numbers:
          the system counts free rooms per type and does not pick a room for a stay.
        </p>
      </section>
    </>
  );
}

function dayClass(day: string, today: string, base: string) {
  const weekend = [0, 6].includes(parseDay(day)!.getUTCDay());
  return `${base}${weekend ? ` ${base}--weekend` : ""}${day === today ? ` ${base}--today` : ""}`;
}

function Bar({ item, from, to, days }: { item: CalendarStay | CalendarBlock; from: string; to: string; days: number }) {
  const start = Math.max(0, nightsBetween(from, item.startsOn));
  const end = Math.min(days, nightsBetween(from, item.endsOn));
  const nights = nightsBetween(item.startsOn, item.endsOn);
  const dates = `${formatDay(item.startsOn, { weekday: undefined, year: undefined })} to ${formatDay(item.endsOn, { weekday: undefined, year: undefined })}, ${nights} night${nights === 1 ? "" : "s"}`;
  const style = { gridColumn: `${start + 1} / ${end + 1}` };
  const edges = `${item.startsOn < from ? " adm-stay--cut-start" : ""}${item.endsOn > to ? " adm-stay--cut-end" : ""}`;

  if (item.kind === "block") {
    const label = `Blocked${item.reason ? `: ${item.reason}` : ""}`;
    return (
      <Link href="/admin/blocks/" className={`adm-stay adm-stay--block${edges}`} style={style} title={`${label} (${dates})`} aria-label={`${label}, ${dates}`}>
        <span className="adm-stay-text">{label}</span>
      </Link>
    );
  }

  const status = item.status === "confirmed" ? "Confirmed" : "Waiting for you";
  const extra = item.cancelRequested ? ", guest asked to cancel" : "";
  return (
    <Link
      href={`/admin/reservations/${item.code}/`}
      className={`adm-stay adm-stay--${item.status}${edges}`}
      style={style}
      title={`${item.guest} · ${item.code} · ${status}${extra} · ${dates} · ${item.guests} guest${item.guests === 1 ? "" : "s"}`}
      aria-label={`${item.guest}, booking ${item.code}, ${status}${extra}, ${dates}`}
    >
      {item.cancelRequested && <AlertIcon className="adm-stay-alert" />}
      <span className="adm-stay-text">{item.guest}</span>
    </Link>
  );
}
