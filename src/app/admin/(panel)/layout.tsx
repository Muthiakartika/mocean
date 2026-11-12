import Link from "next/link";
import { requireAdmin } from "@/lib/admin/session";
import { formatDay, resortToday } from "@/lib/booking/stay";
import { logoutAction } from "../actions";
import { LogoutIcon, PlusIcon, SearchIcon } from "../icons";
import { Avatar } from "../ui";
import SideNav from "./SideNav";

export const dynamic = "force-dynamic";

/**
 * Every page behind the login: a navy sidebar (logo, menu, new booking, the signed-in user) beside the page, with a
 * top bar that searches bookings. (Server actions check the login again themselves.)
 */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const today = resortToday();

  return (
    <div className="adm-shell">
      <aside className="adm-side">
        <Link href="/admin/" className="adm-logo" aria-label="Mocean admin, today">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/uploads/2025/02/Mocean-FULL-Logo_White-1024x578.png" alt="" width={1024} height={578} />
          <span>Admin</span>
        </Link>

        <SideNav />

        <Link href="/admin/reservations/new/" className="adm-side-cta">
          <PlusIcon />
          New booking
        </Link>

        <form action={logoutAction} className="adm-side-user">
          <Avatar name={admin.email} />
          <span className="adm-side-email" title={admin.email}>
            {admin.email}
          </span>
          <button className="adm-side-logout" type="submit" aria-label="Sign out" title="Sign out">
            <LogoutIcon />
          </button>
        </form>

        {/* The site's wave, faint, at the foot of the sidebar. */}
        <svg className="adm-side-wave" viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path d="M0 44C180 84 360 92 560 64S900 4 1100 20s260 36 340 28V100H0Z" />
          <path d="M0 70C200 40 380 30 600 56s380 40 580 20 200-24 260-18V100H0Z" />
        </svg>
      </aside>

      <div className="adm-main">
        <div className="adm-topbar">
          <span className="adm-today">
            <span className="adm-today-dot" aria-hidden="true" />
            {formatDay(today, { weekday: "long", month: "long" })} <span className="adm-muted">(resort time)</span>
          </span>
          <form method="get" action="/admin/reservations/" className="adm-search" role="search">
            <SearchIcon />
            <label htmlFor="adm-search" className="sr-only">
              Search bookings
            </label>
            <input id="adm-search" name="q" type="search" placeholder="Booking number, name or email" maxLength={80} />
          </form>
          <Link href="/admin/reservations/new/" className="adm-round-btn" aria-label="New booking" title="New booking">
            <PlusIcon />
          </Link>
        </div>
        {/* Not <main>: the site's root layout already wraps every page in one. */}
        <div className="adm-page" id="adm-content">
          {children}
        </div>
      </div>
    </div>
  );
}
