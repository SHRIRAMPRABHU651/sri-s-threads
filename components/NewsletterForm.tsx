"use client";

import { useState } from "react";

export default function NewsletterForm() {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <>
      <form
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const email = String(new FormData(form).get("email") ?? "");
          setBusy(true);
          const res = await fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }).catch(() => null);
          setBusy(false);
          if (res?.ok) { setNote("Thank you! We’ll let you know when we launch."); form.reset(); }
          else setNote((await res?.json().catch(() => null))?.error || "Something went wrong. Please try again.");
        }}
      >
        <label className="field">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/icons/mail.svg" alt="" />
          <span className="sr-only">Email address</span>
          <input type="email" name="email" placeholder="Enter your email" autoComplete="email" required />
        </label>
        <button className="btn btn--primary" type="submit" disabled={busy}>Subscribe</button>
      </form>
      <p className="form-note" role="status">{note}</p>
    </>
  );
}
