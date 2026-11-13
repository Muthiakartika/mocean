"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { EyeIcon, EyeOffIcon, LockIcon } from "../icons";

/** The password field of the login: a lock, the input, and a button that shows what was typed. */
export function PasswordInput() {
  const [shown, setShown] = useState(false);
  return (
    <div className="adm-login-field">
      <LockIcon />
      <input
        id="password"
        name="password"
        type={shown ? "text" : "password"}
        autoComplete="current-password"
        placeholder="Enter your password"
        required
      />
      <button type="button" className="adm-login-eye" aria-label="Show password" aria-pressed={shown} title={shown ? "Hide password" : "Show password"} onClick={() => setShown((value) => !value)}>
        {shown ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

/** Says "Signing in" and cannot be pressed twice while the login is being checked. */
export function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="adm-btn adm-btn--block adm-login-submit" type="submit" disabled={pending} aria-busy={pending}>
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}
