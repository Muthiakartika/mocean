"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BedIcon, BlockIcon, BookingsIcon, CalendarIcon, ChartIcon, DashboardIcon, GuideIcon, RatesIcon, WalletIcon } from "../icons";

const ITEMS = [
  { href: "/admin/", label: "Today", Icon: DashboardIcon, exact: true },
  { href: "/admin/reservations/", label: "Bookings", Icon: BookingsIcon },
  { href: "/admin/calendar/", label: "Calendar", Icon: CalendarIcon },
  { href: "/admin/reports/", label: "Reports", Icon: ChartIcon },
  { href: "/admin/blocks/", label: "Block dates", Icon: BlockIcon },
  { href: "/admin/rates/", label: "Prices", Icon: RatesIcon },
  { href: "/admin/rooms/", label: "Rooms", Icon: BedIcon },
  { href: "/admin/payments/", label: "Payments", Icon: WalletIcon },
  { href: "/admin/guide/", label: "Guide", Icon: GuideIcon },
];

/** The admin menu; marks the section being viewed (a booking's page counts as Bookings). */
export default function SideNav() {
  const path = usePathname() ?? "/admin/";
  const current = (href: string, exact?: boolean) => {
    const here = path.endsWith("/") ? path : `${path}/`;
    return exact ? here === href : here.startsWith(href);
  };

  return (
    <nav className="adm-nav" aria-label="Admin">
      <span className="adm-nav-label">Menu</span>
      {ITEMS.map(({ href, label, Icon, exact }) => (
        <Link key={href} href={href} className="adm-nav-link" aria-current={current(href, exact) ? "page" : undefined}>
          <Icon />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
