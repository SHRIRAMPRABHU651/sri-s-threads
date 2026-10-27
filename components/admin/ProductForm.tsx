"use client";

import { useRef, useState } from "react";
import type { Collection, Product } from "@/lib/types";
import { inr, salePrice } from "@/lib/shared";
import { api } from "./api";
import { uploadImage } from "./uploadImage";

const toLocalInput = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
};

type Draft = {
  name: string; description: string; details: string; care: string; mrp: string; discountPercent: string; stock: string;
  size: string; collection: string; fabric: string; occasion: string;
  isNew: boolean; trending: boolean; active: boolean; saleEndsAt: string; images: string[]; colors: { name: string; image: string }[];
};

const blank: Draft = {
  name: "", description: "", details: "", care: "", mrp: "", discountPercent: "0", stock: "10", size: "Free size",
  collection: "", fabric: "", occasion: "", isNew: true, trending: false, active: true, saleEndsAt: "", images: [], colors: [],
};

export default function ProductForm({ product, groups, onClose, onSaved }: { product?: Product; groups: Collection[]; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState<Draft>(
    product
      ? {
          name: product.name, description: product.description, details: product.details, care: product.care,
          mrp: String(product.mrp), discountPercent: String(product.discountPercent), stock: String(product.stock), size: product.size,
          collection: product.collection, fabric: product.fabric, occasion: product.occasion,
          isNew: product.isNew, trending: product.trending, active: product.active, saleEndsAt: toLocalInput(product.saleEndsAt),
          images: product.images, colors: product.colors,
        }
      : blank,
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState("");
  const file = useRef<HTMLInputElement>(null);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const mrp = parseFloat(d.mrp) || 0;
  const pct = Math.min(90, Math.max(0, parseFloat(d.discountPercent) || 0));
  const preview = salePrice({ mrp, discountPercent: pct });

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError("");
    for (const f of Array.from(files)) {
      const r = await uploadImage(f);
      if ("url" in r) setD((x) => ({ ...x, images: [...x.images, r.url] }));
      else setError(r.error);
    }
    setUploading(false);
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

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const payload = { ...d, mrp: mrp, discountPercent: pct, stock: parseInt(d.stock) || 0, saleEndsAt: d.saleEndsAt || "" };
    const res = product ? await api(`/api/products/${product.id}`, "PUT", payload) : await api("/api/products", "POST", payload);
    setBusy(false);
    if (res.ok) onSaved();
    else setError(res.error);
  }

  return (
    <div className="a-modal" role="dialog" aria-modal="true" aria-label={product ? "Edit product" : "Add product"}>
      <form className="a-modal__box" onSubmit={save}>
        <div className="a-modal__head">
          <h3>{product ? "Edit product" : "Add product"}</h3>
          <button type="button" className="a-btn a-btn--sm" onClick={onClose}>Close</button>
        </div>
        <div className="a-form">
          <label className="span2">Product name<input value={d.name} onChange={(e) => set("name", e.target.value)} required maxLength={160} /></label>
          <label>MRP (₹)<input type="number" min={1} step="1" value={d.mrp} onChange={(e) => set("mrp", e.target.value)} required /></label>
          <label>Discount (%)<input type="number" min={0} max={90} step="0.01" value={d.discountPercent} onChange={(e) => set("discountPercent", e.target.value)} /></label>
          <div className="span2 a-price-preview">
            Customers pay {inr(preview)} {pct > 0 && <span className="a-mute" style={{ fontWeight: 400 }}>· MRP {inr(mrp)} · {Math.round(pct)}% off</span>}
          </div>
          <label>Stock<input type="number" min={0} step="1" value={d.stock} onChange={(e) => set("stock", e.target.value)} /></label>
          <label>Size<input value={d.size} onChange={(e) => set("size", e.target.value)} maxLength={60} /></label>
          <label>Collection (e.g. Sarees, Chudidhar, Kurtis)
            <select value={d.collection} onChange={(e) => set("collection", e.target.value)}>
              <option value="">— none —</option>
              {groups.filter((g) => g.kind === "collection").map((g) => <option key={g.slug} value={g.slug}>{g.name}{g.active ? "" : " (hidden)"}</option>)}
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
                  <button type="button" className="a-img__x" aria-label="Remove image" onClick={() => setD((x) => ({ ...x, images: x.images.filter((_, n) => n !== i), colors: x.colors.map((c) => (c.image === src ? { ...c, image: "" } : c)) }))}>×</button>
                  <div className="a-img__bar">
                    <button type="button" aria-label="Move left" onClick={() => move(i, -1)}>‹</button>
                    <button type="button" aria-label="Move right" onClick={() => move(i, 1)}>›</button>
                  </div>
                </div>
              ))}
            </div>
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
          <label className="a-check"><input type="checkbox" checked={d.trending} onChange={(e) => set("trending", e.target.checked)} /> Show in “Trending” sections</label>
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
