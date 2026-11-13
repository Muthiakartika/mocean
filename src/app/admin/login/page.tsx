import Link from "next/link";
import { redirect } from "next/navigation";
import { property } from "@/config/property";
import { getAdmin } from "@/lib/admin/session";
import { loginAction } from "../actions";
import { MailIcon } from "../icons";
import { Flash, one } from "../ui";
import { PasswordInput, SubmitButton } from "./fields";

export const dynamic = "force-dynamic";

/**
 * Staff login, one rounded frame in two halves: the property's photo at the left (logo on top, one line at the bottom)
 * and the sign-in form on white at the right (styles: "Login" in admin.css). Logins are made by the developer
 * (`npm run admin:create`), so there is no sign-up and no password reset here; the last line of the form says who to ask.
 */
export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (await getAdmin()) redirect("/admin/");
  const query = await searchParams;
  const logo = property.images.logoWhite;
  const photo = property.images.login ?? property.images.hero;

  return (
    <div className="adm-login">
      {/* The photo is set here, not in admin.css, because it belongs to the property (src/config/property.ts). */}
      <div className="adm-login-photo" style={{ "--adm-login-photo": `url("${photo}")` } as React.CSSProperties}>
        <div className="adm-login-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="adm-login-logo" src={logo.src} alt={property.name} width={logo.width} height={logo.height} />
          <span className="adm-login-tag">Admin</span>
        </div>
        <div className="adm-login-lead">
          <p className="adm-login-headline">Every stay starts here</p>
          <p className="adm-login-sub">Bookings, rooms and prices of {property.name}, in one place.</p>
        </div>
      </div>

      <div className="adm-login-panel">
        <Link className="adm-login-back" href="/">
          Back to website
        </Link>
        <div className="adm-login-box">
          <h1>Welcome back to {property.shortName}</h1>
          <p className="adm-login-intro">Sign in to your staff account.</p>
          <Flash error={one(query.error)} />
          <form action={loginAction} className="adm-login-form">
            <div>
              <label htmlFor="email">Email address</label>
              <div className="adm-login-field">
                <MailIcon />
                <input id="email" name="email" type="email" autoComplete="username" placeholder="Enter your email" required />
              </div>
            </div>
            <div>
              <label htmlFor="password">Password</label>
              <PasswordInput />
            </div>
            <SubmitButton />
          </form>
          <p className="adm-login-help">Forgot your password? Ask your website developer to reset it.</p>
        </div>
      </div>
    </div>
  );
}
