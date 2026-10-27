"use client";

import { useEffect, useMemo, useState } from "react";
import type { Collection, Department, Product } from "@/lib/types";
import { DEPARTMENTS, departmentLabel, salePrice } from "@/lib/shared";
import { api } from "./api";
import ProductForm from "./ProductForm";
import { downloadCsv, rupees } from "./ui";

const PER_PAGE = 20;
type Status = "all" | "visible" | "hidden" | "out" | "low";
type Sort = "new" | "name" | "low" | "high" | "stock";

function Prompt({ title, label, type = "number", initial = "", onOk, onClose }: { title: string; label: string; type?: string; initial?: string; onOk: (v: string) => void; onClose: () => void }) {
  const [v, setV] = useState(initial);
  return (
    <div className="a-modal" role="dialog" aria-modal="true" aria-label={title}>
      <form className="a-modal__box" style={{ maxWidth: 380 }} onSubmit={(e) => { e.preventDefault(); onOk(v); }}>
        <div className="a-modal__head"><h3>{title}</h3></div>
        <label className="a-form" style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "var(--a-mute)" }}>{label}<input autoFocus type={type} value={v} onChange={(e) => setV(e.target.value)} min={0} step="any" required /></label>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" className="a-btn" onClick={onClose}>Cancel</button>
          <button className="a-btn a-btn--primary" type="submit">Apply</button>
        </div>
      </form>
    </div>
  );
}

