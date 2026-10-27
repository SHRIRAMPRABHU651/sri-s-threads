"use client";

import { useState } from "react";
import type { Coupon } from "@/lib/types";
import { couponHeadline, inr } from "@/lib/shared";
import { api } from "./api";

type Draft = { code: string; description: string; type: "percent" | "flat"; value: string; minOrder: string; maxDiscount: string; usageLimit: string; expiresAt: string; active: boolean };
const blank: Draft = { code: "", description: "", type: "percent", value: "10", minOrder: "0", maxDiscount: "0", usageLimit: "0", expiresAt: "", active: true };
const toLocal = (iso?: string) => (iso ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");

function CouponForm({ coupon, onClose, onSaved }: { coupon?: Coupon; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState<Draft>(
    coupon
      ? { code: coupon.code, description: coupon.description, type: coupon.type, value: String(coupon.value), minOrder: String(coupon.minOrder), maxDiscount: String(coupon.maxDiscount), usageLimit: String(coupon.usageLimit), expiresAt: toLocal(coupon.expiresAt), active: coupon.active }
      : blank,
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const body = { ...d, value: parseFloat(d.value), minOrder: parseFloat(d.minOrder) || 0, maxDiscount: parseFloat(d.maxDiscount) || 0, usageLimit: parseInt(d.usageLimit) || 0, expiresAt: d.expiresAt || "" };
    const r = coupon ? await api(`/api/coupons/${coupon.id}`, "PUT", body) : await api("/api/coupons", "POST", body);
    setBusy(false);
    if (r.ok) onSaved(); else setError(r.error);
  }

  return (
    <div className="a-modal" role="dialog" aria-modal="true" aria-label={coupon ? "Edit coupon" : "Add coupon"}>
      <form className="a-modal__box" onSubmit={save}>
        <div className="a-modal__head"><h3>{coupon ? "Edit coupon" : "Add coupon"}</h3><button type="button" className="a-btn a-btn--sm" onClick={onClose}>Close</button></div>
        <div className="a-form">
          <label>Code<input value={d.code} onChange={(e) => set("code", e.target.value.toUpperCase())} required maxLength={30} placeholder="FESTIVE20" style={{ textTransform: "uppercase" }} /></label>
          <label>Type
            <select value={d.type} onChange={(e) => set("type", e.target.value as Draft["type"])}>
              <option value="percent">Percentage (%)</option>
              <option value="flat">Flat amount (₹)</option>
            </select>
          </label>
          <label>{d.type === "percent" ? "Discount (%)" : "Discount (₹)"}<input type="number" min={1} max={d.type === "percent" ? 100 : undefined} step="0.01" value={d.value} onChange={(e) => set("value", e.target.value)} required /></label>
          <label>Minimum order (₹)<input type="number" min={0} value={d.minOrder} onChange={(e) => set("minOrder", e.target.value)} /></label>
          {d.type === "percent" && <label>Max discount (₹, 0 = no cap)<input type="number" min={0} value={d.maxDiscount} onChange={(e) => set("maxDiscount", e.target.value)} /></label>}
          <label>Usage limit (0 = unlimited)<input type="number" min={0} value={d.usageLimit} onChange={(e) => set("usageLimit", e.target.value)} /></label>
          <label>Expires (optional)<input type="datetime-local" value={d.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} /></label>
          <label className="span2">Short text shown on the coupon card<input value={d.description} onChange={(e) => set("description", e.target.value)} maxLength={120} placeholder="*On orders above ₹1,000" /></label>
          <label className="a-check"><input type="checkbox" checked={d.active} onChange={(e) => set("active", e.target.checked)} /> Active</label>
        </div>
        {error && <p className="a-error" role="alert">{error}</p>}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" className="a-btn" onClick={onClose}>Cancel</button>
          <button className="a-btn a-btn--primary" type="submit" disabled={busy}>{busy ? "Saving…" : "Save coupon"}</button>
        </div>
      </form>
    </div>
  );
}

export default function CouponsTab({ coupons, reload }: { coupons: Coupon[]; reload: () => void }) {
  const [editing, setEditing] = useState<Coupon | "new" | null>(null);
  const now = Date.now();

  async function toggle(c: Coupon) {
    await api(`/api/coupons/${c.id}`, "PUT", { ...c, active: !c.active });
    reload();
  }
  async function remove(c: Coupon) {
    if (!confirm(`Delete coupon ${c.code}?`)) return;
    await api(`/api/coupons/${c.id}`, "DELETE");
    reload();
  }

  return (
    <>
      <div className="a-head"><h2>Coupon codes ({coupons.length})</h2><button className="a-btn a-btn--primary" onClick={() => setEditing("new")}>+ Add coupon</button></div>
      <div className="a-list">
        {coupons.map((c) => {
          const expired = c.expiresAt && new Date(c.expiresAt).getTime() < now;
          return (
            <div className="a-row a-row--plain" key={c.id}>
              <div className="a-row__main">
                <span className="a-row__title">{c.code} <span className="a-mute" style={{ fontWeight: 400 }}>— {couponHeadline(c)}</span></span>
                <span className="a-row__meta">
                  <span className={`a-pill${c.active && !expired ? "" : " a-pill--off"}`}>{expired ? "Expired" : c.active ? "Active" : "Disabled"}</span>
                  <span>Min order {inr(c.minOrder)}</span>
                  {c.type === "percent" && c.maxDiscount > 0 && <span>Max {inr(c.maxDiscount)}</span>}
                  <span>Used {c.used}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</span>
                  {c.expiresAt && <span>Expires {new Date(c.expiresAt).toLocaleString()}</span>}
                </span>
              </div>
              <div className="a-row__actions">
                <button className="a-btn a-btn--sm" onClick={() => toggle(c)}>{c.active ? "Disable" : "Enable"}</button>
                <button className="a-btn a-btn--sm" onClick={() => setEditing(c)}>Edit</button>
                <button className="a-btn a-btn--sm a-btn--danger" onClick={() => remove(c)}>Delete</button>
              </div>
            </div>
          );
        })}
        {coupons.length === 0 && <p className="a-mute">No coupons yet.</p>}
      </div>
      {editing && <CouponForm coupon={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </>
  );
}
