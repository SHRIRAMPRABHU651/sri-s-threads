"use client";

import { useEffect, useState } from "react";
import type { Settings, Subscriber } from "@/lib/types";
import { api } from "./api";

export default function SettingsTab() {
  const [s, setS] = useState<Settings | null>(null);
  const [subs, setSubs] = useState<Subscriber[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    api<Settings>("/api/settings").then((r) => r.ok && setS(r.data));
    api<Subscriber[]>("/api/subscribe").then((r) => r.ok && setSubs(r.data));
  }, []);
  if (!s) return <p className="a-mute">Loading…</p>;
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS({ ...s, [k]: v });

  return (
    <>
      <div className="a-head"><h2>Store settings</h2></div>
      <form
        className="a-form"
        style={{ background: "#fff", border: "1px solid var(--a-line)", borderRadius: 12, padding: 14 }}
        onSubmit={async (e) => {
          e.preventDefault();
          const r = await api("/api/settings", "PUT", s);
          setMsg(r.ok ? { ok: true, text: "Settings saved." } : { ok: false, text: r.error });
        }}
      >
        <label>WhatsApp number for orders (with country code, digits only)
          <input value={s.whatsappNumber} onChange={(e) => set("whatsappNumber", e.target.value)} inputMode="numeric" placeholder="919876543210" required />
        </label>
        <label>Store name<input value={s.storeName} onChange={(e) => set("storeName", e.target.value)} /></label>
        <label className="span2">Announcement bar text (use “. ” to make the second half a link to the shop)<input value={s.announcement} onChange={(e) => set("announcement", e.target.value)} /></label>
        <label>Instagram URL<input value={s.instagramUrl} onChange={(e) => set("instagramUrl", e.target.value)} placeholder="https://instagram.com/…" /></label>
        <label>Facebook URL<input value={s.facebookUrl} onChange={(e) => set("facebookUrl", e.target.value)} placeholder="https://facebook.com/…" /></label>
        <label>X / Twitter URL<input value={s.twitterUrl} onChange={(e) => set("twitterUrl", e.target.value)} placeholder="https://x.com/…" /></label>
        <div className="span2" style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="a-btn a-btn--primary" type="submit">Save settings</button>
          {msg && <span className={msg.ok ? "a-ok" : "a-error"} role="status">{msg.text}</span>}
        </div>
      </form>

      <div className="a-head"><h2>Newsletter subscribers ({subs.length})</h2></div>
      <div className="a-list">
        {subs.map((x) => (
          <div className="a-row a-row--plain" key={x.email}>
            <div className="a-row__main"><span className="a-row__title">{x.email}</span><span className="a-row__meta">{new Date(x.createdAt).toLocaleString()}</span></div>
          </div>
        ))}
        {subs.length === 0 && <p className="a-mute">No subscribers yet.</p>}
      </div>
    </>
  );
}
