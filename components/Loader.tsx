"use client";

import { useEffect, useState } from "react";
import { LogoStacked } from "./Logo";

/** Branded intro shown for ~2s on the first visit of a session (the <head> script hides it on later page loads). */
export default function Loader() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      setDone(true);
      try { sessionStorage.setItem("st-loaded", "1"); } catch { /* ignore */ }
    }, 2000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className={`loader${done ? " is-done" : ""}`} role="status" aria-label="Loading Sri's Threads" aria-hidden={done}>
      <div className="loader__inner">
        <LogoStacked animate />
        <div className="loader__bar"><i /></div>
      </div>
    </div>
  );
}