export default function ProductsTab({ products, groups, reload }: { products: Product[]; groups: Collection[]; reload: () => void }) {
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [q, setQ] = useState("");
  const [dept, setDept] = useState<Department | "">("");
  const [coll, setColl] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [sort, setSort] = useState<Sort>("new");
  const [page, setPage] = useState(1);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [prompt, setPrompt] = useState<null | { kind: "discount" | "stock" }>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  const collName = (p: Product) => groups.find((g) => g.kind === "collection" && g.slug === p.collection)?.name ?? "—";
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    let list = products.filter((p) => {
      if (t && !`${p.name} ${p.sku ?? ""}`.toLowerCase().includes(t)) return false;
      if (dept && p.department !== dept) return false;
      if (coll && p.collection !== coll) return false;
      if (status === "visible" && !p.active) return false;
      if (status === "hidden" && p.active) return false;
      if (status === "out" && p.stock > 0) return false;
      if (status === "low" && !(p.stock > 0 && p.stock <= 5)) return false;
      return true;
    });
    const by: Record<Sort, (a: Product, b: Product) => number> = {
      new: (a, b) => b.createdAt.localeCompare(a.createdAt),
      name: (a, b) => a.name.localeCompare(b.name),
      low: (a, b) => salePrice(a) - salePrice(b),
      high: (a, b) => salePrice(b) - salePrice(a),
      stock: (a, b) => a.stock - b.stock,
    };
    list = [...list].sort(by[sort]);
    return list;
  }, [products, q, dept, coll, status, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  useEffect(() => { setPage(1); }, [q, dept, coll, status, sort]);
  useEffect(() => { if (page > pages) setPage(pages); }, [page, pages]);
  const rows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const allOnPage = rows.length > 0 && rows.every((r) => sel.has(r.id));
  const ids = [...sel];

  const flash = (ok: boolean, text: string) => { setNote({ ok, text }); setTimeout(() => setNote(null), 3500); };
  async function bulk(body: Record<string, unknown>, done: string) {
    if (!ids.length) return;
    setBusy(true);
    const r = await api<{ affected: number }>("/api/products/bulk", "POST", { ids, ...body });
    setBusy(false);
    if (r.ok) { flash(true, `${done} (${r.data.affected} product${r.data.affected === 1 ? "" : "s"})`); setSel(new Set()); reload(); }
    else flash(false, r.error);
  }

  async function remove(p: Product) {
    if (!confirm(`Delete “${p.name}”? This can't be undone.`)) return;
    const r = await api(`/api/products/${p.id}`, "DELETE");
    if (!r.ok) flash(false, r.error);
    reload();
  }
  async function duplicate(p: Product) {
    const r = await api<Product>(`/api/products/${p.id}/duplicate`, "POST");
    if (r.ok) { flash(true, "Copy created (hidden) — edit it and switch it on."); reload(); setEditing(r.data); } else flash(false, r.error);
  }
  async function quick(p: Product, body: Record<string, unknown>) {
    const r = await api("/api/products/bulk", "POST", { ids: [p.id], ...body });
    if (!r.ok) flash(false, r.error);
    reload();
  }

  const exportCsv = () =>
    downloadCsv(`products-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Name", "SKU", "Department", "Collection", "MRP", "Discount %", "Sale price", "Stock", "Sizes", "Visible", "Trending", "New", "URL slug"],
      ...filtered.map((p) => [p.name, p.sku, departmentLabel(p.department), collName(p), p.mrp, p.discountPercent, salePrice(p), p.stock, p.sizes.join(" | "), p.active ? "yes" : "no", p.trending ? "yes" : "no", p.isNew ? "yes" : "no", p.slug]),
    ]);

  const deptCollections = groups.filter((g) => g.kind === "collection" && (!dept || g.department === dept));

  return (
    <>
      <div className="a-head">
        <h2>Products ({filtered.length}{filtered.length !== products.length ? ` of ${products.length}` : ""})</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="a-btn" onClick={exportCsv}>Export CSV</button>
          <button className="a-btn a-btn--primary" onClick={() => setEditing("new")}>+ Add product</button>
        </div>
      </div>

      <div className="a-filter">
        <input type="search" placeholder="Search name or SKU…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" />
        <select value={dept} onChange={(e) => { setDept(e.target.value as Department | ""); setColl(""); }} aria-label="Department">
          <option value="">All departments</option>
          {DEPARTMENTS.map((d) => <option key={d.slug} value={d.slug}>{d.label}</option>)}
        </select>
        <select value={coll} onChange={(e) => setColl(e.target.value)} aria-label="Collection">
          <option value="">All collections</option>
          {deptCollections.map((g) => <option key={g.slug} value={g.slug}>{g.name}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as Status)} aria-label="Status">
          <option value="all">Any status</option><option value="visible">Visible</option><option value="hidden">Hidden</option><option value="out">Out of stock</option><option value="low">Low stock (≤5)</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort">
          <option value="new">Newest</option><option value="name">Name A–Z</option><option value="low">Price ↑</option><option value="high">Price ↓</option><option value="stock">Stock ↑</option>
        </select>
      </div>

      {note && <p className={note.ok ? "a-ok" : "a-error"} role="status">{note.text}</p>}

      {sel.size > 0 && (
        <div className="a-bulk" role="toolbar" aria-label="Bulk actions">
          <b>{sel.size} selected</b>
          <button className="a-btn a-btn--sm" disabled={busy} onClick={() => bulk({ action: "activate" }, "Shown in store")}>Show</button>
          <button className="a-btn a-btn--sm" disabled={busy} onClick={() => bulk({ action: "deactivate" }, "Hidden from store")}>Hide</button>
          <button className="a-btn a-btn--sm" disabled={busy} onClick={() => setPrompt({ kind: "discount" })}>Set discount…</button>
          <button className="a-btn a-btn--sm" disabled={busy} onClick={() => setPrompt({ kind: "stock" })}>Set stock…</button>
          <select className="a-bulk__sel" disabled={busy} value="" aria-label="Move to department" onChange={(e) => e.target.value && bulk({ action: "department", department: e.target.value }, `Moved to ${departmentLabel(e.target.value)}`)}>
            <option value="">Move to department…</option>
            {DEPARTMENTS.map((d) => <option key={d.slug} value={d.slug}>{d.label}</option>)}
          </select>
          <select className="a-bulk__sel" disabled={busy} value="" aria-label="Set collection" onChange={(e) => e.target.value && bulk({ action: "collection", value: e.target.value === "__none" ? "" : e.target.value }, "Collection updated")}>
            <option value="">Set collection…</option>
            <option value="__none">— none —</option>
            {groups.filter((g) => g.kind === "collection").map((g) => <option key={g.slug} value={g.slug}>{departmentLabel(g.department)} · {g.name}</option>)}
          </select>
          <button className="a-btn a-btn--sm" disabled={busy} onClick={() => bulk({ action: "trending", value: true }, "Marked as featured")}>Feature</button>
          <button className="a-btn a-btn--sm a-btn--danger" disabled={busy} onClick={() => confirm(`Delete ${sel.size} product(s)? This can't be undone.`) && bulk({ action: "delete" }, "Deleted")}>Delete</button>
          <button className="a-btn a-btn--sm" onClick={() => setSel(new Set())}>Clear</button>
        </div>
      )}

      <div className="a-list">
        {rows.length > 0 && (
          <label className="a-selectall"><input type="checkbox" checked={allOnPage} onChange={(e) => setSel((s) => { const n = new Set(s); rows.forEach((r) => (e.target.checked ? n.add(r.id) : n.delete(r.id))); return n; })} /> Select all on this page</label>
        )}
        {rows.map((p) => (
          <div className={`a-row a-row--sel${sel.has(p.id) ? " is-selected" : ""}`} key={p.id}>
            <input type="checkbox" className="a-row__check" checked={sel.has(p.id)} aria-label={`Select ${p.name}`} onChange={(e) => setSel((s) => { const n = new Set(s); e.target.checked ? n.add(p.id) : n.delete(p.id); return n; })} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="thumb" src={p.images[0]} alt="" loading="lazy" />
            <div className="a-row__main">
              <span className="a-row__title">{p.name}</span>
              <span>
                <b>{rupees(salePrice(p))}</b>{" "}
                {p.discountPercent > 0 && <span className="a-mute"><s>{rupees(p.mrp)}</s> · {Math.round(p.discountPercent)}% off</span>}
              </span>
              <span className="a-row__meta">
                <button type="button" className={`a-pill a-pill--btn${p.active ? "" : " a-pill--off"}`} onClick={() => quick(p, { action: p.active ? "deactivate" : "activate" })} title="Click to toggle visibility">{p.active ? "Visible" : "Hidden"}</button>
                <span className="a-pill a-pill--dept">{departmentLabel(p.department)}</span>
                <span>{collName(p)}</span>
                {p.trending && <span className="a-pill a-pill--warn">Featured</span>}
                <label className="a-stock">Stock
                  <input type="number" min={0} defaultValue={p.stock} key={`${p.id}-${p.stock}`} className={p.stock <= 0 ? "is-out" : p.stock <= 5 ? "is-low" : ""} onBlur={(e) => { const v = Math.max(0, Math.round(Number(e.target.value))); if (Number.isFinite(v) && v !== p.stock) quick(p, { action: "stock", value: v }); }} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} aria-label={`Stock for ${p.name}`} />
                </label>
              </span>
            </div>
            <div className="a-row__actions">
              <a className="a-btn a-btn--sm" href={`/product/${p.slug}`} target="_blank" rel="noreferrer">View</a>
              <button className="a-btn a-btn--sm" onClick={() => setEditing(p)}>Edit</button>
              <button className="a-btn a-btn--sm" onClick={() => duplicate(p)}>Duplicate</button>
              <button className="a-btn a-btn--sm a-btn--danger" onClick={() => remove(p)}>Delete</button>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="a-mute">No products match these filters.</p>}
      </div>

      {pages > 1 && (
        <div className="a-pager">
          <button className="a-btn a-btn--sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
          <span>Page {page} of {pages}</span>
          <button className="a-btn a-btn--sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}

      {prompt && (
        <Prompt
          title={prompt.kind === "discount" ? "Set discount" : "Set stock"}
          label={prompt.kind === "discount" ? `Discount % for ${sel.size} product(s) (0–90)` : `Stock quantity for ${sel.size} product(s)`}
          onClose={() => setPrompt(null)}
          onOk={(v) => { const k = prompt.kind; setPrompt(null); bulk(k === "discount" ? { action: "discount", percent: Number(v) } : { action: "stock", value: Number(v) }, k === "discount" ? "Discount updated" : "Stock updated"); }}
        />
      )}
      {editing && (
        <ProductForm product={editing === "new" ? undefined : editing} groups={groups} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />
      )}
    </>
  );
}
