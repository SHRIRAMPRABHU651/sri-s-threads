"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Emblem } from "@/components/Logo";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="login__card"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const f = new FormData(e.currentTarget);
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: f.get("username"), password: f.get("password") }),
        }).catch(() => null);
        setBusy(false);
        if (res?.ok) {
          const next = params.get("next");
          router.replace(next && next.startsWith("/admin") ? next : "/admin");
          router.refresh();
        } else {
          setError((await res?.json().catch(() => null))?.error || "Couldn't sign in. Please try again.");
        }
      }}
    >
      <Emblem size={72} title="Sri's Threads" />
      <h1>Admin sign in</h1>
      <label>Username<input name="username" autoComplete="username" required autoFocus /></label>
      <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
      {error && <p className="a-error" role="alert">{error}</p>}
      <button className="a-btn a-btn--primary" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="login">
      <Suspense fallback={null}><LoginForm /></Suspense>
    </div>
  );
}
