"use client";

import { useRef, useState } from "react";
import type { Collection, Department, Product } from "@/lib/types";
import { DEPARTMENTS, inr, salePrice } from "@/lib/shared";
import { api } from "./api";
import { uploadImage } from "./uploadImage";

const toLocalInput = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

type Draft = {
  name: string; description: string; details: string; care: string; sku: string; mrp: string; discountPercent: string; stock: string;
  sizes: string[]; department: Department; collection: string; fabric: string; occasion: string;
  isNew: boolean; trending: boolean; active: boolean; saleEndsAt: string; images: string[]; colors: { name: string; image: string }[];
};

const blank: Draft = {
  name: "", description: "", details: "", care: "", sku: "", mrp: "", discountPercent: "0", stock: "10",
  sizes: ["Free size"], department: "women", collection: "", fabric: "", occasion: "", isNew: true, trending: false, active: true, saleEndsAt: "", images: [], colors: [],
};

type Upload = { id: number; name: string; pct: number; error?: string };

export default function ProductForm({ product, groups, onClose, onSaved }: { product?: Product; groups: Collection[]; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState<Draft>(
    product
      ? {
          name: product.name, description: product.description, details: product.details, care: product.care, sku: product.sku ?? "",
          mrp: String(product.mrp), discountPercent: String(product.discountPercent), stock: String(product.stock), sizes: product.sizes,
          department: product.department, collection: product.collection, fabric: product.fabric, occasion: product.occasion,
          isNew: product.isNew, trending: product.trending, active: product.active, saleEndsAt: toLocalInput(product.saleEndsAt),
          images: product.images, colors: product.colors,
        }
      : blank,
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [url, setUrl] = useState("");
  const [customSize, setCustomSize] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const uploading = uploads.some((u) => !u.error);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const mrp = parseFloat(d.mrp) || 0;
  const pct = Math.min(90, Math.max(0, parseFloat(d.discountPercent) || 0));
  const preview = salePrice({ mrp, discountPercent: pct });
  const dept = DEPARTMENTS.find((x) => x.slug === d.department)!;
  const collectionOptions = groups.filter((g) => g.kind === "collection" && g.department === d.department);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    await Promise.all(
      Array.from(files).map(async (f, n) => {
        const id = Date.now() + n;
        setUploads((u) => [...u, { id, name: f.name, pct: 0 }]);
        const r = await uploadImage(f, (pct) => setUploads((u) => u.map((x) => (x.id === id ? { ...x, pct } : x))));
        if ("url" in r) {
          setD((x) => ({ ...x, images: [...x.images, r.url] }));
          setUploads((u) => u.filter((x) => x.id !== id));
        } else setUploads((u) => u.map((x) => (x.id === id ? { ...x, error: r.error } : x)));
      }),
    );
    if (file.current) file.current.value = "";
  }

  const move = (i: number, dir: -1 | 1) =>
    setD((x) => {
      const imgs = [...x.images];
      const j = i + dir;
      if (j < 0 || j >= imgs.length) return x;
      [imgs[i], imgs[j]] = [imgs[j], imgs[i]];
      return { ...x, images: imgs };
    });

  const toggleSize = (s: string) => set("sizes", d.sizes.includes(s) ? d.sizes.filter((x) => x !== s) : [...d.sizes, s]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (d.sizes.length === 0) return setError("Choose at least one size (use “Free size” if it doesn't apply).");
    setBusy(true);
    setError("");
    const payload = { ...d, mrp, discountPercent: pct, stock: parseInt(d.stock) || 0, saleEndsAt: d.saleEndsAt || "" };
    const res = product ? await api(`/api/products/${product.id}`, "PUT", payload) : await api("/api/products", "POST", payload);
    setBusy(false);
    if (res.ok) onSaved();
    else setError(res.error);
  }

  return (
    <div className="a-modal" role="dialog" aria-modal="true" aria-label={product ? "Edit product" : "Add product"}>
      <form className="a-modal__box a-modal__box--lg" onSubmit={save}>
        <div className="a-modal__head">
          <h3>{product ? "Edit product" : "Add product"}</h3>
          <button type="button" className="a-btn a-btn--sm" onClick={onClose}>Close</button>
        </div>
        <div className="a-form">
          <label className="span2">Product name<input value={d.name} onChange={(e) => set("name", e.target.value)} required maxLength={160} /></label>

          <label>Department
            <select value={d.department} onChange={(e) => setD((x) => ({ ...x, department: e.target.value as Department, collection: "", sizes: DEPARTMENTS.find((z) => z.slug === e.target.value)!.sizes.length === 1 ? ["Free size"] : [] }))}>
              {DEPARTMENTS.map((x) => <option key={x.slug} value={x.slug}>{x.label}</option>)}
            </select>
          </label>
          <label>Collection ({dept.label})
            <select value={d.collection} onChange={(e) => set("collection", e.target.value)}>
              <option value="">— none —</option>
              {collectionOptions.map((g) => <option key={g.slug} value={g.slug}>{g.name}{g.active ? "" : " (hidden)"}</option>)}
            </select>
          </label>
          <label>Fabric
            <select value={d.fabric} onChange={(e) => set("fabric", e.target.value)}>
              <option value="">— none —</option>
              {groups.filter((g) => g.kind === "fabric").map((g) => <option key={g.slug} value={g.slug}>{g.name}{g.active ? "" : " (hidden)"}</option>)}
            </select>
          </label>
          <label>Occasion
            <select value={d.occasion} onChange={(e) => set("occasion", e.target.value)}>
              <option value="">— none —</option>
              {groups.filter((g) => g.kind === "occasion").map((g) => <option key={g.slug} value={g.slug}>{g.name}{g.active ? "" : " (hidden)"}</option>)}
            </select>
          </label>

          <label>MRP (₹)<input type="number" min={1} step="1" value={d.mrp} onChange={(e) => set("mrp", e.target.value)} required /></label>
          <label>Discount (%)<input type="number" min={0} max={90} step="0.01" value={d.discountPercent} onChange={(e) => set("discountPercent", e.target.value)} /></label>
          <div className="span2 a-price-preview">
            Customers pay {inr(preview)} {pct > 0 && <span className="a-mute" style={{ fontWeight: 400 }}>· MRP {inr(mrp)} · {Math.round(pct)}% off · saves {inr(mrp - preview)}</span>}
          </div>
          <label>Stock<input type="number" min={0} step="1" value={d.stock} onChange={(e) => set("stock", e.target.value)} /></label>
          <label>SKU (optional)<input value={d.sku} onChange={(e) => set("sku", e.target.value)} maxLength={40} /></label>

          <fieldset className="a-fieldset span2">
            <legend>Sizes available</legend>
            <div className="a-chips">
              {[...new Set([...dept.sizes, ...d.sizes])].map((s) => (
                <button key={s} type="button" className={`a-chip${d.sizes.includes(s) ? " is-on" : ""}`} aria-pressed={d.sizes.includes(s)} onClick={() => toggleSize(s)}>{s}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input style={{ flex: 1 }} placeholder="Custom size (e.g. 38, Free size)" value={customSize} maxLength={20} onChange={(e) => setCustomSize(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (customSize.trim()) { toggleSize(customSize.trim()); setCustomSize(""); } } }} />
              <button type="button" className="a-btn" onClick={() => { if (customSize.trim() && !d.sizes.includes(customSize.trim())) set("sizes", [...d.sizes, customSize.trim()]); setCustomSize(""); }}>Add</button>
            </div>
            <span className="a-mute" style={{ fontSize: 12 }}>Shoppers must pick a size when more than one is selected.</span>
          </fieldset>

          <label className="span2">Sale ends (optional — the product page counts down to this; otherwise it counts down to midnight)
            <input type="datetime-local" value={d.saleEndsAt} onChange={(e) => set("saleEndsAt", e.target.value)} />
          </label>
          <label className="span2">Description<textarea value={d.description} onChange={(e) => set("description", e.target.value)} /></label>
          <label className="span2">Product details (one per line)<textarea value={d.details} onChange={(e) => set("details", e.target.value)} /></label>
          <label className="span2">Care instructions<textarea value={d.care} onChange={(e) => set("care", e.target.value)} /></label>

          <fieldset className="a-fieldset span2">
            <legend>Images (first image is the cover)</legend>
            <div className="a-imgs">
              {d.images.map((src, i) => (
                <div className="a-img" key={src + i}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" />
                  {i === 0 && <span className="a-img__cover">Cover</span>}
                  <button type="button" className="a-img__x" aria-label="Remove image" onClick={() => setD((x) => ({ ...x, images: x.images.filter((_, n) => n !== i), colors: x.colors.map((c) => (c.image === src ? { ...c, image: "" } : c)) }))}>×</button>
                  <div className="a-img__bar">
                    <button type="button" aria-label="Move left" onClick={() => move(i, -1)}>‹</button>
                    <button type="button" aria-label="Move right" onClick={() => move(i, 1)}>›</button>
                  </div>
                </div>
              ))}
              {uploads.map((u) => (
                <div className="a-img a-img--up" key={u.id} title={u.error}>
                  <div className="a-img__ph">{u.error ? "⚠" : `${u.pct}%`}</div>
                  {!u.error && <i style={{ width: `${u.pct}%` }} />}
                  {u.error && <button type="button" className="a-img__x" aria-label="Dismiss" onClick={() => setUploads((x) => x.filter((y) => y.id !== u.id))}>×</button>}
                </div>
              ))}
            </div>
            {uploads.filter((u) => u.error).map((u) => <p key={u.id} className="a-error">{u.name}: {u.error}</p>)}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input ref={file} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden onChange={(e) => upload(e.target.files)} />
              <button type="button" className="a-btn" onClick={() => file.current?.click()} disabled={uploading}>{uploading ? "Uploading…" : "Upload images"}</button>
              <input style={{ flex: 1, minWidth: 160 }} placeholder="…or paste an image URL" value={url} onChange={(e) => setUrl(e.target.value)} />
              <button type="button" className="a-btn" onClick={() => { if (url.trim()) { set("images", [...d.images, url.trim()]); setUrl(""); } }}>Add URL</button>
            </div>
          </fieldset>

          <fieldset className="a-fieldset span2">
            <legend>Colour options (optional)</legend>
            {d.colors.map((c, i) => (
              <div className="a-color" key={i}>
                <input placeholder="Colour name" value={c.name} onChange={(e) => set("colors", d.colors.map((x, n) => (n === i ? { ...x, name: e.target.value } : x)))} />
                <select value={c.image} onChange={(e) => set("colors", d.colors.map((x, n) => (n === i ? { ...x, image: e.target.value } : x)))}>
                  <option value="">Image…</option>
                  {d.images.map((src, n) => <option key={src + n} value={src}>Image {n + 1}</option>)}
                </select>
                <button type="button" className="a-btn a-btn--sm a-btn--danger" onClick={() => set("colors", d.colors.filter((_, n) => n !== i))}>Remove</button>
              </div>
            ))}
            <div><button type="button" className="a-btn a-btn--sm" onClick={() => set("colors", [...d.colors, { name: "", image: d.images[0] ?? "" }])}>+ Add colour</button></div>
          </fieldset>

          <label className="a-check"><input type="checkbox" checked={d.active} onChange={(e) => set("active", e.target.checked)} /> Visible in store</label>
          <label className="a-check"><input type="checkbox" checked={d.isNew} onChange={(e) => set("isNew", e.target.checked)} /> Show “New” badge</label>
          <label className="a-check"><input type="checkbox" checked={d.trending} onChange={(e) => set("trending", e.target.checked)} /> Feature on the home page &amp; sort first</label>
        </div>
        {error && <p className="a-error" role="alert">{error}</p>}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" className="a-btn" onClick={onClose}>Cancel</button>
          <button className="a-btn a-btn--primary" type="submit" disabled={busy || uploading}>{busy ? "Saving…" : "Save product"}</button>
        </div>
      </form>
    </div>
  );
}
