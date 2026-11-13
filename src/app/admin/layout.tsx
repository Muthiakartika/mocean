import type { Metadata } from "next";
import { property } from "@/config/property";
import "./admin.css";

/** The resort's staff tool. Never indexed (also disallowed in robots.txt). */
export const metadata: Metadata = {
  title: `Admin | ${property.name}`,
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="adm" data-admin-root>
      {children}
    </div>
  );
}
