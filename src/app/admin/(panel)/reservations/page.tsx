import Link from "next/link";
import { getDb } from "@/lib/db";
import { listReservations } from "@/lib/booking/native/store";
import { PlusIcon, SearchIcon } from "../../icons";
import { ReservationTable, one } from "../../ui";

const STATUSES = [
  { value: "pending", label: "Waiting" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "expired", label: "Expired" },
] as const;

export default async function Reservations({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const status = STATUSES.find((item) => item.value === one(query.status))?.value;
  const search = one(query.q).trim().slice(0, 80);
  const rows = await listReservations(await getDb(), { status, search });

  const tabHref = (value?: string) => {
    const params = new URLSearchParams();
    if (value) params.set("status", value);
    if (search) params.set("q", search);
    const text = params.toString();
    return `/admin/reservations/${text ? `?${text}` : ""}`;
  };

  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Bookings</h1>
          <p className="adm-muted">Newest first. {rows.length === 200 ? "Showing the latest 200." : `${rows.length} found.`}</p>
        </div>
        <Link className="adm-btn" href="/admin/reservations/new/">
          <PlusIcon />
          New booking
        </Link>
      </div>

      <section className="adm-card">
        <div className="adm-toolbar">
          <nav className="adm-tabs" aria-label="Filter by status">
            <Link href={tabHref()} aria-current={!status ? "page" : undefined}>
              All
            </Link>
            {STATUSES.map((item) => (
              <Link key={item.value} href={tabHref(item.value)} aria-current={status === item.value ? "page" : undefined}>
                {item.label}
              </Link>
            ))}
          </nav>
          <form method="get" className="adm-inline-search" role="search">
            {status && <input type="hidden" name="status" value={status} />}
            <SearchIcon />
            <label htmlFor="q" className="sr-only">
              Booking number, name or email
            </label>
            <input id="q" name="q" type="search" placeholder="Booking number, name or email" defaultValue={search} maxLength={80} />
            <button className="adm-btn adm-btn--quiet adm-btn--sm" type="submit">
              Search
            </button>
          </form>
        </div>
        <ReservationTable rows={rows} empty={search || status ? "No bookings match." : "No bookings yet."} />
      </section>
    </>
  );
}
