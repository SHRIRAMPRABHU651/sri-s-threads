"use client";

import { useRef, useState } from "react";
import type { Collection, CollectionKind } from "@/lib/types";
import { COLLECTION_KINDS } from "@/lib/shared";
import { api } from "./api";
import { uploadImage } from "./uploadImage";

type Draft = { kind: CollectionKind; name: string; image: string; featured: boolean; active: boolean; sort: string };

function CollectionForm({ item, defaultKind, onClose, onSaved }: { item?: Collection; defaultKind: CollectionKind; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState<Draft>(
    item
      ? { kind: item.kind, name: item.name, image: item.image, featured: item.featured, active: item.active, sort: String(item.sort) }
      : { kind: defaultKind, name: "", image: "", featured: true, active: true, sort: "100" },
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));

  async function pick(files: FileList | null) {
    if (!files?.[0]) return;
    setUploading(true);
    setError("");
    const r = await uploadImage(files[0]);
    if ("url" in r) set("image", r.url); else setError(r.error);
    setUploading(false);
    if (file.current) file.current.value = "";
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const body = { ...d, sort: parseInt(d.sort) || 0 };
    const r = item ? await api(`/api/collections/${item.id}`, "PUT", body) : await api("/api/collections", "POST", body);
    setBusy(false);
    if (r.ok) onSaved(); else setError(r.error);
  }

  return (
    <div className="a-modal" role="dialog" aria-modal="true" aria-label={item ? "Edit collection" : "Add collection"}>
      <form className="a-modal__box" onSubmit={save}>
        <div className="a-modal__head"><h3>{item ? "Edit collection" : "Add collection"}</h3><button type="button" className="a-btn a-btn--sm" onClick={onClose}>Close</button></div>
        <div className="a-form">
          <label>Name<input value={d.name} onChange={(e) => set("name", e.target.value)} required maxLength={60} placeholder="e.g. Chudidhar" /></label>
          <label>Shown under
            <select value={d.kind} onChange={(e) => set("kind", e.target.value as CollectionKind)} disabled={!!item}>
              {COLLECTION_KINDS.map((k) => <option key={k.kind} value={k.kind}>{k.title}</option>)}
            </select>
          </label>
          <label>Display order (lower shows first)<input type="number" value={d.sort} onChange={(e) => set("sort", e.target.value)} /></label>
          <div className="span2 a-fieldset">
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--a-mute)" }}>Card image (portrait photo works best)</span>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              {d.image && (
                <div className="a-img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.image} alt="" style={{ borderRadius: "40px 40px 8px 8px" }} />
                </div>
              )}
              <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => pick(e.target.files)} />
              <button type="button" className="a-btn" onClick={() => file.current?.click()} disabled={uploading}>{uploading ? "Uploading…" : d.image ? "Change image" : "Upload image"}</button>
            </div>
          </div>
          {d.kind === "collection" && <label className="a-check"><input type="checkbox" checked={d.featured} onChange={(e) => set("featured", e.target.checked)} /> Show on the home page</label>}
          <label className="a-check"><input type="checkbox" checked={d.active} onChange={(e) => set("active", e.target.checked)} /> Visible in store</label>
        </div>
        {error && <p className="a-error" role="alert">{error}</p>}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" className="a-btn" onClick={onClose}>Cancel</button>
          <button className="a-btn a-btn--primary" type="submit" disabled={busy || uploading || !d.image}>{busy ? "Saving…" : "Save collection"}</button>
        </div>
      </form>
    </div>
  );
}

export default function CollectionsTab({ groups, counts, reload }: { groups: Collection[]; counts: Record<string, number>; reload: () => void }) {
  const [editing, setEditing] = useState<{ item?: Collection; kind: CollectionKind } | null>(null);

  async function remove(c: Collection) {
    const n = counts[`${c.kind}:${c.slug}`] ?? 0;
    if (!confirm(`Delete “${c.name}”?${n ? ` ${n} product(s) will be left without this group (the products themselves are kept).` : ""}`)) return;
    const r = await api(`/api/collections/${c.id}`, "DELETE");
    if (!r.ok) alert(r.error);
    reload();
  }
  async function toggle(c: Collection) {
    await api(`/api/collections/${c.id}`, "PUT", { ...c, active: !c.active });
    reload();
  }

  return (
    <>
      {COLLECTION_KINDS.map((k) => {
        const items = groups.filter((g) => g.kind === k.kind);
        return (
          <section key={k.kind} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="a-head">
              <h2>{k.title} ({items.length})</h2>
              <button className="a-btn a-btn--primary" onClick={() => setEditing({ kind: k.kind })}>+ Add</button>
            </div>
            <div className="a-list">
              {items.map((c) => (
                <div className="a-row" key={c.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="thumb" src={c.image} alt="" />
                  <div className="a-row__main">
                    <span className="a-row__title">{c.name}</span>
                    <span className="a-row__meta">
                      <span className={`a-pill${c.active ? "" : " a-pill--off"}`}>{c.active ? "Visible" : "Hidden"}</span>
                      {c.featured && <span className="a-pill a-pill--warn">On home page</span>}
                      <span>{counts[`${c.kind}:${c.slug}`] ?? 0} products</span>
                      <span>Order {c.sort}</span>
                    </span>
                  </div>
                  <div className="a-row__actions">
                    <a className="a-btn a-btn--sm" href={`/shop?${k.param}=${c.slug}`} target="_blank" rel="noreferrer">View</a>
                    <button className="a-btn a-btn--sm" onClick={() => toggle(c)}>{c.active ? "Hide" : "Show"}</button>
                    <button className="a-btn a-btn--sm" onClick={() => setEditing({ item: c, kind: c.kind })}>Edit</button>
                    <button className="a-btn a-btn--sm a-btn--danger" onClick={() => remove(c)}>Delete</button>
                  </div>
                </div>
              ))}
              {items.length === 0 && <p className="a-mute">None yet.</p>}
            </div>
          </section>
        );
      })}
      {editing && <CollectionForm item={editing.item} defaultKind={editing.kind} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </>
  );
}
