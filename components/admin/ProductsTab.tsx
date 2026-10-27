"use client";

import { useState } from "react";
import type { Collection, Product } from "@/lib/types";
import { inr, salePrice } from "@/lib/shared";
import { api } from "./api";
import ProductForm from "./ProductForm";

export default function ProductsTab({ products, groups, reload }: { products: Product[]; groups: Collection[]; reload: () => void }) {
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [q, setQ] = useState("");
  const [bulk, setBulk] = useState("");
  const list = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  async function remove(p: Product) {
    if (!confirm(`Delete “${p.name}”? This can't be undone.`)) return;
    const r = await api(`/api/products/${p.id}`, "DELETE");
    if (!r.ok) alert(r.error);
    reload();
  }

  /** Quick discount for every product at once (e.g. festival sale). */
  async function applyBulk() {
    const pct = parseFloat(bulk);
    if (Number.isNaN(pct) || pct < 0 || pct > 90) return alert("Enter a discount between 0 and 90.");
    if (!confirm(`Set a ${pct}% discount on all ${products.length} products?`)) return;
    for (const p of products) await api(`/api/products/${p.id}`, "PUT", { ...p, discountPercent: pct });
    setBulk("");
    reload();
  }

  return (
    <>
      <div className="a-head">
        <h2>Products ({products.length})</h2>
        <button className="a-btn a-btn--primary" onClick={() => setEditing("new")}>+ Add product</button>
      </div>
      <div className="a-filter">
        <input placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} />
        <input type="number" min={0} max={90} placeholder="Discount % for all" value={bulk} onChange={(e) => setBulk(e.target.value)} />
        <button className="a-btn" onClick={applyBulk} disabled={!bulk}>Apply to all</button>
      </div>
      <div className="a-list">
        {list.map((p) => (
          <div className="a-row" key={p.id}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="thumb" src={p.images[0]} alt="" />
            <div className="a-row__main">
              <span className="a-row__title">{p.name}</span>
              <span>
                <b>{inr(salePrice(p))}</b>{" "}
                {p.discountPercent > 0 && <span className="a-mute"><s>{inr(p.mrp)}</s> · {Math.round(p.discountPercent)}% off</span>}
              </span>
              <span className="a-row__meta">
                <span className={`a-pill${p.active ? "" : " a-pill--off"}`}>{p.active ? "Visible" : "Hidden"}</span>
                {p.stock < 1 ? <span className="a-pill a-pill--bad">Out of stock</span> : <span>Stock: {p.stock}</span>}
                {p.trending && <span className="a-pill a-pill--warn">Trending</span>}
                <span>{groups.find((g) => g.kind === "collection" && g.slug === p.collection)?.name ?? "No collection"}</span>
              </span>
            </div>
            <div className="a-row__actions">
              <a className="a-btn a-btn--sm" href={`/product/${p.slug}`} target="_blank" rel="noreferrer">View</a>
              <button className="a-btn a-btn--sm" onClick={() => setEditing(p)}>Edit</button>
              <button className="a-btn a-btn--sm a-btn--danger" onClick={() => remove(p)}>Delete</button>
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="a-mute">No products found.</p>}
      </div>
      {editing && (
        <ProductForm
          groups={groups}
          product={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload(); }}
        />
      )}
    </>
  );
}
