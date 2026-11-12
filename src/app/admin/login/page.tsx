import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/admin/session";
import { loginAction } from "../actions";
import { Flash, one } from "../ui";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (await getAdmin()) redirect("/admin/");
  const query = await searchParams;

  return (
    <div className="adm-login">
      <div className="adm-login-photo" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="adm-login-logo" src="/images/uploads/2025/02/Mocean-FULL-Logo_White-1024x578.png" alt="" width={1024} height={578} />
        <p>Bookings, rooms and prices of Mocean Beach Resort, in one place.</p>
        <svg viewBox="0 0 1440 100" preserveAspectRatio="none" focusable="false">
          <path d="M0 44C180 84 360 92 560 64S900 4 1100 20s260 36 340 28V100H0Z" />
          <path d="M0 70C200 40 380 30 600 56s380 40 580 20 200-24 260-18V100H0Z" />
        </svg>
      </div>

      <div className="adm-login-panel">
        <h1>Sign in</h1>
        <p className="adm-muted">Staff access to manage bookings, rooms and prices.</p>
        <Flash error={one(query.error)} />
        <form action={loginAction} className="adm-login-form">
          <div>
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="username" required />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          <button className="adm-btn adm-btn--block" type="submit">
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
