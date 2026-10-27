"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center", fontFamily: "Helvetica, Arial, sans-serif" }}>
      <div style={{ maxWidth: 460 }}>
        <h1 style={{ font: "400 24px/32px Cinzel, Georgia, serif", color: "#092b2b", margin: "0 0 10px" }}>We hit a snag</h1>
        <p style={{ color: "#525252", fontSize: 14, lineHeight: "22px", margin: "0 0 16px" }}>
          Something went wrong while loading this page. Please try again in a moment.
        </p>
        {process.env.NODE_ENV !== "production" && <pre style={{ textAlign: "left", whiteSpace: "pre-wrap", background: "#fef3f2", color: "#b42318", padding: 12, borderRadius: 8, fontSize: 12 }}>{error.message}</pre>}
        <button onClick={reset} style={{ background: "#0c3c3c", color: "#fff", border: 0, borderRadius: 4, padding: "10px 18px", fontSize: 13, cursor: "pointer" }}>Try again</button>
      </div>
    </div>
  );
}
