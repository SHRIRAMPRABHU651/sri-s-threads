"use client";

import { useRef, useState } from "react";
import type { Collection, DepartmentDef, Product } from "@/lib/types";
import { slugify } from "@/lib/shared";
import { api } from "./api";
import { uploadImage } from "./uploadImage";

type Draft = { label: string; blurb: string; image: string; sizes: string; active: boolean };

const parseSizes = (s: string) => [...new Set(s.split(/[,\n]/).map((x) => x.trim()).filter(Boolean))];

function DepartmentForm({ item, nextSort, onClose, onSaved }: { item?: DepartmentDef; nextSort: number; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState<Draft>(
    item
      ? { label: item.label, blurb: item.blurb, image: item.image, sizes: item.sizes.join(", "), active: item.active }
      : { label: "", blurb: "", image: "", sizes: "Free size", active: true },
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState<number | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));

  async function pick(files: FileList | null) {
    if (!files?.[0]) return;
    setPct(0);
    setError("");
    const r = await uploadImage(files[0], setPct);
    if ("url" in r) set("image", r.url); else setError(r.error);
    setPct(null);
    if (file.current) file.current.value = "";
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const body = { label: d.label, blurb: d.blurb, image: d.image, sizes: parseSizes(d.sizes), active: d.active, sort: item?.sort ?? nextSort };
    const r = item ? await api(`/api/departments/${item.slug}`, "PUT", body) : await api("/api/departments", "POST", body);
    setBusy(false);
    if (r.ok) onSaved(); else setError(r.error);
  }

  return (
    <div className="a-modal" role="dialog" aria-modal="true" aria-label={item ? "Edit department" : "Add department"}>
      <form className="a-modal__box" onSubmit={save}>
        <div className="a-modal__head"><h3>{item ? `Edit ${item.label}` : "Add department"}</h3><button type="button" className="a-btn a-btn--sm" onClick={onClose}>Close</button></div>
        <div className="a-form">
          <label>Name<input value={d.label} onChange={(e) => set("label", e.target.value)} required maxLength={40} placeholder="e.g. Dhoti & Veshti" /></label>
          <label>Web address
            <input value={`/${item ? item.slug : slugify(d.label) || "…"}`} readOnly disabled />
            <span className="a-hint">{item ? "The address stays the same when you rename, so existing links keep working." : "Made from the name. It can't be changed later."}</span>
          </label>
          <label className="span2">Short description (shown on the department page)<input value={d.blurb} onChange={(e) => set("blurb", e.target.value)} maxLength={140} placeholder="e.g. Dhotis, veshtis, angavastram & kurtas" /></label>
          <label className="span2">Size options
            <input value={d.sizes} onChange={(e) => set("sizes", e.target.value)} placeholder="S, M, L, XL  — or  Free size" />
            <span className="a-hint">Separate with commas. These are the choices when adding a product here (you can still add custom sizes per product).</span>
          </label>
          <div className="span2 a-fieldset">
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--a-mute)" }}>Picture (portrait photo works best)</span>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              {d.image && (
                <div className="a-img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.image} alt="" style={{ borderRadius: "40px 40px 8px 8px" }} />
                </div>
              )}
              <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => pick(e.target.files)} />
              <button type="button" className="a-btn" onClick={() => file.current?.click()} disabled={pct !== null}>{pct !== null ? `Uploading ${pct}%…` : d.image ? "Change picture" : "Upload picture"}</button>
            </div>
          </div>
          <label className="a-check span2"><input type="checkbox" checked={d.active} onChange={(e) => set("active", e.target.checked)} /> Switched on (visible in the store)</label>
        </div>
        {error && <p className="a-error" role="alert">{error}</p>}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" className="a-btn" onClick={onClose}>Cancel</button>
          <button className="a-btn a-btn--primary" type="submit" disabled={busy || pct !== null || !d.image}>{busy ? "Saving…" : "Save department"}</button>
        </div>
      </form>
    </div>
  );
}

