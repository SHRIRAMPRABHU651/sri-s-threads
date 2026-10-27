"use client";

import { useEffect, useState } from "react";
import type { Settings, Subscriber } from "@/lib/types";
import type { StorageStatus } from "@/lib/storage";
import { api } from "./api";
import { downloadCsv, fmtDate } from "./ui";

function StoragePanel() {
  const [s, setS] = useState<StorageStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState("");
  const load = () => api<StorageStatus>("/api/admin/storage").then((r) => r.ok && setS(r.data));
  useEffect(() => { load(); }, []);
  if (!s) return null;

  async function migrate() {
    setBusy(true);
    setLog("Moving images…");
    let moved = 0, failed = 0;
    for (let i = 0; i < 100; i++) {
      const r = await api<{ moved: number; failed: number; remaining: number }>("/api/admin/storage/migrate", "POST");
      if (!r.ok) { setLog(r.error); break; }
      moved += r.data.moved; failed += r.data.failed;
      setLog(`Moved ${moved} image(s)… ${r.data.remaining} left`);
      if (r.data.remaining === 0 || r.data.moved === 0) { setLog(`Done — moved ${moved}${failed ? `, ${failed} could not be moved (they stay where they are)` : ""}.`); break; }
    }
    setBusy(false);
    load();
  }

  return (
    <div className="a-card">
      <div className="a-card__head"><h3>Image storage</h3><span className={`a-pill ${s.provider === "cloudinary" ? "" : "a-pill--warn"}`}>{s.provider === "cloudinary" ? "Cloudinary" : "MongoDB (fallback)"}</span></div>
      {s.provider === "cloudinary" ? (
        <>
          <p className="a-mute">Photos upload straight to Cloudinary (cloud <b>{s.cloudName}</b>) into the <code>{s.folder}</code> folder. This environment is <b>{s.environment}</b>, so it can only ever add or delete images in its own folder — local development and live never touch each other&rsquo;s photos.</p>
          {s.legacyCount > 0 ? (
            <>
              <p className="a-alert-inline">{s.legacyCount} image(s) are still stored in the database. Move them to Cloudinary to free database space and get faster, optimised delivery.</p>
              <div><button className="a-btn a-btn--primary" onClick={migrate} disabled={busy}>{busy ? "Moving…" : `Move ${s.legacyCount} image(s) to Cloudinary`}</button> <span className="a-mute">{log}</span></div>
            </>
          ) : <p className="a-ok">All images are on Cloudinary. {log}</p>}
        </>
      ) : (
        <>
          <p className="a-mute">Cloudinary isn&rsquo;t connected, so photos are saved in the MongoDB database. That works, but Cloudinary is faster and keeps the database small. To switch:</p>
          <ol className="a-steps">
            <li>Create a free account at cloudinary.com and open <b>Dashboard</b>.</li>
            <li>In Vercel → Settings → Environment Variables add <code>CLOUDINARY_CLOUD_NAME</code>, <code>CLOUDINARY_API_KEY</code> and <code>CLOUDINARY_API_SECRET</code> (or the single <code>CLOUDINARY_URL</code>), then redeploy.</li>
            <li>Come back here and use <b>Move images to Cloudinary</b> to transfer the photos you already have.</li>
          </ol>
          <p className="a-mute">{s.legacyCount} image(s) currently stored in the database.</p>
        </>
      )}
    </div>
  );
}

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
        className="a-form a-card"
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

      <StoragePanel />

      <div className="a-head">
        <h2>Newsletter subscribers ({subs.length})</h2>
        <button className="a-btn" disabled={!subs.length} onClick={() => downloadCsv("subscribers.csv", [["Email", "Subscribed"], ...subs.map((x) => [x.email, x.createdAt])])}>Export CSV</button>
      </div>
      <div className="a-list">
        {subs.map((x) => (
          <div className="a-row a-row--plain" key={x.email}>
            <div className="a-row__main"><span className="a-row__title">{x.email}</span><span className="a-row__meta">{fmtDate(x.createdAt)}</span></div>
          </div>
        ))}
        {subs.length === 0 && <p className="a-mute">No subscribers yet.</p>}
      </div>
    </>
  );
}