export default function DepartmentsTab({ departments, products, groups, reload }: { departments: DepartmentDef[]; products: Product[]; groups: Collection[]; reload: () => void }) {
  const [editing, setEditing] = useState<DepartmentDef | "new" | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const sorted = [...departments].sort((a, b) => a.sort - b.sort || a.label.localeCompare(b.label));
  const nProducts = (s: string) => products.filter((p) => p.department === s).length;
  const nGroups = (s: string) => groups.filter((g) => g.kind === "collection" && g.department === s).length;
  const live = departments.filter((d) => d.active).length;

  async function put(d: DepartmentDef, patch: Partial<DepartmentDef>) {
    const r = await api(`/api/departments/${d.slug}`, "PUT", { ...d, ...patch });
    if (!r.ok) setNote(r.error);
    return r.ok;
  }

  async function toggle(d: DepartmentDef) {
    setNote("");
    if (d.active) {
      const n = nProducts(d.slug);
      if (!confirm(`Switch off “${d.label}”?\n\nIt disappears from the whole store (menu, home page, shop, product pages) until you switch it back on.${n ? ` Its ${n} product(s) are kept, just hidden.` : ""} Nothing is deleted.`)) return;
    }
    setBusy(d.slug);
    await put(d, { active: !d.active });
    setBusy(null);
    reload();
  }

  async function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= sorted.length) return;
    setNote("");
    setBusy(sorted[i].slug);
    const order = [...sorted];
    [order[i], order[j]] = [order[j], order[i]];
    // renumber 10, 20, 30… and only save the ones that changed
    await Promise.all(order.map((d, n) => (d.sort !== (n + 1) * 10 ? put(d, { sort: (n + 1) * 10 }) : Promise.resolve(true))));
    setBusy(null);
    reload();
  }

  async function remove(d: DepartmentDef) {
    setNote("");
    if (!confirm(`Delete “${d.label}” permanently?`)) return;
    const r = await api(`/api/departments/${d.slug}`, "DELETE");
    if (!r.ok) setNote(r.error);
    reload();
  }

  return (
    <>
      <div className="a-head">
        <h2>Departments ({departments.length})</h2>
        <button className="a-btn a-btn--primary" onClick={() => setEditing("new")}>+ Add department</button>
      </div>
      <p className="a-mute">
        Departments are the main sections of your store (the menu, the home page tiles and the shop tabs). Switch one off to hide it everywhere without deleting anything — switch it back on whenever you&rsquo;re ready.
        Add its collections (like Dhoti, Kurtas) in the <b>Collections</b> tab and its products in <b>Products</b>.
      </p>
      {note && <p className="a-error" role="alert">{note}</p>}
      <div className="a-list">
        {sorted.map((d, i) => (
          <div className={`a-row a-dept${d.active ? "" : " is-off"}`} key={d.slug}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="thumb" src={d.image} alt="" loading="lazy" />
            <div className="a-row__main">
              <span className="a-row__title">{d.label}</span>
              <span className="a-row__meta">
                <span className={`a-pill${d.active ? "" : " a-pill--off"}`}>{d.active ? "On" : "Off — hidden"}</span>
                <span>/{d.slug}</span>
                <span>{nProducts(d.slug)} products</span>
                <span>{nGroups(d.slug)} collections</span>
              </span>
              {d.blurb && <span className="a-row__meta">{d.blurb}</span>}
            </div>
            <div className="a-row__actions">
              <button
                type="button"
                role="switch"
                aria-checked={d.active}
                aria-label={`${d.label} ${d.active ? "is on" : "is off"}`}
                className={`a-switch${d.active ? " is-on" : ""}`}
                disabled={busy === d.slug || (d.active && live <= 1)}
                title={d.active && live <= 1 ? "At least one department must stay on" : d.active ? "Switch off" : "Switch on"}
                onClick={() => toggle(d)}
              ><span /></button>
              <button className="a-btn a-btn--sm" aria-label={`Move ${d.label} up`} disabled={i === 0 || !!busy} onClick={() => move(i, -1)}>↑</button>
              <button className="a-btn a-btn--sm" aria-label={`Move ${d.label} down`} disabled={i === sorted.length - 1 || !!busy} onClick={() => move(i, 1)}>↓</button>
              <button className="a-btn a-btn--sm" onClick={() => setEditing(d)}>Edit</button>
              <button className="a-btn a-btn--sm a-btn--danger" onClick={() => remove(d)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      {editing && <DepartmentForm item={editing === "new" ? undefined : editing} nextSort={(sorted[sorted.length - 1]?.sort ?? 0) + 10} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </>
  );
}
